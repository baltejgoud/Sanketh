# PRISMA — Complete Project Overview

## What is PRISMA?

PRISMA is an **Enterprise Multi-Industry Predictive Analytics & Supply Chain SaaS platform**. It is a vertically-integrated, multi-tenant software product that helps businesses in multiple industries predict demand, manage inventory, detect shortages, understand market trends, and optimize their supply chains — all from a single unified platform.

Think of it as the "brain" for a company's operations team: it ingests data from your e-commerce store, warehouses, and the broader market; runs sophisticated AI/ML forecasting models; and surfaces actionable intelligence through a rich real-time dashboard.

---

## The Three Core Industry Verticals

PRISMA is designed for **five industries** (with three primary/launch verticals):

| Industry Code | Description |
|---|---|
| **fashion** | Apparel & Fashion — trend-driven, seasonal, SKU proliferation challenges |
| **electronics** | Consumer Electronics — short product cycles, high value, import sensitivity |
| **pharma** | Pharmaceuticals — GxP / 21 CFR Part 11 compliant, cold-chain, batch tracking |
| **agrocenter** | Agricultural / Garden Center — weather-driven, seasonal commodities |
| **hardware** | Hardware / Tools — project-driven, long tail SKU management |

Each industry has its own API router, ML training configuration, and industry-specific UI screens.

---

## Platform Architecture (3-Tier)

```
┌────────────────────────────────────────────────────────────────────┐
│                       PRISMA Platform                              │
├─────────────────┬──────────────────────────┬───────────────────────┤
│   React SPA     │   FastAPI Backend         │    ML Inference API   │
│   (port 5173)   │   (port 8000)             │    (port 8001)        │
│   Vite + React  │   • Multi-tenant RLS      │    • Trained ensemble │
│   TypeScript    │   • Industry router       │    • Chronos zero-shot│
│   TailwindCSS   │   • GxP batch audit       │    • Per-SKU routing  │
│   Zustand state │   • WebSocket pub/sub     │                       │
└────────┬────────┴────────────┬─────────────┴──────────┬────────────┘
         │                     │                        │
         └─────────────────────┴────────┬───────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │  PostgreSQL 16 +   │
                              │  pgvector + RLS    │
                              │  Redis (pub/sub,   │
                              │  rate limiting,    │
                              │  job queue)        │
                              └────────────────────┘
```

**Infrastructure:** Docker Compose (local), Kubernetes manifests (production), Nginx reverse proxy, Prometheus metrics, Grafana dashboards, GitHub Actions CI/CD, Alembic database migrations.

---

## Backend (FastAPI + PostgreSQL)

### Technology Stack
- **Framework:** FastAPI (Python async)
- **ORM:** SQLAlchemy 2.0 (async)
- **Database:** PostgreSQL 16 with pgvector extension and Row-Level Security (RLS)
- **Auth:** Firebase Auth (production) + Argon2id local fallback, JWT tokens (60-min access, 30-day refresh with rotation)
- **Job Queue:** arq (async Redis Queue) for durable background forecast runs
- **Real-time:** WebSocket (per-tenant fan-out via Redis pub/sub)
- **HTTP Client:** httpx (async, connection pooled)
- **Logging:** structlog (JSON structured logs)
- **Observability:** prometheus_client, OTLP traces, MLflow run tracking

### Middleware Stack (innermost → outermost)
1. `TenantContextMiddleware` — extracts `tid`, `ind`, `role` from JWT, sets request state
2. `RegionRouterMiddleware` — routes requests to correct deploy region
3. `UsageMeteringMiddleware` — records API calls to usage_events table
4. `RateLimitMiddleware` — per-tenant rate limiting (Redis or in-process)
5. `SecurityHeadersMiddleware` — HSTS, CSP headers
6. `CORSMiddleware` — explicit allow-list, not wildcard

---

## Database Models (PostgreSQL)

### 1. Tenant & User Management

#### `Tenant`
The top-level organizational boundary. Every piece of data is scoped to a tenant.
- `slug` (CITEXT, unique) — URL-safe identifier
- `tier` — `growth | scale | enterprise`
- `status` — `trial | active | suspended | cancelled`
- `industries` — array of enabled industry codes
- `active_industry` — current active vertical
- `max_skus`, `max_users`, `data_retention_days` — plan limits
- `settings` (JSONB) — per-tenant configuration
- `trial_ends_at`, `contract_ends_at` — lifecycle dates

#### `User`
Belongs to one tenant.
- `firebase_uid` — links to Firebase Auth identity
- `password_hash` (Argon2id) — local dev fallback
- `role` — `owner | admin | analyst | viewer | api_service`
- `active_industry` — per-user default industry
- `mfa_secret`, `mfa_enabled` — TOTP MFA support
- `last_login_at` — session tracking

#### `RefreshToken`
Stored as sha256 hash only (never plaintext). Tracks IP, user-agent, expiry and revocation.

---

### 2. Product Catalog

#### `Product`
The product master record. Industry-scoped.
- `name`, `brand`, `category`, `subcategory`
- `status` — `active | discontinued | seasonal | clearance | pre_launch`
- `attributes` (JSONB) — flexible per-industry metadata (e.g., colorway, screen size, NDC code)

#### `Sku`
A specific sellable variant under a Product.
- `sku_code`, `gtin` — identifiers
- `unit_cost`, `unit_price`, `currency`
- `lead_time_days`, `moq` (minimum order quantity)
- `safety_stock`, `reorder_point` — inventory policy parameters
- `attributes` (JSONB) — variant-specific metadata (size, color, dosage strength, etc.)

---

### 3. Sales & Revenue

#### `HistoricalSale`
Partitioned by `sale_time` (RANGE partitioning for performance at scale). No FK constraints to support partitioning.
- `channel` — e.g., `shopify`, `wholesale`, `direct`
- `region` — geographic region
- `units_sold`, `gross_revenue`, `net_revenue`
- `returns`, `promo_flag`, `markdown_pct`

---

### 4. Inventory

#### `InventoryLevel`
One row per `(tenant, sku, location)` — the current stock position.
- `on_hand_units` — physical stock
- `inbound_units` — units in transit / on order
- `reserved_units` — units committed to orders
- `available_units` — computed property: `on_hand - reserved` (the sellable stock)
- `as_of` — timestamp of last measurement
- `source` — `manual | shopify | erp | api`

---

### 5. Forecasting

#### `ForecastRun`
Audit record for each forecast job execution.
- `industry`, `run_name`, `model_stack` (array of model names used)
- `horizon_weeks`, `granularity`, `filters`
- `status` — `pending | running | completed | failed`
- `triggered_by` — user who initiated
- `metrics` (JSONB) — accuracy metrics (MASE, sMAPE, CRPS)
- `artifact_path` — path to serialized model bundle

#### `ForecastResult`
Partitioned by `forecast_date`. One row per SKU per forecast date.
- `p10`, `p50`, `p90` — probabilistic quantile predictions
- `model_name` — which model produced this row

#### `HybridForecastRun`
Audit row for the advanced hybrid (ML + trend signals) forecast pipeline.
- Stores the trend score, signal volatility, and alpha/beta adjuster parameters
- Full result payload (JSONB) for status polling without re-computation
- Lifecycle: `pending → running → completed | failed`

---

### 6. Trend Intelligence

#### `TrendSignal`
A normalized external signal observation. Can be global (visible to all tenants of matching industry) or tenant-specific.
- `source` — `fred | google_trends | reddit | twitter | news_api | rss | pinterest | tiktok | instagram | weather | competitor_price | fda | logistics | synthetic`
- `kind` — `economic_indicator | social_buzz | search_interest | news_sentiment | commodity_price`
- `series_key` — e.g., `FRED:UNRATE`, `GTRENDS:sneakers`
- `normalized_score` — standardized -1 to +1 impact score
- `confidence` — signal reliability score
- `payload` (JSONB) — raw source data

#### `SignalCluster`
Groups related signals using vector embeddings (pgvector, 768-dimensional).
- `centroid_embedding` — cluster centroid (Vector(768))
- `cohesion_score` — intra-cluster similarity

---

### 7. Alerts

#### `AlertRule`
Per-tenant configurable thresholds for shortage detection.
- `warn_coverage_days`, `critical_coverage_days` — trigger thresholds
- `trend_weight` (default 0.30), `p90_weight` (0.40), `inventory_weight` (0.30) — risk score formula weights
- `cooldown_minutes` — de-duplication cooldown
- `notify_webhook`, `notify_websocket` — delivery channels

#### `ShortageAlert`
A fired shortage event.
- `severity` — `info | warning | critical`
- `status` — `open | acknowledged | resolved | suppressed`
- `risk_score` — computed composite risk
- `coverage_days` — days of stock remaining at forecasted demand
- `p10_demand`, `p50_demand`, `p90_demand` — demand quantiles at alert time
- `trend_score` — market signal context
- `drivers` (JSONB array) — which signals drove the alert
- `acknowledged_by`, `resolved_at`, `resolution_note` — workflow fields

---

### 8. External Signals (Real-time Ingestion)

#### `ExternalSignal`
Structured external signals with validation lifecycle.
- `signal_type` — `weather | trend_search | social_sentiment | competitor_price | macro_economic | regulatory | supplier_lead | logistics_disruption`
- `status` — `pending | validated | rejected | expired`
- `processed_value`, `sentiment_score`, `impact_weight`
- `validated_by`, `validated_at` — human-in-the-loop validation support

---

### 9. Pharma-Specific (GxP / 21 CFR Part 11)

#### `PharmaBatch`
Pharmaceutical batch/lot tracking with full regulatory compliance.
- `lot_number`, `ndc_code` — regulatory identifiers
- `manufactured_at`, `expiry_date` — lifecycle dates
- `quantity_produced`, `quantity_remaining`
- `gxp_status` — `quarantine | released | rejected | recalled | expired`
- `cold_chain_required`, `storage_temp_min_c`, `storage_temp_max_c` — cold chain management
- `qa_released_by`, `qa_released_at` — QA release with role-based authorization (admin/owner only)
- `recall_reason`, `recalled_at` — recall management
- `certificate_url` — CoA (Certificate of Analysis) storage

> All pharma write operations create immutable audit trail entries via PostgreSQL append-only RULE.

---

### 10. Billing & Usage Metering

#### `Plan`
Subscription plan definition.
- `tier`, `base_price_cents`, `billing_interval`
- `stripe_price_id` — Stripe integration
- `included_quotas` (JSONB) — what's included
- `overage_rates_cents` (JSONB) — per-unit overage pricing

#### `Subscription`
Per-tenant subscription state.
- `status` — `trialing | active | past_due | paused | cancelled | incomplete`
- `stripe_customer_id`, `stripe_subscription_id`
- `current_period_start/end`, `cancel_at_period_end`

#### `UsageEvent`
Immutable metering record (partitioned). Every API call, forecast row, training minute, signal ingest, active SKU, and user seat is tracked.
- `meter` — `api_request | forecast_row | training_minute | signal_ingest | active_sku | user_seat`
- `quantity`, `occurred_at`
- `idempotency_key` — prevents double-counting

---

### 11. Integrations & Webhooks

#### `IntegrationConnection`
Per-tenant connection to an external data provider.
- `provider` — e.g., `shopify` (text, not enum — adding providers doesn't require a migration)
- `status` — `connected | syncing | error | disconnected`
- `access_token_encrypted` — encrypted with platform key
- `state` (JSONB) — sync cursor for incremental pulls
- `last_sync_stats` (JSONB) — row counts from last sync run

#### `WebhookEndpoint` + `WebhookDelivery`
Outbound webhook delivery with retry logic. Tracks HMAC signing, delivery attempts, response codes, and retry scheduling.

---

### 12. Industry Profile

#### `IndustryProfile`
Per-tenant, per-industry configuration including SKU attribute schema, default forecast horizon, required signal types, model preferences, and audit level.

---

## ML Stack (Python — `prisma_ml` package)

The ML API runs as a **separate FastAPI microservice** on port 8001, isolated from the main backend.

### Model Families

#### Foundation Models (Zero-shot capable)
| Model | Description |
|---|---|
| **Chronos** | Amazon's time-series foundation model. Primary zero-shot forecaster. Produces probabilistic quantiles directly. |
| **Lag-Llama** | Lag-Llama transformer for time series. |
| **Moirai** | Unified training time-series foundation model (Salesforce). |
| **TimesFM** | Google's time series foundation model. |

#### Deep Learning Models
| Model | Description |
|---|---|
| **TFT** | Temporal Fusion Transformer — interpretable attention-based model, excels with covariates. |
| **DeepAR** | Amazon's probabilistic RNN autoregressive model. |
| **N-HiTS** | Neural Hierarchical Interpolation for Time Series — efficient multi-scale model. |

#### Gradient Boosting
| Model | Description |
|---|---|
| **LightGBM** | LightGBM-based forecaster. Feature-engineered tabular approach. Handles many features and lag windows efficiently. |

#### Statistical Models
| Model | Description |
|---|---|
| **ETS** | Exponential Smoothing (Error-Trend-Seasonality). Strong for regular seasonal series. |
| **Croston** | Croston's method for intermittent/sparse demand (e.g., low-volume pharma SKUs). |
| **ADIDA** | Aggregated-Disaggregated Intermittent Demand Approach. Pairs with Croston for sporadic demand. |
| **Naive** | Seasonal naive baseline — used as a benchmark. |

#### Ensemble
**`StackedEnsemble`** — Combines all model predictions using SLSQP (Sequential Least Squares Programming) optimization to find convex weights that minimize pinball loss on the holdout window. This is the primary production forecaster.

#### Anomaly Detection
**`AnomalyDetector`** — Flags anomalous sales data points before training to prevent corrupted data from distorting models.

#### Price Elasticity
**`PriceElasticityModel`** — Estimates demand sensitivity to price changes per SKU. Used in what-if scenario modeling.

#### Meta-Learner
**`MetaLearner`** — Selects the best model family per SKU based on time-series characteristics (trend, seasonality, intermittency, length).

---

### ML Pipeline (5-Stage Training)

```
Stage 1 — DATA
  HistoricalSalesLoader pulls sales panel
  Intermittency classification (Croston triggers for sparse SKUs)
  Feature engineering (lag windows, seasonality, promotions, signals)

Stage 2 — PRE-TRAIN
  Registry instantiates models per industry configuration
  Foundation models initialized (Chronos loaded from HuggingFace)

Stage 3 — DOMAIN FIT
  Each model trained on tenant's historical panel
  Cross-validation folds generated

Stage 4 — STACK
  StackedEnsemble.fit() → SLSQP minimizes pinball loss
  Convex weights determined for each model

Stage 5 — VALIDATE
  Walk-forward backtest across holdout window
  Metrics: MASE, sMAPE, CRPS, pinball loss
  Results logged to MLflow
```

### Zero-Shot Fallback (`ZeroShotForecaster`)
When no trained artifact exists for a tenant/industry, Chronos runs zero-shot inference directly on the raw series. This enables **Day-1 forecasting** without any training data.

---

### Causal AI

#### `DoWhy Pipeline`
Uses Microsoft's DoWhy library to estimate causal effects of interventions (promotions, price changes, supply disruptions) on demand using structural causal models and counterfactual inference.

#### `Uplift Model`
Estimates the incremental effect of treatments (e.g., "what would sales have been without this promotion?") using uplift modeling.

---

### Supply Chain Optimization

| Module | Algorithm | Purpose |
|---|---|---|
| **EOQ** | Economic Order Quantity | Optimal order size balancing ordering vs. holding costs |
| **Replenishment** | Reorder-point / safety stock | Automated replenishment recommendations |
| **RL Replenishment** | Reinforcement Learning | Adaptive replenishment policy learning |
| **Multi-Echelon** | Network optimization | Multi-warehouse inventory allocation |
| **Markdown** | Price optimization | End-of-season markdown scheduling for fashion |

---

### Hybrid Forecast (ML + Trend Fusion)

The most sophisticated pipeline in PRISMA:

1. **Load SKUs** from the tenant's catalog
2. **Fetch ML baseline** from the ML API (Chronos or trained ensemble → p10/p50/p90)
3. **Load trend signals** (last 7 days from `trend_signals` table)
4. **Fuse** using `HybridForecaster`:
   - Computes a composite trend score from all signals
   - Applies `alpha` (trend weight) and `beta` (volatility dampener) adjusters
   - Generates **3 scenarios**: bull (high-demand), base, bear (conservative)
5. **Shortage scan** using `ShortageDetector` against real inventory levels
6. Emits **real-time progress events** via WebSocket as stages complete
7. Persists full result + audit params to `hybrid_forecast_runs`

---

### Signal Ingestion Pipeline

Runs as a background async service, polling every 15 minutes (configurable):
- **FRED** (Federal Reserve Economic Data) — macro economic indicators
- **Google Trends** — search interest signals
- **Reddit** — social sentiment analysis
- **Shopify** — near-real-time sales polling (separate poller, configurable interval)
- **Weather** — weather event signals
- **Competitor Price** — competitive intelligence
- **FDA** — regulatory alerts (for pharma)
- **Logistics** — supply disruption signals

---

## API Endpoints (FastAPI Routers)

All API endpoints live under `/api/v1`.

| Router | Prefix | Purpose |
|---|---|---|
| `auth` | `/auth` | Login, logout, refresh, MFA, Firebase token exchange |
| `products` | `/products` | CRUD for product catalog |
| `skus` | `/skus` | CRUD for SKU management |
| `signals` | `/signals` | External signal management |
| `trends` | `/trends` | Trend signal ingestion and queries |
| `hybrid_forecast` | `/forecast/hybrid` | Hybrid ML+trend forecast runs |
| `shortage_alerts` | `/alerts` | Shortage alert management and acknowledgment |
| `anomaly` | `/anomaly` | Anomaly detection queries |
| `inventory` | `/inventory` | Inventory level management |
| `financial` | `/financial` | Financial impact analytics |
| `sales_analytics` | `/sales` | Sales analytics and KPIs |
| `forecast_accuracy` | `/forecast/accuracy` | Model accuracy metrics and comparisons |
| `cross_industry` | `/cross-industry` | Cross-vertical correlation analysis |
| `export` | `/export` | Data export (CSV, Excel, PDF) |
| `integrations` | `/integrations` | Shopify and other provider connections |
| `billing` | `/billing` | Subscription and usage management |
| `webhooks` | `/webhooks` | Outbound webhook management |
| `industry_router` | `/industry` | Active industry switching |
| `fashion` | `/fashion` | Fashion-specific endpoints |
| `electronics` | `/electronics` | Electronics-specific endpoints |
| `pharma` | `/pharma` | Pharma GxP endpoints (batch, release, recall) |
| `agrocenter` | `/agrocenter` | Agrocenter-specific endpoints |
| `hardware` | `/hardware` | Hardware-specific endpoints |
| `websocket` | `/ws` | WebSocket real-time connection |
| `demo_request` | `/demo` | Landing page demo request capture |

---

## Frontend (React + TypeScript)

**Technology:** Vite + React 18 + TypeScript + TailwindCSS + Zustand state management

### Pages / Screens

| Page | Description |
|---|---|
| **LandingPage** | Marketing site (52KB) — the public-facing product page with hero, features, pricing, social proof |
| **Login** | Firebase Google OAuth + email/password sign-in with 2FA |
| **Dashboard** | Main app shell routing to sub-pages |
| **Forecasts** | SKU-level forecast viewer with confidence bands (p10/p50/p90) |
| **HybridForecasts** | Interactive hybrid forecast runner — shows trend score, 3 scenarios, real-time progress |
| **TrendAnalysis** | Comprehensive trend signal visualization (132KB — largest page!) |
| **SalesAnalytics** | Revenue KPIs, channel breakdown, promo lift analysis |
| **Inventory** | Warehouse stock levels, coverage days, replenishment suggestions |
| **Products** | Product catalog browser with filtering and inline editing |
| **Skus** | SKU management grid — cost, price, lead time, safety stock |
| **ShortageAlerts** | Real-time shortage alert inbox with acknowledge/resolve workflow |
| **ForecastAccuracy** | Model accuracy comparison — MASE, sMAPE, CRPS by model |
| **CrossIndustryCorrelation** | Correlations between fashion/electronics/pharma demand signals |
| **FinancialImpact** | Dollar value of stockouts, overstock cost, forecast-driven savings |
| **LiveSales** | Real-time sales ticker (WebSocket) |
| **WhatIfScenario** | Interactive price elasticity + scenario modeler |
| **Signals** | External signal browser |
| **PharmaBatches** | GxP batch list with status, cold chain, QA release |
| **Integrations** | Connect/disconnect Shopify, view sync status |
| **Billing** | Subscription management, usage meters, plan upgrade |
| **Webhooks** | Webhook endpoint CRUD with delivery history |
| **Settings** | Tenant and user preferences |

### Component Libraries
- **Charts** — custom chart components (built on Recharts/D3)
- **Dashboard** — metric cards, KPI panels
- **Alerts** — shortage alert cards
- **Signals** — signal feed components
- **Realtime** — WebSocket connection manager, live event consumers
- **Auth** — Firebase auth context, protected route wrapper
- **Layout** — sidebar navigation, top header, breadcrumbs
- **UI** — button, badge, modal, table, input primitives

---

## Security Architecture

| Concern | Implementation |
|---|---|
| **Password hashing** | Argon2id (configurable cost parameters) |
| **Access tokens** | JWT HS256, 60-minute expiry |
| **Refresh tokens** | 30-day, rotation on use, stored as sha256 hash only |
| **Multi-tenancy** | PostgreSQL RLS — `tenant_id = current_tenant_id()` on every table |
| **Audit trail** | `audit_log` append-only via PostgreSQL RULE (UPDATE/DELETE are no-ops) |
| **GxP compliance** | Pharma QA release requires admin/owner role + cold chain presence checks |
| **Container security** | Non-root user, read-only rootfs, all Linux capabilities dropped |
| **Network policy** | Default deny, explicit allow only between adjacent tiers |

---

## Observability Stack

| Signal | Source | Destination |
|---|---|---|
| **Structured logs** | structlog JSON | stdout → Loki / CloudWatch |
| **Metrics** | prometheus_client at `/metrics` | Prometheus → Grafana |
| **Traces** | OTLP/gRPC | OpenTelemetry Collector |
| **Audit trail** | `audit_log` table | PostgreSQL |
| **ML experiment tracking** | MLflow SDK | Volume-mounted file backend |

---

## How It Executes — Data Flow End-to-End

### Flow 1: Onboarding a Tenant
```
1. Admin creates Tenant row (slug, tier, industries, active_industry)
2. Admin creates User rows with Firebase UIDs
3. Shopify integration connected → IntegrationConnection row created
4. Shopify historical backfill runs → HistoricalSale rows inserted, InventoryLevel upserted
5. ML training triggered → ForecastRun created, models trained, artifact serialized
6. Zero-shot Chronos forecast generated for immediate Day-1 value
```

### Flow 2: Hybrid Forecast Run (the core value loop)
```
User triggers "Run Hybrid Forecast" in UI
  → POST /api/v1/forecast/hybrid (FastAPI)
  → HybridForecastRun row inserted (status=pending)
  → arq enqueues job (durable, survives restarts)
  → Worker executes compute_hybrid_forecast():
      1. Load active SKUs from DB (RLS scoped)
      2. POST to ML API → Chronos or trained ensemble → p10/p50/p90 per SKU
      3. Load trend signals from last 7 days (FRED, Google Trends, sentiment)
      4. HybridForecaster.fuse() → composite trend score + scenarios
      5. ShortageDetector.scan_portfolio() → risk scores per SKU
      6. AlertPublisher.publish_many() → ShortageAlert rows + WebSocket events
      7. HybridForecastRun updated (status=completed, result JSONB)
      8. EVENT_FORECAST_COMPLETED broadcast → all connected UI clients refresh
User sees: live progress bar → bull/base/bear scenarios → shortage badges
```

### Flow 3: Shopify Live Sales
```
ShopifySalesPoller runs every N seconds (configurable)
  → Fetches new orders from Shopify API
  → Inserts HistoricalSale rows
  → Upserts InventoryLevel rows
  → Emits WebSocket event: new_sale
  → LiveSales page ticker updates in real-time
```

### Flow 4: Signal Ingestion
```
SignalIngestionPipeline runs every 15 minutes
  → Fetches FRED economic indicators (CPI, PPI, unemployment)
  → Fetches Google Trends interest scores
  → Fetches Reddit sentiment scores
  → Normalizes to -1..+1 scale
  → Inserts TrendSignal rows
  → Grouped into SignalClusters via pgvector similarity
  → Available immediately for next hybrid forecast run
```

---

## Expected Results & What You Can Do With Them

### 1. Probabilistic Demand Forecasts (p10 / p50 / p90)
**Result:** For each SKU, a weekly demand forecast with 10th, 50th, and 90th percentile estimates.

**What you can do:**
- Plan **conservative inventory** using p90 (avoid stockouts)
- Plan **lean inventory** using p10 (minimize holding cost)
- Set **dynamic safety stock** that auto-adjusts with forecast confidence
- Identify which SKUs need urgent replenishment orders

### 2. Hybrid Forecast with 3 Scenarios
**Result:** Bull (upside), Base, and Bear (downside) demand scenarios driven by real market signals.

**What you can do:**
- Run **S&OP (Sales & Operations Planning)** meetings with quantified uncertainty ranges
- Allocate production capacity across scenarios (expected value vs. worst-case)
- Set **hedge inventory positions** — stock the midpoint, order optionally to the bull level
- Present board-level demand uncertainty in a defensible, data-driven format

### 3. Shortage Alerts (Real-time)
**Result:** Risk-scored alerts (info / warning / critical) per SKU showing coverage days remaining, demand drivers, and trend context.

**What you can do:**
- Know **5-14 days in advance** when a stockout is coming (not after it happens)
- Prioritize which SKUs need emergency purchase orders
- Trigger **automated replenishment workflows** via webhooks to your ERP/WMS
- Track alert → acknowledge → resolve workflow for accountability

### 4. Trend Intelligence
**Result:** Normalized market signals (social buzz, macro indicators, search interest, competitor pricing, weather, regulatory changes) correlated to your SKUs.

**What you can do:**
- Detect an emerging viral trend **before** it hits your sales
- Adjust open purchase orders when macro signals deteriorate
- Understand which external factors are driving your demand spikes/dips
- Get early warning on FDA regulatory actions (pharma vertical)

### 5. Sales Analytics & Financial Impact
**Result:** Revenue KPIs, gross margin, channel performance, promo lift measurement, and dollar value of forecast-driven actions.

**What you can do:**
- Quantify **ROI of PRISMA itself** (stockout cost avoided, overstock reduction)
- Identify best/worst performing channels and regions
- Measure promo effectiveness with causal counterfactual analysis (DoWhy)
- Report on net revenue impact of supply chain decisions

### 6. Forecast Accuracy Metrics
**Result:** MASE, sMAPE, CRPS scores per model, per SKU category, over time.

**What you can do:**
- Know which model family works best for which SKU type in your catalog
- Detect model drift (accuracy degrading → trigger re-training)
- Give the ML team a measurable performance target
- Audit forecast quality for regulatory submissions (pharma)

### 7. Pharma GxP Batch Management
**Result:** Full lot traceability, cold chain validation, QA release workflow, and recall management.

**What you can do:**
- Demonstrate **21 CFR Part 11** compliance to FDA auditors
- Execute QA-controlled batch release with immutable audit trail
- Manage cold-chain drugs with temperature range enforcement
- Execute recall across all affected lots with complete documentation

### 8. Cross-Industry Correlation
**Result:** Correlation matrix between demand signals across fashion, electronics, and pharma.

**What you can do:**
- Discover unexpected leading indicators (e.g., consumer electronics demand predicting fashion accessory demand)
- Build multi-vertical demand sensing for conglomerates operating in multiple industries
- Identify macro-economic cycles affecting all your verticals simultaneously

### 9. Supply Chain Optimization
**Result:** EOQ recommendations, reorder points, replenishment schedules, markdown calendars (fashion), multi-warehouse allocation.

**What you can do:**
- **Automatically generate purchase orders** at optimal quantities
- Run end-of-season markdown optimization to maximize margin on fashion inventory
- Allocate stock across warehouses to minimize fulfillment costs
- Feed recommendations directly into your ERP via outbound webhooks

### 10. Real-time Shopify Integration
**Result:** Live sales feed + automatic inventory sync without manual data uploads.

**What you can do:**
- Eliminate the daily/weekly data export-import cycle
- React to sales velocity changes in near-real-time
- Keep forecast baselines always current with latest orders

---

## Development Phases Summary

| Phase | Deliverables |
|---|---|
| **Phase 0** | Marketing landing page (`index.html`) — the public product presence |
| **Phase 1** | PostgreSQL schema with RLS, ENUMs, partitioned tables, pgvector; FastAPI multi-tenant backend with all models, auth, and routers |
| **Phase 2** | Full ML stack: foundation / deep / GBT / statistical models; 5-stage training pipeline; causal inference; supply chain optimization; ML Inference API |
| **Phase 3** | React dashboard wired to both APIs; all 23 pages; real-time WebSocket integration |
| **Phase 3.5** | Zero-shot Chronos fallback in inference API — Day-1 forecasting without training data |
| **Phase 4** | Docker Compose + Kubernetes manifests + CI/CD + Prometheus + Grafana + Alembic migrations + test suite + full documentation |

---

## Quick Reference: Key Ports

| Service | Port | Access |
|---|---|---|
| Frontend (React) | 8080 (nginx) / 5173 (dev) | `http://localhost:8080` |
| Backend API | 8000 | `http://localhost:8000/docs` |
| ML Inference API | 8001 | `http://localhost:8001/health` |
| Prometheus | 9090 | `http://localhost:9090` |
| Grafana | 3000 | `http://localhost:3000` (admin/prisma) |
| PostgreSQL | 5432 | Internal only |
| Redis | 6379 | Internal only |
