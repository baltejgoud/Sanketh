// --- PRISMA Presentation App Logic ---

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Page Scroll Reveals
  initScrollReveal();

  // Initialize all interactive sections
  initLiveSalesTicker();
  initIndustrySwitcher();
  initMLPipeline();
  initForecastSimulator();
  initDbExplorer();
  initPharmaDemo();
  initCausalSandbox();
  initRoiCalculator();
});

// ==========================================
// Indian Currency Formatter (Lakh / Crore)
// ==========================================
function formatINR(num) {
  let x = Math.round(num).toString();
  let lastThree = x.substring(x.length - 3);
  let otherNumbers = x.substring(0, x.length - 3);
  if (otherNumbers != '') lastThree = ',' + lastThree;
  let res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return '₹' + res;
}

// ==========================================
// 1. Scroll Reveal Animations (Intersection Observer)
// ==========================================
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach(el => observer.observe(el));
}

// ==========================================
// 2. Live WebSocket Sales Ticker Simulation
// ==========================================
function initLiveSalesTicker() {
  const ticker = document.getElementById('live-sales-ticker');
  if (!ticker) return;

  const skuList = {
    fashion: ['FSH-DRS-VEL-RED', 'FSH-JCK-DNM-BLU', 'FSH-SHOE-RUN-WHT'],
    electronics: ['ELE-MAC-M3-512', 'ELE-PHN-15P-256', 'ELE-EAR-WRL-ANC'],
    pharma: ['PHA-AMX-250-100', 'PHA-INS-GLA-3ML', 'PHA-MET-500-200'],
    agrocenter: ['AGR-SPL-ORG-10L', 'AGR-SEED-TMT-50G', 'AGR-FERT-BIO-20K'],
    hardware: ['HWD-DRL-18V-BRS', 'HWD-HAM-CLW-16O', 'HWD-SAW-CIRC-7']
  };

  const channels = ['Shopify', 'Wholesale', 'Direct', 'Amazon Store'];
  
  function generateSaleItem() {
    // Select industry randomly
    const industries = Object.keys(skuList);
    const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
    const skus = skuList[randomIndustry];
    const sku = skus[Math.floor(Math.random() * skus.length)];
    
    const qty = Math.floor(Math.random() * 8) + 1;
    // Updated to INR-based values for Indian Market
    const priceRange = { fashion: 4200, electronics: 65000, pharma: 1100, agrocenter: 650, hardware: 3500 };
    const price = priceRange[randomIndustry] * qty;
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const item = document.createElement('div');
    item.className = 'ticker-item';
    item.style.borderLeft = `3px solid var(--theme-color)`;
    item.innerHTML = `
      <div>
        <span class="sku">${sku}</span>
        <span class="units">(${qty} units via ${channel})</span>
      </div>
      <div>
        <span class="revenue">${formatINR(price)}</span>
        <span class="time">${time}</span>
      </div>
    `;

    ticker.prepend(item);
    
    // Maintain maximum 10 elements to prevent DOM bloat
    if (ticker.children.length > 10) {
      ticker.removeChild(ticker.lastChild);
    }
  }

  // Pre-populate ticker
  for (let i = 0; i < 6; i++) {
    generateSaleItem();
  }

  // Add new sale every 2.5 seconds
  setInterval(generateSaleItem, 2500);
}

// ==========================================
// 3. Multi-Industry Switcher
// ==========================================
const industryData = {
  fashion: {
    title: 'Fashion & Apparel Vertical',
    desc: 'Trend-driven forecasting engineered for rapid seasonal changes, short lifecycles, and intense SKU proliferation (colors, sizes, styles) in the Indian fashion landscape.',
    metrics: [
      { label: 'Forecast Horizon', val: '12 Weeks' },
      { label: 'Primary ML Model', val: 'LightGBM Tabular' },
      { label: 'Average SKU Depth', val: '84,000 SKUs' },
      { label: 'MAPE (Holdout)', val: '6.4%' }
    ],
    uiTitle: 'fashion_forecast_router',
    uiHtml: `
      <div style="font-size: 13px;">
        <h4 style="margin-bottom: 12px; color: var(--theme-color)">Seasonal Trend Signals (Myntra + Instagram India)</h4>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Viral Trend: #VelvetRedDresses</span>
          <span style="color:#059669">+420% Interest</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Signal Source: Instagram API</span>
          <span>Normalized Score: +0.87</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-line:12px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Model Adjustment: α = 0.45</span>
          <span>Ensemble Triggered</span>
        </div>
        <div class="glass-card" style="padding: 12px; text-align: center; border-color: var(--theme-color-glow); background: white;">
          <span style="font-size: 12px; color: var(--text-muted)">REPLENISHMENT ACTION SUGGESTED</span>
          <h3 style="font-size: 18px; margin-top: 4px;">Order +2,500 units FSH-DRS-VEL-RED</h3>
        </div>
      </div>
    `
  },
  electronics: {
    title: 'Consumer Electronics Vertical',
    desc: 'High value inventory control designed around short product release cycles, parts sourcing, and Indian port/customs logistics lead-time constraints.',
    metrics: [
      { label: 'Forecast Horizon', val: '24 Weeks' },
      { label: 'Primary ML Model', val: 'Chronos Foundation' },
      { label: 'Average SKU Depth', val: '3,200 SKUs' },
      { label: 'MAPE (Holdout)', val: '4.8%' }
    ],
    uiTitle: 'electronics_lead_time_router',
    uiHtml: `
      <div style="font-size: 13px;">
        <h4 style="margin-bottom: 12px; color: var(--theme-color)">Logistics & Custom Duty Tracker</h4>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Port Condition: Nhava Sheva Port</span>
          <span style="color:#e11d48">Customs Delay +4 Days</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Affected SKU: ELE-MAC-M3-512</span>
          <span>Lead Time: 14 → 18 days</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Safety Stock Buffer</span>
          <span style="color:#d97706">Auto-Adjusted to 28 days</span>
        </div>
        <div class="glass-card" style="padding: 12px; text-align: center; border-color: var(--theme-color-glow); background: white;">
          <span style="font-size: 12px; color: var(--text-muted)">DUE IN TRANSIT ALERT</span>
          <h3 style="font-size: 18px; margin-top: 4px; color:#d97706">Risk Score 82: Impending Stockout</h3>
        </div>
      </div>
    `
  },
  pharma: {
    title: 'Pharmaceuticals Vertical',
    desc: 'Fully GxP and 21 CFR Part 11 compliant workspace tracking cold-chain temperature thresholds, lot expirations, and CDSCO regulatory releases.',
    metrics: [
      { label: 'Forecast Horizon', val: '16 Weeks' },
      { label: 'Primary ML Model', val: 'Croston Intermittent' },
      { label: 'Average SKU Depth', val: '1,400 SKUs' },
      { label: 'MAPE (Holdout)', val: '5.2%' }
    ],
    uiTitle: 'pharma_gxp_audit_router',
    uiHtml: `
      <div style="font-size: 13px;">
        <h4 style="margin-bottom: 12px; color: var(--theme-color)">CDSCO Batch Audit Dashboard</h4>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Lot Code: PB-2026-993</span>
          <span style="color:#9333ea">Quarantine Status</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Cold Chain Sensor</span>
          <span style="color:#059669">Valid (4.2°C Continuous)</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>CoA Certificate</span>
          <span style="color:#059669">Uploaded & Signed</span>
        </div>
        <div class="glass-card" style="padding: 12px; text-align: center; border-color: var(--theme-color-glow); background: white;">
          <span style="font-size: 12px; color: var(--text-muted)">GxP AUDIT STATUS</span>
          <h3 style="font-size: 18px; margin-top: 4px; color:#9333ea">Pending Digital Signature</h3>
        </div>
      </div>
    `
  },
  agrocenter: {
    title: 'Agrocenter & Garden Vertical',
    desc: 'Weather-driven predictive engine tracking monsoon patterns, soil moisture, and Indian commodity APMC market price spikes.',
    metrics: [
      { label: 'Forecast Horizon', val: '8 Weeks' },
      { label: 'Primary ML Model', val: 'TFT + Monsoon Covariates' },
      { label: 'Average SKU Depth', val: '5,000 SKUs' },
      { label: 'MAPE (Holdout)', val: '7.1%' }
    ],
    uiTitle: 'agro_weather_model_router',
    uiHtml: `
      <div style="font-size: 13px;">
        <h4 style="margin-bottom: 12px; color: var(--theme-color)">Monsoon Climate Signal Core</h4>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>IMD Alert: Delayed Monsoon</span>
          <span style="color:#e11d48">Extreme Weather</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Crop Signal: Onion Seeds</span>
          <span>Demand Shift: Delayed Sowing</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>APMC Market Data Ingest</span>
          <span style="color:#0ea5e9">Mapped to pgvector</span>
        </div>
        <div class="glass-card" style="padding: 12px; text-align: center; border-color: var(--theme-color-glow); background: white;">
          <span style="font-size: 12px; color: var(--text-muted)">WEATHER ADJUSTMENT APPLIED</span>
          <h3 style="font-size: 18px; margin-top: 4px; color:#059669">Adjusted Sowing Forecast</h3>
        </div>
      </div>
    `
  },
  hardware: {
    title: 'Hardware & Tools Vertical',
    desc: 'Long-tail SKU optimization. Balances local construction cycles, high transportation costs across Indian states, and multi-echelon network constraints.',
    metrics: [
      { label: 'Forecast Horizon', val: '52 Weeks' },
      { label: 'Primary ML Model', val: 'Croston / ADIDA Baseline' },
      { label: 'Average SKU Depth', val: '112,000 SKUs' },
      { label: 'MAPE (Holdout)', val: '8.2%' }
    ],
    uiTitle: 'hardware_eoq_router',
    uiHtml: `
      <div style="font-size: 13px;">
        <h4 style="margin-bottom: 12px; color: var(--theme-color)">Economic Order Quantity (EOQ) Core</h4>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>SKU: HWD-DRL-18V-BRS</span>
          <span>MOQ: 500 units</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Calculated EOQ</span>
          <span style="color:#d97706">850 Units (Optimal Cost)</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(15,23,42,0.05); padding-bottom:4px;">
          <span>Reorder Point Level</span>
          <span>Triggered at < 120 units</span>
        </div>
        <div class="glass-card" style="padding: 12px; text-align: center; border-color: var(--theme-color-glow); background: white;">
          <span style="font-size: 12px; color: var(--text-muted)">AUTOMATED ERP TRANSACTION</span>
          <h3 style="font-size: 18px; margin-top: 4px; color:#d97706">PO Generated: Ref #PO-88219</h3>
        </div>
      </div>
    `
  }
};

function initIndustrySwitcher() {
  const tabs = document.querySelectorAll('.industry-tab');
  const detailsContainer = document.getElementById('industry-details-container');
  const mockBody = document.getElementById('mock-ui-body-container');
  const mockBadge = document.getElementById('mock-ui-badge');

  if (!tabs.length || !detailsContainer || !mockBody || !mockBadge) return;

  function renderIndustry(indKey) {
    const data = industryData[indKey];
    
    // Update body theme class
    document.body.className = '';
    document.body.classList.add(`theme-${indKey}`);

    // Update details layout
    let metricsHtml = '';
    data.metrics.forEach(m => {
      metricsHtml += `
        <div class="industry-spec-item">
          <h5>${m.label}</h5>
          <p>${m.val}</p>
        </div>
      `;
    });

    detailsContainer.innerHTML = `
      <h3>${data.title}</h3>
      <p>${data.desc}</p>
      <div class="industry-spec-grid">
        ${metricsHtml}
      </div>
    `;

    // Update mock UI
    mockBadge.textContent = data.uiTitle;
    mockBody.innerHTML = data.uiHtml;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const indKey = tab.getAttribute('data-industry');
      renderIndustry(indKey);
    });
  });

  // Render initial (fashion)
  renderIndustry('fashion');
}

// ==========================================
// 4. ML Pipeline Node State & Particle Animation
// ==========================================
const pipelineData = {
  1: {
    title: 'Stage 1: Historical Sales Ingest & Feature Extraction',
    desc: 'PRISMA ingests transactional data and classifies each SKU\'s demand patterns (e.g. sparse, intermittent, highly seasonal). It extracts rolling lag windows, calendar effects, and normalizes external data signals from Google Trends and FRED.'
  },
  2: {
    title: 'Stage 2: Foundation Model Initialization (Chronos)',
    desc: 'Before training local models, PRISMA initializes Amazon\'s Chronos zero-shot transformer model from HuggingFace, setting the baseline forecast distribution. This allows immediate value on Day-1 without any tenant-specific training.'
  },
  3: {
    title: 'Stage 3: Multi-fold Domain Adaptation & Local Fitting',
    desc: 'Each local model in the registry (DeepAR, TFT, LightGBM) is trained directly on the tenant\'s historical data panels. The pipeline utilizes walk-forward cross-validation folds to optimize hyper-parameters and prevent training-set overfitting.'
  },
  4: {
    title: 'Stage 4: StackedEnsemble SLSQP Weight Optimization',
    desc: 'A StackedEnsemble combines all model forecasts. Using Sequential Least Squares Programming (SLSQP), it computes convex weights that minimize pinball loss across the validation holdout window, guaranteeing optimal probabilistic distribution.'
  },
  5: {
    title: 'Stage 5: Walk-Forward Backtesting & Metric Verification',
    desc: 'The final forecast model is audited across the holdout set using metrics: Mean Absolute Scaled Error (MASE), symmetric Mean Absolute Percentage Error (sMAPE), and CRPS. High-accuracy results are committed, and logs are piped to MLflow.'
  }
};

function initMLPipeline() {
  const steps = document.querySelectorAll('.pipeline-step');
  const textContainer = document.getElementById('pipeline-text-container');
  const canvas = document.getElementById('pipeline-canvas');

  if (!steps.length || !textContainer || !canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let currentStep = 1;

  // Particle configuration based on active step
  const stepConfig = {
    1: { count: 40, speed: 2, color: 'rgba(79, 70, 229, 0.7)', mode: 'flow' },
    2: { count: 60, speed: 1.2, color: 'rgba(2, 132, 199, 0.7)', mode: 'orbit' },
    3: { count: 80, speed: 2.5, color: 'rgba(147, 51, 234, 0.7)', mode: 'grid' },
    4: { count: 100, speed: 3.5, color: 'rgba(5, 150, 105, 0.7)', mode: 'merge' },
    5: { count: 40, speed: 1, color: 'rgba(217, 119, 6, 0.7)', mode: 'pulse' }
  };

  let particles = [];

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    initParticles();
  }

  function initParticles() {
    particles = [];
    const cfg = stepConfig[currentStep];
    const count = cfg.count;
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        r: Math.random() * 3 + 1.5,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.05
      });
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cfg = stepConfig[currentStep];
    ctx.fillStyle = cfg.color;
    ctx.strokeStyle = cfg.color.replace('0.7', '0.08');
    ctx.lineWidth = 1;

    particles.forEach((p, idx) => {
      // Apply different physics modes based on stage selected
      if (cfg.mode === 'flow') {
        p.x += Math.abs(p.vx) + 0.5;
        p.y += p.vy * 0.3;
        if (p.x > canvas.width) p.x = 0;
      } else if (cfg.mode === 'orbit') {
        p.angle += p.angularSpeed;
        p.x = canvas.width / 2 + Math.cos(p.angle) * (100 + idx * 0.5);
        p.y = canvas.height / 2 + Math.sin(p.angle) * (50 + idx * 0.2);
      } else if (cfg.mode === 'grid') {
        p.x += p.vx * 1.5;
        p.y += p.vy * 1.5;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      } else if (cfg.mode === 'merge') {
        const targetX = canvas.width / 2;
        const targetY = canvas.height / 2;
        p.x += (targetX - p.x) * 0.05 + (Math.random() - 0.5) * 4;
        p.y += (targetY - p.y) * 0.05 + (Math.random() - 0.5) * 4;
      } else if (cfg.mode === 'pulse') {
        p.x += p.vx * 0.3;
        p.y += p.vy * 0.3;
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
        p.x += (Math.random() - 0.5) * scale;
        if (p.x < 0 || p.x > canvas.width) p.x = Math.random() * canvas.width;
        if (p.y < 0 || p.y > canvas.height) p.y = Math.random() * canvas.height;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // Draw lines between nearby particles
      for (let j = idx + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 60) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });

    animationId = requestAnimationFrame(animateParticles);
  }

  // Handle Pipeline Step Clicking
  steps.forEach(step => {
    step.addEventListener('click', () => {
      steps.forEach(s => s.classList.remove('active'));
      step.classList.add('active');
      
      const stepNum = parseInt(step.getAttribute('data-step'));
      currentStep = stepNum;

      // Update description text
      const data = pipelineData[stepNum];
      textContainer.innerHTML = `
        <h3>${data.title}</h3>
        <p>${data.desc}</p>
      `;

      initParticles();
    });
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  animateParticles();
}

// ==========================================
// 5. Forecast & Trend Fusion Simulator
// ==========================================
function initForecastSimulator() {
  const trendSlider = document.getElementById('trend-slider');
  const alphaSlider = document.getElementById('alpha-slider');
  const betaSlider = document.getElementById('beta-slider');
  const promoCheck = document.getElementById('promo-check');
  const svg = document.getElementById('forecast-chart-svg');

  if (!trendSlider || !alphaSlider || !betaSlider || !promoCheck || !svg) return;

  const trendVal = document.getElementById('trend-val');
  const alphaVal = document.getElementById('alpha-val');
  const betaVal = document.getElementById('beta-val');

  // Input changes
  function updateSliderLabels() {
    trendVal.textContent = parseFloat(trendSlider.value).toFixed(1);
    alphaVal.textContent = parseFloat(alphaSlider.value).toFixed(2);
    betaVal.textContent = parseFloat(betaSlider.value).toFixed(2);
  }

  // Graph Data Config
  const width = 600;
  const height = 250;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const pointsCount = 12;
  const historyLimit = 6; // First 6 points are historical

  // Stable historical points
  const historyY = [120, 115, 135, 110, 140, 125];

  function drawForecastChart() {
    updateSliderLabels();

    const trend = parseFloat(trendSlider.value);
    const alpha = parseFloat(alphaSlider.value);
    const beta = parseFloat(betaSlider.value);
    const promo = promoCheck.checked ? 45 : 0;

    // Generate forecast points (6 to 12)
    // Base forecast adds linear trend + promo effects
    const forecastP50 = [];
    const forecastP90 = [];
    const forecastP10 = [];

    let lastVal = historyY[historyY.length - 1];

    for (let i = 0; i < pointsCount - historyLimit; i++) {
      // Trend calculation (fused with alpha weight)
      const trendLift = trend * 30 * alpha;
      const noise = (Math.sin(i * 1.5) * 10) * (1 - alpha);
      
      // Promo effect peaks on week 8 (index 2 of forecast) and decays
      let promoLift = 0;
      if (i === 2) promoLift = promo;
      if (i === 3) promoLift = promo * 0.4;
      
      const p50 = lastVal + trendLift + noise + promoLift - (i * 2); // gradual decay
      
      // Volatility (beta dampener expands width of distribution bounds)
      const spread = (25 + i * 12) * (1 + beta);
      
      forecastP50.push(p50);
      forecastP90.push(p50 - spread); // Y-axis is inverted in SVG, so subtract is "up" (higher demand)
      forecastP10.push(p50 + spread);
      
      lastVal = p50 - promoLift; // carry over baseline demand only
    }

    // Combine history + forecast coordinates for rendering
    const pointsX = [];
    const stepX = (width - paddingLeft - paddingRight) / (pointsCount - 1);
    for (let i = 0; i < pointsCount; i++) {
      pointsX.push(paddingLeft + i * stepX);
    }

    // Build paths
    let histPath = `M ${pointsX[0]} ${historyY[0]}`;
    for (let i = 1; i < historyLimit; i++) {
      histPath += ` L ${pointsX[i]} ${historyY[i]}`;
    }

    // P50 Baseline (connects to last historical point)
    let p50Path = `M ${pointsX[historyLimit - 1]} ${historyY[historyLimit - 1]}`;
    for (let i = 0; i < forecastP50.length; i++) {
      p50Path += ` L ${pointsX[historyLimit + i]} ${forecastP50[i]}`;
    }

    // Area boundaries for distribution envelope (polygon)
    // Runs from p10 list left-to-right, then p90 right-to-left
    let areaPoints = [];
    areaPoints.push(`${pointsX[historyLimit - 1]},${historyY[historyLimit - 1]}`);
    for (let i = 0; i < forecastP10.length; i++) {
      areaPoints.push(`${pointsX[historyLimit + i]},${forecastP10[i]}`);
    }
    for (let i = forecastP90.length - 1; i >= 0; i--) {
      areaPoints.push(`${pointsX[historyLimit + i]},${forecastP90[i]}`);
    }
    const areaPath = `M ${areaPoints.join(' L ')} Z`;

    // Render inside SVG
    const activeColor = getComputedStyle(document.body).getPropertyValue('--theme-color').trim() || '#4f46e5';
    
    // Clear and build inner SVG components
    svg.innerHTML = `
      <!-- Grid lines -->
      <line x1="${paddingLeft}" y1="${paddingTop}" x2="${width - paddingRight}" y2="${paddingTop}" stroke="rgba(15,23,42,0.05)" />
      <line x1="${paddingLeft}" y1="${height / 2}" x2="${width - paddingRight}" y2="${height / 2}" stroke="rgba(15,23,42,0.05)" />
      <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight}" y2="${height - paddingBottom}" stroke="rgba(15,23,42,0.1)" />
      <line x1="${pointsX[historyLimit - 1]}" y1="${paddingTop}" x2="${pointsX[historyLimit - 1]}" y2="${height - paddingBottom}" stroke="var(--theme-color)" stroke-dasharray="3,3" opacity="0.4" />
      
      <!-- Axis Labels -->
      <text x="${paddingLeft}" y="${height - 15}" fill="var(--text-muted)" font-size="11">Wk 1</text>
      <text x="${pointsX[historyLimit - 1]}" y="${height - 15}" fill="var(--theme-color)" font-size="11" text-anchor="middle" font-weight="bold">Live Forecast</text>
      <text x="${width - paddingRight}" y="${height - 15}" fill="var(--text-muted)" font-size="11" text-anchor="end">Wk 12</text>
      <text x="15" y="${paddingTop + 5}" fill="var(--text-muted)" font-size="10" transform="rotate(-90 15 ${paddingTop})">Units Sold</text>

      <!-- Distribution Confidence Band Area -->
      <path d="${areaPath}" fill="${activeColor}" fill-opacity="0.08" stroke="none" />
      
      <!-- Historical Sales Line -->
      <path d="${histPath}" fill="none" stroke="#475569" stroke-width="2.5" />
      
      <!-- Forecast P50 Baseline -->
      <path d="${p50Path}" fill="none" stroke="${activeColor}" stroke-width="3" stroke-dasharray="5,5" />
      
      <!-- Forecast Boundary Lines -->
      <path d="M ${pointsX[historyLimit - 1]} ${historyY[historyLimit - 1]} ${forecastP90.map((y, idx) => `L ${pointsX[historyLimit + idx]} ${y}`).join(' ')}" fill="none" stroke="${activeColor}" stroke-width="1.2" stroke-opacity="0.4" />
      <path d="M ${pointsX[historyLimit - 1]} ${historyY[historyLimit - 1]} ${forecastP10.map((y, idx) => `L ${pointsX[historyLimit + idx]} ${y}`).join(' ')}" fill="none" stroke="${activeColor}" stroke-width="1.2" stroke-opacity="0.4" />
    `;
  }

  // Slider events
  trendSlider.addEventListener('input', drawForecastChart);
  alphaSlider.addEventListener('input', drawForecastChart);
  betaSlider.addEventListener('input', drawForecastChart);
  promoCheck.addEventListener('change', drawForecastChart);

  // Redraw when industry/theme switches
  document.querySelectorAll('.industry-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(drawForecastChart, 100);
    });
  });

  drawForecastChart();
}

// ==========================================
// 6. Platform Architecture & Database Schema Explorer
// ==========================================
const schemaData = {
  tenant: `class Tenant(BaseModel):
    __tablename__ = "tenants"
    
    id: UUID = Column(primary_key=True, default=uuid4)
    slug: str = Column(CITEXT, unique=True, index=True)
    tier: str = Column(Enum("growth", "scale", "enterprise"))
    status: str = Column(Enum("trial", "active", "suspended"))
    
    # Active Enabled Verticals
    industries: list[str] = Column(ARRAY(String))
    active_industry: str = Column(String, default="fashion")
    
    # Row-Level Security enforcement boundary
    # SELECT * FROM skus WHERE tenant_id = current_tenant_id()`,
  
  sku: `class Sku(BaseModel):
    __tablename__ = "skus"
    
    sku_code: str = Column(String(64), unique=True, index=True)
    gtin: str = Column(String(14), nullable=True)
    unit_cost: Numeric = Column(Numeric(12, 2))
    unit_price: Numeric = Column(Numeric(12, 2))
    
    # Replenishment parameters
    lead_time_days: int = Column(Integer, default=14)
    safety_stock: int = Column(Integer, default=100)
    reorder_point: int = Column(Integer, default=250)
    
    # Industry specific attributes (color, ndc_code, etc)
    attributes: dict = Column(JSONB, default={})`,

  trend: `class TrendSignal(BaseModel):
    __tablename__ = "trend_signals"
    
    id: int = Column(BigInteger, primary_key=True)
    source: str = Column(String(32)) # Google Trends, APMC, Reddit
    series_key: str = Column(String(128)) # e.g. FRED:UNRATE
    normalized_score: float = Column(Float) # -1.0 to +1.0
    confidence: float = Column(Float) # Signal reliability
    
    # Vector clustering for correlation grouping
    centroid_embedding = Column(Vector(768)) # pgvector`,

  pharma: `class PharmaBatch(BaseModel):
    __tablename__ = "pharma_batches"
    
    lot_number: str = Column(String(64), unique=True)
    ndc_code: str = Column(String(11))
    manufactured_at: datetime = Column(DateTime)
    expiry_date: datetime = Column(DateTime)
    
    # Strict cold chain tracking
    cold_chain_required: bool = Column(Boolean, default=True)
    storage_temp_min_c: float = Column(Float, default=2.0)
    storage_temp_max_c: float = Column(Float, default=8.0)
    
    gxp_status: str = Column(Enum("quarantine", "released", "recalled"))
    qa_released_by: str = Column(String, nullable=True)`,

  usage: `class UsageEvent(BaseModel):
    __tablename__ = "usage_events"
    
    # Partitioned table for high-throughput scaling
    id: int = Column(BigInteger, primary_key=True)
    tenant_id: UUID = Column(ForeignKey("tenants.id"))
    meter: str = Column(String(32)) # e.g. "forecast_row", "api_request"
    quantity: int = Column(Integer)
    occurred_at: datetime = Column(DateTime, default=utc_now)
    idempotency_key: str = Column(String(128))`
};

function initDbExplorer() {
  const tabs = document.querySelectorAll('.db-tab');
  const codeContainer = document.getElementById('db-code-container');

  if (!tabs.length || !codeContainer) return;

  function showSchema(tableKey) {
    const code = schemaData[tableKey];
    codeContainer.textContent = code;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tableKey = tab.getAttribute('data-table');
      showSchema(tableKey);
    });
  });

  // Load default
  showSchema('tenant');
}

// ==========================================
// 7. Pharma GxP Demo (Sensors & Audit Trail)
// ==========================================
function initPharmaDemo() {
  const canvas = document.getElementById('temp-sensor-canvas');
  const tempValEl = document.getElementById('temp-current-val');
  const authCheck = document.getElementById('auth-released-check');
  const releaseBtn = document.getElementById('qa-release-btn');
  const auditLog = document.getElementById('pharma-audit-log');
  const statusPill = document.getElementById('batch-status');

  if (!canvas || !tempValEl || !authCheck || !releaseBtn || !auditLog || !statusPill) return;

  const ctx = canvas.getContext('2d');
  const tempLogs = [];
  const maxLogs = 50;

  // Populate initial temperature logs (around 4.2°C)
  for (let i = 0; i < maxLogs; i++) {
    tempLogs.push(4.2 + (Math.random() - 0.5) * 0.8);
  }

  let currentTemp = 4.2;

  function updateTemp() {
    // Add small random fluctuation
    currentTemp += (Math.random() - 0.5) * 0.2;
    
    // Safety check constraint (2.0°C to 8.0°C)
    if (currentTemp < 2.5) currentTemp += 0.3;
    if (currentTemp > 7.5) currentTemp -= 0.3;

    tempLogs.push(currentTemp);
    if (tempLogs.length > maxLogs) {
      tempLogs.shift();
    }

    tempValEl.textContent = `${currentTemp.toFixed(1)}°C`;
    
    // Draw Temp line
    drawTempChart();
  }

  function drawTempChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = canvas.parentElement.clientHeight;
    
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.15)';
    ctx.lineWidth = 1;
    
    // Draw limit lines (2.0°C and 8.0°C)
    const yMax = h * 0.15; // 8°C
    const yMin = h * 0.85; // 2°C
    
    ctx.beginPath();
    ctx.moveTo(0, yMax);
    ctx.lineTo(w, yMax);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, yMin);
    ctx.lineTo(w, yMin);
    ctx.stroke();

    ctx.fillStyle = 'rgba(147, 51, 234, 0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('8.0°C Upper Limit', 10, yMax - 4);
    ctx.fillText('2.0°C Lower Limit', 10, yMin + 12);

    // Draw sensor readings line
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    const stepX = w / (maxLogs - 1);
    
    tempLogs.forEach((temp, idx) => {
      // Map 2.0 -> 8.0 to graph boundaries
      const ratio = (temp - 2.0) / (8.0 - 2.0);
      const y = h - (ratio * (h * 0.7) + h * 0.15); // inverted for canvas
      const x = idx * stepX;
      
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }

  // Update sensor loop
  setInterval(updateTemp, 1000);

  // Authorize batch release action
  releaseBtn.addEventListener('click', () => {
    if (!authCheck.checked) {
      alert('Error: You must check the digital signature authorization box.');
      return;
    }

    // Check cold-chain violations
    const coldChainViolation = tempLogs.some(t => t < 2.0 || t > 8.0);
    
    const time = new Date().toLocaleTimeString();
    
    if (coldChainViolation) {
      statusPill.textContent = 'REJECTED';
      statusPill.className = 'batch-status-pill quarantine';
      statusPill.style.color = '#e11d48';
      statusPill.style.borderColor = 'rgba(225,29,72,0.3)';
      statusPill.style.background = 'rgba(225,29,72,0.1)';
      
      auditLog.innerHTML += `[${time}] QA_ACTION: Release REJECTED due to Cold Chain Temperature violation.<br>`;
      auditLog.scrollTop = auditLog.scrollHeight;
    } else {
      statusPill.textContent = 'RELEASED';
      statusPill.className = 'batch-status-pill released';
      
      const hash = Math.random().toString(16).substring(2, 10).toUpperCase();
      auditLog.innerHTML += `[${time}] QA_RELEASE: Batch released by User QA_OWNER_ADM. Signature: 0x${hash}<br>`;
      auditLog.scrollTop = auditLog.scrollHeight;

      // Lock controls
      releaseBtn.disabled = true;
      authCheck.disabled = true;
      releaseBtn.textContent = 'Batch QA Released';
      releaseBtn.style.opacity = '0.5';
    }
  });

  // Re-draw on window resize
  window.addEventListener('resize', drawTempChart);
  setTimeout(drawTempChart, 200);
}

// ==========================================
// 8. Causal AI Sandbox (DoWhy Engine)
// ==========================================
function initCausalSandbox() {
  const discountSlider = document.getElementById('discount-slider');
  const compSlider = document.getElementById('comp-price-slider');
  const demandUplift = document.getElementById('uplift-demand-val');
  const marginImpact = document.getElementById('uplift-margin-val');
  const svg = document.getElementById('causal-chart-svg');

  if (!discountSlider || !compSlider || !demandUplift || !marginImpact || !svg) return;

  const discountVal = document.getElementById('discount-val');
  const compVal = document.getElementById('comp-price-val');

  function calculateCausalUplift() {
    const discount = parseInt(discountSlider.value);
    const comp = parseInt(compSlider.value);

    // Update labels
    discountVal.textContent = `${discount}%`;
    const sign = comp >= 0 ? '+' : '';
    compVal.textContent = `${sign}${comp}%`;

    const baseDemand = 1000;
    
    // Causal equation: uplift = discount_factor - competitor_offset
    let liftPct = (discount * 1.6) - (comp * 0.9);
    if (liftPct < -10) liftPct = -10; // floor limit

    const newDemand = baseDemand * (1 + liftPct / 100);
    
    // Scaled to INR margins (unit price ₹8,500, unit cost ₹4,200)
    const unitPrice = 8500;
    const unitCost = 4200;
    const originalMargin = baseDemand * (unitPrice - unitCost);
    const discountedMargin = newDemand * (unitPrice * (1 - discount/100) - unitCost);
    const netMarginImpact = discountedMargin - originalMargin;

    // Update metrics UI
    demandUplift.textContent = `${liftPct >= 0 ? '+' : ''}${liftPct.toFixed(1)}%`;
    if (liftPct >= 0) {
      demandUplift.className = 'value positive';
    } else {
      demandUplift.className = 'value negative';
    }

    // Format net margin in INR format
    marginImpact.textContent = netMarginImpact >= 0 ? '+' + formatINR(netMarginImpact) : '-' + formatINR(Math.abs(netMarginImpact));
    if (netMarginImpact >= 0) {
      marginImpact.className = 'value positive';
    } else {
      marginImpact.className = 'value negative';
    }

    // Draw simple uplift curve comparison in SVG
    drawCausalChart(liftPct, netMarginImpact);
  }

  function drawCausalChart(lift, margin) {
    const w = 300;
    const h = 120;
    const pad = 20;

    // Map lift to height bounds
    const maxVal = 100;
    const baseH = h / 2;
    const liftH = baseH - (lift / maxVal) * (h * 0.4); // SVG inverted
    
    svg.innerHTML = `
      <!-- Base Baseline -->
      <line x1="${pad}" y1="${baseH}" x2="${w - pad}" y2="${baseH}" stroke="rgba(15,23,42,0.15)" stroke-dasharray="3,3" />
      <text x="${pad}" y="${baseH - 6}" fill="var(--text-muted)" font-size="10">Control Baseline</text>
      
      <!-- Causal Curve -->
      <path d="M ${pad} ${baseH} Q ${w / 2} ${liftH} ${w - pad} ${liftH}" fill="none" stroke="var(--theme-color)" stroke-width="3" />
      
      <!-- Current State node -->
      <circle cx="${w - pad}" cy="${liftH}" r="6" fill="var(--theme-color)" filter="drop-shadow(0 0 4px var(--theme-color-glow))" />
      <text x="${w - pad}" y="${liftH - 10}" fill="var(--text-primary)" font-size="10" text-anchor="end" font-weight="bold">Est. Uplift</text>
    `;
  }

  discountSlider.addEventListener('input', calculateCausalUplift);
  compSlider.addEventListener('input', calculateCausalUplift);

  calculateCausalUplift();
}

// ==========================================
// 9. Investor ROI & Pricing Calculator (INR)
// ==========================================
function initRoiCalculator() {
  const revSlider = document.getElementById('annual-rev-slider');
  const stockoutSlider = document.getElementById('stockout-rate-slider');
  const carrySlider = document.getElementById('inventory-cost-slider');

  if (!revSlider || !stockoutSlider || !carrySlider) return;

  const revVal = document.getElementById('annual-rev-val');
  const stockoutVal = document.getElementById('stockout-rate-val');
  const carryVal = document.getElementById('inventory-cost-val');

  const savingsEl = document.getElementById('roi-annual-savings');
  const stockoutSavingsEl = document.getElementById('roi-stockout-savings');
  const holdingSavingsEl = document.getElementById('roi-holding-savings');
  const efficiencySavingsEl = document.getElementById('roi-efficiency-gains');

  function calculateROI() {
    const revenue = parseInt(revSlider.value);
    const stockoutRate = parseFloat(stockoutSlider.value) / 100;
    const carryCost = parseFloat(carrySlider.value) / 100;

    // Format revenue label with Lakhs / Crores helpers
    let revText = formatINR(revenue);
    if (revenue >= 10000000) {
      const cr = (revenue / 10000000).toFixed(1).replace('.0', '');
      revText += ` (${cr} Crore${parseFloat(cr) > 1 ? 's' : ''})`;
    } else if (revenue >= 100000) {
      const lakh = (revenue / 100000).toFixed(1).replace('.0', '');
      revText += ` (${lakh} Lakh${parseFloat(lakh) > 1 ? 's' : ''})`;
    }

    revVal.textContent = revText;
    stockoutVal.textContent = `${(stockoutRate * 100).toFixed(1)}%`;
    carryVal.textContent = `${Math.round(carryCost * 100)}%`;

    // Indian market-based operations parameters:
    // 1. Stockout cost reduction (PRISMA reduces stockouts by 35%)
    const stockoutSavings = revenue * stockoutRate * 0.35;

    // 2. Overstock holding savings (carrying cost reduced by 25% on 12% optimal buffer reduction)
    const holdingSavings = revenue * 0.12 * carryCost * 0.25;

    // 3. Operational efficiency gains (saves ~0.75% of revenue in manual labor and audits)
    const efficiencySavings = revenue * 0.0075;

    const totalSavings = stockoutSavings + holdingSavings + efficiencySavings;

    // Display animated values in INR format
    savingsEl.textContent = formatINR(totalSavings);
    stockoutSavingsEl.textContent = formatINR(stockoutSavings);
    holdingSavingsEl.textContent = formatINR(holdingSavings);
    efficiencySavingsEl.textContent = formatINR(efficiencySavings);
  }

  revSlider.addEventListener('input', calculateROI);
  stockoutSlider.addEventListener('input', calculateROI);
  carrySlider.addEventListener('input', calculateROI);

  calculateROI();
}
