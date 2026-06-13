/* ============================================================
   Sanketh — Investor Landing Page Interactions
   Vanilla JS · no dependencies
   ============================================================ */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Indian currency formatting (Lakh / Crore) ---------- */
  function formatINR(n) {
    const sign = n < 0 ? '−' : '';
    n = Math.abs(n);
    if (n >= 1e7) {
      const cr = n / 1e7;
      return sign + '₹' + (cr >= 100 ? Math.round(cr).toLocaleString('en-IN') : cr.toFixed(cr >= 10 ? 1 : 2)) + ' Cr';
    }
    if (n >= 1e5) {
      const l = n / 1e5;
      return sign + '₹' + (l >= 10 ? Math.round(l) : l.toFixed(1)) + ' L';
    }
    return sign + '₹' + Math.round(n).toLocaleString('en-IN');
  }

  /* ---------- Scroll progress + header state ---------- */
  const progressBar = document.getElementById('scroll-progress');
  const header = document.getElementById('site-header');
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (progressBar) progressBar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    if (header) header.classList.toggle('scrolled', h.scrollTop > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const burger = document.getElementById('nav-burger');
  const navLinks = document.getElementById('nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') navLinks.classList.remove('open');
    });
  }

  /* ---------- Active nav link on scroll ---------- */
  const sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
  const linkMap = {};
  document.querySelectorAll('.nav-link').forEach(function (a) {
    linkMap[a.getAttribute('href').slice(1)] = a;
  });
  const navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && linkMap[entry.target.id]) {
        document.querySelectorAll('.nav-link').forEach(function (a) { a.classList.remove('active'); });
        linkMap[entry.target.id].classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function (s) { navObserver.observe(s); });

  /* ---------- Scroll reveal (staggered) ---------- */
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(function () { el.classList.add('visible'); }, delay);
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

  /* ---------- Count-up numbers ---------- */
  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-target') || '0');
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const dur = 1600;
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.count-up').forEach(function (el) { countObserver.observe(el); });

  /* ---------- Live ticker feed (badge tags) ---------- */
  const ticker = document.getElementById('live-ticker');
  if (ticker) {
    const cities = ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Kochi'];
    const events = [
      function () {
        const amt = 800 + Math.floor(Math.random() * 22000);
        return { badge: '<span class="tick-b sale">Order</span>', html: '<strong>New order</strong> · ' + pick(cities), amount: '+₹' + amt.toLocaleString('en-IN'), cls: '' };
      },
      function () {
        const days = 5 + Math.floor(Math.random() * 10);
        return { badge: '<span class="tick-b warn">Warn</span>', html: '<strong>Stockout predicted</strong> · SKU ' + skuCode(), amount: days + 'd out', cls: 'warn' };
      },
      function () {
        return { badge: '<span class="tick-b spike">Spike</span>', html: '<strong>Demand spike sensed</strong> · ' + pick(['Google Trends', 'social buzz', 'weather signal']), amount: '+' + (4 + Math.floor(Math.random() * 25)) + '%', cls: '' };
      },
      function () {
        const amt = 30000 + Math.floor(Math.random() * 400000);
        return { badge: '<span class="tick-b saved">Saved</span>', html: '<strong>Reorder optimized</strong> · holding cost cut', amount: '+' + formatINR(amt), cls: '' };
      },
      function () {
        return { badge: '<span class="tick-b crit">Alert</span>', html: '<strong>Critical alert</strong> · SKU ' + skuCode() + ' · acted on', amount: 'resolved', cls: 'crit' };
      }
    ];
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function skuCode() {
      return pick(['FA', 'EL', 'PH', 'AG', 'HW']) + '-' + (1000 + Math.floor(Math.random() * 9000));
    }
    function addTick() {
      const ev = pick(events)();
      const item = document.createElement('div');
      item.className = 'ticker-item';
      item.innerHTML = ev.badge + '<span>' + ev.html + '</span><span class="t-amount ' + ev.cls + '">' + ev.amount + '</span>';
      ticker.insertBefore(item, ticker.firstChild);
      while (ticker.children.length > 7) ticker.removeChild(ticker.lastChild);
    }
    for (let i = 0; i < 5; i++) addTick();
    setInterval(addTick, 2600);
  }

  /* ---------- Industry showcase dataset ---------- */
  const INDUSTRIES = {
    fashion: {
      title: 'Fashion & Apparel',
      domain: 'sanketh.app / fashion',
      desc: 'Trends move fast and seasons are unforgiving. Sanketh reads social buzz and search trends to predict which styles will sell — and schedules end-of-season markdowns to protect margin.',
      stats: [
        ['−42%', 'fewer end-of-season markdown losses'],
        ['11 days', 'average advance warning before a size/colour stockout'],
        ['₹2.8 L', 'average monthly saving per store cluster']
      ],
      kpis: [
        ['Forecast accuracy', '94.2%', '+2.1%', 'up'],
        ['Stock coverage', '34 days', 'healthy', 'up'],
        ['At-risk SKUs', '7', '−3 this week', 'down']
      ],
      alerts: [
        ['warn', 'Denim jacket <strong>FA-2210</strong> trending on social — demand up 38%', 'act in 6 days'],
        ['crit', 'Sneaker <strong>FA-1182</strong> projected stockout', '11 days out'],
        ['ok', 'Markdown plan for summer line approved', '₹4.1 L margin saved']
      ],
      skus: [
        { code: 'FA-2210', name: 'Slim Fit Denim Jacket', wh: 'Bhiwandi Hub (MH)', stock: '85 units', spike: '+38% (Festive)', action: 'Reorder 350 units', cls: 'reorder' },
        { code: 'FA-1182', name: 'Oversized Graphic Tee', wh: 'Bengaluru East Hub', stock: '12 units', spike: '+14% (Weekend Run)', action: 'Reorder 180 (Urgent)', cls: 'urgent' },
        { code: 'FA-3049', name: 'Linen Summer Dress', wh: 'Delhi-NCR Central', stock: '420 units', spike: '−8% (Season End)', action: 'Markdown by 15%', cls: 'markdown' }
      ]
    },
    electronics: {
      title: 'Consumer Electronics',
      domain: 'sanketh.app / electronics',
      desc: 'Short product cycles and import lead times make timing everything. Sanketh tracks launch buzz and component signals so distributors order the right quantity before prices and demand shift.',
      stats: [
        ['−28%', 'reduction in dead stock from outdated models'],
        ['96.1%', 'forecast accuracy on fast-moving accessories'],
        ['₹6.5 L', 'average monthly working capital freed per distributor']
      ],
      kpis: [
        ['Forecast accuracy', '96.1%', '+1.4%', 'up'],
        ['Import lead time', '21 days', 'tracked', 'up'],
        ['At-risk SKUs', '12', '+2 this week', 'down']
      ],
      alerts: [
        ['crit', 'TWS earbuds <strong>EL-3301</strong> — festive demand spike sensed', 'reorder now'],
        ['warn', 'Power bank <strong>EL-2240</strong> supplier delay detected', '+9 days lead'],
        ['ok', 'Old-gen phone cases auto-marked for clearance', '₹1.9 L recovered']
      ],
      skus: [
        { code: 'EL-3301', name: 'TWS Active ANC Earbuds', wh: 'Chennai Port Hub', stock: '140 units', spike: '+64% (Diwali Peak)', action: 'Reorder 800 units', cls: 'reorder' },
        { code: 'EL-2240', name: '10,000mAh Power Bank', wh: 'Mumbai West Hub', stock: '45 units', spike: '+9d Lead Delay', action: 'Expedite Supplier', cls: 'urgent' },
        { code: 'EL-1092', name: 'USB-C Fast Charger', wh: 'Delhi-NCR Central', stock: '890 units', spike: 'Stable', action: 'No Action Required', cls: 'stable' }
      ]
    },
    pharma: {
      title: 'Pharmaceuticals',
      domain: 'sanketh.app / pharma',
      desc: 'Medicine stockouts cost lives and compliance failures cost licences. Sanketh adds batch-level tracking, cold-chain monitoring and audit-ready records on top of demand forecasting — built to US FDA standards.',
      stats: [
        ['100%', 'batch traceability with tamper-proof audit logs'],
        ['0', 'expired-stock write-offs in modelled deployments'],
        ['2–8°C', 'cold-chain compliance monitored continuously']
      ],
      kpis: [
        ['Batches in QA', '14', '3 releasing', 'up'],
        ['Cold chain', '4.2°C', 'in range', 'up'],
        ['Expiry risk', '2 lots', '90+ days out', 'down']
      ],
      alerts: [
        ['ok', 'Batch <strong>PB-2026-993</strong> QA-released with full audit trail', 'compliant'],
        ['warn', 'Antibiotic <strong>PH-5520</strong> seasonal demand rising', 'order in 8 days'],
        ['ok', 'Cold-chain integrity verified across 6 warehouses', '24/7 monitored']
      ],
      skus: [
        { code: 'PH-5520', name: 'Paracetamol 650mg Lot', wh: 'Hyderabad Central', stock: '1,200 boxes', spike: '+28% (Monsoon Flu)', action: 'QA-Release & Ship', cls: 'reorder' },
        { code: 'PH-8891', name: 'Amoxicillin 500mg', wh: 'Indore Hub', stock: '150 boxes', spike: 'Expiry Risk (90d)', action: 'Redistribute', cls: 'urgent' },
        { code: 'PH-1102', name: 'Insulin Cold-Storage', wh: 'Bengaluru Main', stock: '80 vials', spike: 'Temp Alert (4.8°C)', action: 'Check Cold Chain', cls: 'markdown' }
      ]
    },
    agro: {
      title: 'Agro & Garden Centers',
      domain: 'sanketh.app / agro',
      desc: 'Demand here is written in the weather. Sanketh fuses monsoon forecasts and seasonal patterns with sales history so garden centers and agri-retailers stock exactly what the season needs.',
      stats: [
        ['−35%', 'less seasonal overstock spoilage'],
        ['7 days', 'weather-driven demand signals ahead of sales'],
        ['₹1.6 L', 'average monthly saving per outlet in season']
      ],
      kpis: [
        ['Forecast accuracy', '91.8%', '+3.2%', 'up'],
        ['Monsoon signal', 'Active', '+22% demand', 'up'],
        ['Spoilage risk', '4 SKUs', 'flagged early', 'down']
      ],
      alerts: [
        ['warn', 'Pre-monsoon spike: seeds & fertilizer <strong>AG-1108</strong>', 'stock up 5 days'],
        ['ok', 'Perishable stock rotation optimized', '₹80 K saved'],
        ['crit', 'Pesticide <strong>AG-2230</strong> regional shortage forming', 'act now']
      ],
      skus: [
        { code: 'AG-1108', name: 'Organic Tomato Seeds', wh: 'Pune Central Hub', stock: '30 bags', spike: '+45% (Monsoon)', action: 'Reorder 120 bags', cls: 'reorder' },
        { code: 'AG-2230', name: 'Bio-NPK Fertilizer', wh: 'Indore Warehouse', stock: '5 bags', spike: 'Shortage Detected', action: 'Reorder 50 (Urgent)', cls: 'urgent' },
        { code: 'AG-3140', name: 'Drip Irrigation Kit', wh: 'Ahmedabad Hub', stock: '120 sets', spike: 'Stable', action: 'No Action Required', cls: 'stable' }
      ]
    },
    hardware: {
      title: 'Hardware & Tools',
      domain: 'sanketh.app / hardware',
      desc: 'Thousands of slow-moving SKUs make hardware retail a working-capital trap. Sanketh\'s intermittent-demand models tell you which of those 10,000 items actually need reordering this month.',
      stats: [
        ['10,000+', 'long-tail SKUs managed per distributor'],
        ['−24%', 'working capital locked in slow movers'],
        ['₹3.2 L', 'average monthly saving per distribution hub']
      ],
      kpis: [
        ['SKUs tracked', '9,840', 'all live', 'up'],
        ['Dead stock', '−24%', 'vs last qtr', 'up'],
        ['Reorders today', '63', 'auto-suggested', 'up']
      ],
      alerts: [
        ['ok', '63 reorder suggestions pushed to ERP automatically', 'this morning'],
        ['warn', 'Power drill <strong>HW-7741</strong> project-season demand up', 'order in 9 days'],
        ['ok', 'Slow-mover clearance list generated', '₹2.3 L to recover']
      ],
      skus: [
        { code: 'HW-7741', name: 'Heavy-Duty Power Drill', wh: 'Delhi-NCR Central', stock: '12 units', spike: '+18% (Builder Peak)', action: 'Reorder 45 units', cls: 'reorder' },
        { code: 'HW-2209', name: 'Stainless Steel Screws', wh: 'Bhiwandi Hub (MH)', stock: '15k units', spike: 'Intermittent Demand', action: 'Optimize Stock Level', cls: 'markdown' },
        { code: 'HW-9021', name: 'Adjustable Spanner (Chrome)', wh: 'Kolkata East Hub', stock: '350 units', spike: 'Slow Mover (120d)', action: 'Clearance Promo', cls: 'urgent' }
      ]
    }
  };

  const indInfo = document.getElementById('industry-info');
  const dashKpis = document.getElementById('dash-kpis');
  const dashAlerts = document.getElementById('dash-alerts');
  const dashTitle = document.getElementById('dash-title');
  const dashSkuTable = document.getElementById('dash-sku-table');
  const dashBody = document.querySelector('.dash-body');

  function renderDashTable(skus) {
    if (!dashSkuTable) return;
    
    let html = 
      '<div class="dash-table-wrapper">' +
      '<table class="dash-sku-table">' +
      '  <thead>' +
      '    <tr>' +
      '      <th>SKU Code</th>' +
      '      <th>Item Name</th>' +
      '      <th>Warehouse</th>' +
      '      <th>Current Stock</th>' +
      '      <th>Predicted Spike</th>' +
      '      <th>Recommended Action</th>' +
      '    </tr>' +
      '  </thead>' +
      '  <tbody>';
      
    skus.forEach(function (sku) {
      let spikeCls = 'up';
      if (sku.spike.indexOf('−') !== -1 || sku.spike.indexOf('Stable') !== -1 || sku.spike.indexOf('Intermittent') !== -1) {
        spikeCls = 'stable';
      } else if (sku.spike.indexOf('Risk') !== -1 || sku.spike.indexOf('Shortage') !== -1 || sku.spike.indexOf('Delay') !== -1) {
        spikeCls = 'warn';
      }
      
      html += 
        '    <tr>' +
        '      <td><span class="sku-code">' + sku.code + '</span></td>' +
        '      <td><span class="sku-name">' + sku.name + '</span></td>' +
        '      <td>' + sku.wh + '</td>' +
        '      <td>' + sku.stock + '</td>' +
        '      <td><span class="sku-spike ' + spikeCls + '">' + sku.spike + '</span></td>' +
        '      <td><span class="sku-action-tag ' + sku.cls + '">' + sku.action + '</span></td>' +
        '    </tr>';
    });
    
    html += '  </tbody></table></div>';
    
    dashSkuTable.innerHTML = html;
  }

  function renderIndustry(key) {
    const d = INDUSTRIES[key];
    if (!d || !indInfo) return;

    indInfo.classList.add('switching');
    if (dashBody) dashBody.classList.add('switching');

    setTimeout(function () {
      indInfo.innerHTML =
        '<h3>' + d.title + '</h3><p>' + d.desc + '</p>' +
        '<div class="ind-stats">' +
        d.stats.map(function (s) {
          return '<div class="ind-stat"><span class="is-val">' + s[0] + '</span><span class="is-label">' + s[1] + '</span></div>';
        }).join('') +
        '</div>';

      if (dashTitle) dashTitle.textContent = d.domain;
      if (dashKpis) {
        dashKpis.innerHTML = d.kpis.map(function (k) {
          return '<div class="dash-kpi"><small>' + k[0] + '</small><strong>' + k[1] +
            '</strong><span class="delta ' + k[3] + '">' + k[2] + '</span></div>';
        }).join('');
      }
      if (dashAlerts) {
        dashAlerts.innerHTML = d.alerts.map(function (a, i) {
          return '<div class="dash-alert" style="animation-delay:' + (i * 0.12) + 's">' +
            '<span class="sev ' + a[0] + '"></span><span>' + a[1] + '</span>' +
            '<span class="da-tag">' + a[2] + '</span></div>';
        }).join('');
      }
      renderDashTable(d.skus);

      indInfo.classList.remove('switching');
      if (dashBody) dashBody.classList.remove('switching');
    }, 280);
  }

  document.querySelectorAll('.ind-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.ind-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderIndustry(tab.getAttribute('data-industry'));
    });
  });

  // initial render (no fade)
  (function () {
    const d = INDUSTRIES.fashion;
    if (!indInfo) return;
    indInfo.innerHTML =
      '<h3>' + d.title + '</h3><p>' + d.desc + '</p>' +
      '<div class="ind-stats">' +
      d.stats.map(function (s) {
        return '<div class="ind-stat"><span class="is-val">' + s[0] + '</span><span class="is-label">' + s[1] + '</span></div>';
      }).join('') + '</div>';
    if (dashKpis) {
      dashKpis.innerHTML = d.kpis.map(function (k) {
        return '<div class="dash-kpi"><small>' + k[0] + '</small><strong>' + k[1] +
          '</strong><span class="delta ' + k[3] + '">' + k[2] + '</span></div>';
      }).join('');
    }
    if (dashAlerts) {
      dashAlerts.innerHTML = d.alerts.map(function (a, i) {
        return '<div class="dash-alert" style="animation-delay:' + (i * 0.12) + 's">' +
          '<span class="sev ' + a[0] + '"></span><span>' + a[1] + '</span>' +
          '<span class="da-tag">' + a[2] + '</span></div>';
      }).join('');
    }
    renderDashTable(d.skus);
  })();

  /* ---------- ROI Calculator (INR) ---------- */
  const revSlider = document.getElementById('rev-slider');
  const stockoutSlider = document.getElementById('stockout-slider');
  const carrySlider = document.getElementById('carry-slider');

  function sliderFill(slider) {
    const min = parseFloat(slider.min), max = parseFloat(slider.max), v = parseFloat(slider.value);
    if (slider) slider.style.setProperty('--fill', ((v - min) / (max - min)) * 100 + '%');
  }

  // log scale: ₹5 Cr → ₹500 Cr
  function revenueFromSlider(v) {
    const minLog = Math.log(5e7), maxLog = Math.log(5e9);
    return Math.exp(minLog + (v / 100) * (maxLog - minLog));
  }

  function sankethAnnualCost(revenue) {
    if (revenue < 1e8) return 6e5;        // < ₹10 Cr → Growth ₹6 L/yr
    if (revenue < 5e8) return 18e5;       // < ₹50 Cr → Scale ₹18 L/yr
    if (revenue < 2e9) return 36e5;       // < ₹200 Cr → ₹36 L/yr
    return 60e5;                          // Enterprise ₹60 L/yr
  }

  function bump(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function updateROI() {
    if (!revSlider) return;
    const revenue = revenueFromSlider(parseFloat(revSlider.value));
    const stockoutRate = parseFloat(stockoutSlider.value) / 100;
    const carryRate = parseFloat(carrySlider.value) / 100;

    // Savings model (conservative, explained in the UI note)
    const stockoutSaving = revenue * stockoutRate * 0.35;          // recover 35% of lost sales
    const inventoryValue = revenue * 0.22;                         // inventory ≈ 22% of revenue
    const holdingSaving = inventoryValue * carryRate * 0.18;       // cut excess by 18%
    const efficiencySaving = revenue * 0.004;                      // 0.4% of revenue in planning effort
    const cost = sankethAnnualCost(revenue);
    const gross = stockoutSaving + holdingSaving + efficiencySaving;
    const net = gross - cost;
    const roiMultiple = gross / cost;
    const paybackMonths = gross > 0 ? Math.max(0.4, cost / (gross / 12)) : 0;

    // labels
    document.getElementById('rev-val').textContent = formatINR(revenue);
    document.getElementById('stockout-val').textContent = parseFloat(stockoutSlider.value) + '%';
    document.getElementById('carry-val').textContent = parseFloat(carrySlider.value) + '%';

    const netEl = document.getElementById('roi-net');
    if (netEl) {
      netEl.textContent = formatINR(net);
      bump(netEl);
    }

    const roiMulEl = document.getElementById('roi-multiple');
    if (roiMulEl) roiMulEl.textContent = roiMultiple.toFixed(1) + '× ROI';

    const paybackEl = document.getElementById('roi-payback');
    if (paybackEl) {
      paybackEl.textContent =
        paybackMonths < 1 ? '< 1 month payback' : paybackMonths.toFixed(1) + ' months payback';
    }

    // bars (scaled to the largest component)
    const maxVal = Math.max(stockoutSaving, holdingSaving, efficiencySaving, cost);
    function setBar(barId, valId, val, negative) {
      const bar = document.getElementById(barId);
      if (bar) bar.style.width = Math.max((val / maxVal) * 100, 2) + '%';
      const label = document.getElementById(valId);
      if (label) label.textContent = (negative ? '−' : '') + formatINR(val);
    }
    setBar('bar-stockout', 'bar-stockout-val', stockoutSaving);
    setBar('bar-holding', 'bar-holding-val', holdingSaving);
    setBar('bar-eff', 'bar-eff-val', efficiencySaving);
    setBar('bar-cost', 'bar-cost-val', cost, true);
  }

  [revSlider, stockoutSlider, carrySlider].forEach(function (s) {
    if (!s) return;
    s.addEventListener('input', function () {
      sliderFill(s);
      updateROI();
      bump(s.closest('.control-group').querySelector('.control-val'));
    });
    sliderFill(s);
  });
  updateROI();

  /* ---------- Timeline fill ---------- */
  const timeline = document.getElementById('timeline');
  const timelineFill = document.getElementById('timeline-fill');
  if (timeline && timelineFill) {
    const tlObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          timelineFill.style.width = '63%'; // through "Next" milestone
          tlObserver.unobserve(timeline);
        }
      });
    }, { threshold: 0.4 });
    tlObserver.observe(timeline);
  }

  /* ---------- Lead form ---------- */
  const leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const success = document.getElementById('cta-success');
      if (success) success.classList.add('show');
      leadForm.reset();
      setTimeout(function () { if (success) success.classList.remove('show'); }, 6000);
    });
  }

  /* ---------- Mouse Parallax for Hero Floating Cards ---------- */
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && !prefersReducedMotion) {
    window.addEventListener('mousemove', function (e) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mx = (e.clientX - w / 2) / (w / 2); // range [-1, 1]
      const my = (e.clientY - h / 2) / (h / 2); // range [-1, 1]
      
      const wraps = heroVisual.querySelectorAll('.parallax-wrap');
      wraps.forEach(function (wrap) {
        const depth = parseFloat(wrap.getAttribute('data-parallax-depth') || '0.2');
        const tx = mx * depth * 40; // max 40px translation
        const ty = my * depth * 40;
        wrap.style.transform = 'translate3d(' + tx + 'px, ' + ty + 'px, 0)';
      });
    });
  }

})();
