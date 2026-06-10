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

  /* ---------- Preloader ---------- */
  window.addEventListener('load', function () {
    setTimeout(function () {
      const pre = document.getElementById('preloader');
      if (pre) pre.classList.add('hidden');
    }, 700);
  });
  // Safety: never trap the user behind the preloader
  setTimeout(function () {
    const pre = document.getElementById('preloader');
    if (pre) pre.classList.add('hidden');
  }, 3500);

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

  /* ---------- Cursor glow ---------- */
  const glow = document.getElementById('cursor-glow');
  if (glow && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    let gx = -600, gy = -600, tx = gx, ty = gy;
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';
      requestAnimationFrame(loop);
    })();
  } else if (glow) {
    glow.style.display = 'none';
  }

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

  /* ---------- 3D tilt cards ---------- */
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      let raf = null;
      card.addEventListener('mousemove', function (e) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          const rx = (0.5 - py) * 6;
          const ry = (px - 0.5) * 6;
          card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        });
      });
      card.addEventListener('mouseleave', function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      });
    });
    // spotlight position for stat cards
    document.querySelectorAll('.stat-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + dx * 0.18 + 'px,' + dy * 0.22 + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------- Hero particle network ---------- */
  const canvas = document.getElementById('hero-canvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    const COUNT = window.innerWidth < 700 ? 36 : 70;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0006,
        vy: (Math.random() - 0.5) * 0.0006,
        r: Math.random() * 1.6 + 0.6
      });
    }
    function drawParticles() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140, 130, 255, 0.55)';
        ctx.fill();
        for (let j = i + 1; j < COUNT; j++) {
          const q = particles[j];
          const dx = (p.x - q.x) * W, dy = (p.y - q.y) * H;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x * W, p.y * H);
            ctx.lineTo(q.x * W, q.y * H);
            ctx.strokeStyle = 'rgba(109, 92, 255,' + (0.14 * (1 - d / 130)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ---------- Hero mini chart (animated line draw) ---------- */
  function buildPath(points, w, h) {
    let d = '';
    points.forEach(function (p, i) {
      const x = (i / (points.length - 1)) * w;
      const y = h - p * h;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    });
    return d;
  }
  const heroChart = document.getElementById('hero-chart');
  if (heroChart) {
    const pts = [0.35, 0.4, 0.32, 0.45, 0.42, 0.55, 0.5, 0.62, 0.58, 0.7, 0.68, 0.8];
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML =
      '<linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(25,211,255,0.35)"/>' +
      '<stop offset="100%" stop-color="rgba(25,211,255,0)"/></linearGradient>';
    heroChart.appendChild(defs);

    const area = document.createElementNS(ns, 'path');
    area.setAttribute('d', buildPath(pts, 420, 110) + 'L420,120 L0,120 Z');
    area.setAttribute('fill', 'url(#heroFill)');
    heroChart.appendChild(area);

    const line = document.createElementNS(ns, 'path');
    line.setAttribute('d', buildPath(pts, 420, 110));
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#19d3ff');
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('stroke-linecap', 'round');
    heroChart.appendChild(line);

    if (!prefersReducedMotion) {
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      line.getBoundingClientRect();
      line.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(0.22,1,0.36,1) 0.9s';
      line.style.strokeDashoffset = '0';
      area.style.opacity = '0';
      area.style.transition = 'opacity 1.4s ease 1.8s';
      requestAnimationFrame(function () { area.style.opacity = '1'; });
    }
  }

  /* ---------- Live ticker feed ---------- */
  const ticker = document.getElementById('live-ticker');
  if (ticker) {
    const cities = ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Kochi'];
    const events = [
      function () {
        const amt = 800 + Math.floor(Math.random() * 22000);
        return { icon: '🛒', html: '<strong>New order</strong> · ' + pick(cities), amount: '+₹' + amt.toLocaleString('en-IN'), cls: '' };
      },
      function () {
        const days = 5 + Math.floor(Math.random() * 10);
        return { icon: '⚠️', html: '<strong>Stockout predicted</strong> · SKU ' + skuCode(), amount: days + 'd out', cls: 'warn' };
      },
      function () {
        return { icon: '📈', html: '<strong>Demand spike sensed</strong> · ' + pick(['Google Trends', 'social buzz', 'weather signal']), amount: '+' + (4 + Math.floor(Math.random() * 25)) + '%', cls: '' };
      },
      function () {
        const amt = 30000 + Math.floor(Math.random() * 400000);
        return { icon: '💰', html: '<strong>Reorder optimized</strong> · holding cost cut', amount: '+' + formatINR(amt).replace('₹', '₹'), cls: '' };
      },
      function () {
        return { icon: '🚨', html: '<strong>Critical alert</strong> · SKU ' + skuCode() + ' · acted on', amount: 'resolved', cls: 'crit' };
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
      item.innerHTML = '<span class="t-icon">' + ev.icon + '</span><span>' + ev.html + '</span><span class="t-amount ' + ev.cls + '">' + ev.amount + '</span>';
      ticker.insertBefore(item, ticker.firstChild);
      while (ticker.children.length > 7) ticker.removeChild(ticker.lastChild);
    }
    for (let i = 0; i < 5; i++) addTick();
    setInterval(addTick, 2600);
  }

  /* ---------- Industry showcase ---------- */
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
      seed: [0.42, 0.45, 0.4, 0.5, 0.46, 0.55, 0.52, 0.6, 0.64, 0.6, 0.7, 0.76]
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
      seed: [0.5, 0.48, 0.55, 0.5, 0.6, 0.56, 0.5, 0.62, 0.68, 0.74, 0.7, 0.8]
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
      seed: [0.55, 0.56, 0.54, 0.58, 0.56, 0.6, 0.58, 0.62, 0.6, 0.64, 0.66, 0.68]
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
      seed: [0.3, 0.34, 0.3, 0.38, 0.5, 0.66, 0.72, 0.66, 0.5, 0.4, 0.36, 0.42]
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
      seed: [0.45, 0.44, 0.46, 0.45, 0.47, 0.46, 0.5, 0.52, 0.5, 0.55, 0.54, 0.58]
    }
  };

  const indInfo = document.getElementById('industry-info');
  const dashKpis = document.getElementById('dash-kpis');
  const dashAlerts = document.getElementById('dash-alerts');
  const dashTitle = document.getElementById('dash-title');
  const dashSvg = document.getElementById('dash-chart-svg');
  const dashBody = document.querySelector('.dash-body');

  function renderDashChart(seed) {
    if (!dashSvg) return;
    const ns = 'http://www.w3.org/2000/svg';
    dashSvg.innerHTML =
      '<defs><linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="rgba(109,92,255,0.4)"/>' +
      '<stop offset="100%" stop-color="rgba(109,92,255,0)"/></linearGradient></defs>';

    const W = 560, H = 200, histN = 6;
    // build history + forecast with widening p10/p90 band
    const hist = seed.slice(0, histN);
    const fc = seed.slice(histN - 1);
    const upper = fc.map(function (v, i) { return Math.min(v + 0.04 + i * 0.025, 0.97); });
    const lower = fc.map(function (v, i) { return Math.max(v - 0.04 - i * 0.025, 0.03); });

    function xAt(i, off) { return ((i + (off || 0)) / (seed.length - 1)) * W; }
    function yAt(v) { return H - v * H; }

    // band polygon
    let bandD = 'M';
    upper.forEach(function (v, i) { bandD += xAt(i, histN - 1).toFixed(1) + ',' + yAt(v).toFixed(1) + ' L'; });
    for (let i = lower.length - 1; i >= 0; i--) {
      bandD += xAt(i, histN - 1).toFixed(1) + ',' + yAt(lower[i]).toFixed(1) + (i === 0 ? '' : ' L');
    }
    bandD += ' Z';
    const band = document.createElementNS(ns, 'path');
    band.setAttribute('d', bandD);
    band.setAttribute('fill', 'url(#dashFill)');
    dashSvg.appendChild(band);

    // history line
    let histD = '';
    hist.forEach(function (v, i) { histD += (i === 0 ? 'M' : 'L') + xAt(i).toFixed(1) + ',' + yAt(v).toFixed(1) + ' '; });
    const histLine = document.createElementNS(ns, 'path');
    histLine.setAttribute('d', histD);
    histLine.setAttribute('fill', 'none');
    histLine.setAttribute('stroke', 'rgba(170,176,208,0.7)');
    histLine.setAttribute('stroke-width', '2.5');
    dashSvg.appendChild(histLine);

    // forecast line
    let fcD = '';
    fc.forEach(function (v, i) { fcD += (i === 0 ? 'M' : 'L') + xAt(i, histN - 1).toFixed(1) + ',' + yAt(v).toFixed(1) + ' '; });
    const fcLine = document.createElementNS(ns, 'path');
    fcLine.setAttribute('d', fcD);
    fcLine.setAttribute('fill', 'none');
    fcLine.setAttribute('stroke', '#19d3ff');
    fcLine.setAttribute('stroke-width', '3');
    fcLine.setAttribute('stroke-linecap', 'round');
    fcLine.setAttribute('stroke-dasharray', '1 7');
    dashSvg.appendChild(fcLine);

    // "today" divider
    const div = document.createElementNS(ns, 'line');
    div.setAttribute('x1', xAt(histN - 1)); div.setAttribute('x2', xAt(histN - 1));
    div.setAttribute('y1', 0); div.setAttribute('y2', H);
    div.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    div.setAttribute('stroke-dasharray', '4 5');
    dashSvg.appendChild(div);

    if (!prefersReducedMotion) {
      [histLine, fcLine].forEach(function (ln, idx) {
        const len = ln.getTotalLength();
        ln.style.strokeDasharray = idx === 1 ? '1 7' : len;
        if (idx === 0) {
          ln.style.strokeDashoffset = len;
          ln.getBoundingClientRect();
          ln.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)';
          ln.style.strokeDashoffset = '0';
        } else {
          ln.style.opacity = '0';
          ln.getBoundingClientRect();
          ln.style.transition = 'opacity 0.9s ease 0.8s';
          ln.style.opacity = '1';
        }
      });
      band.style.opacity = '0';
      band.getBoundingClientRect();
      band.style.transition = 'opacity 1s ease 1s';
      band.style.opacity = '1';
    }
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
      renderDashChart(d.seed);

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
    renderDashChart(d.seed);
  })();

  /* ---------- ROI Calculator (INR) ---------- */
  const revSlider = document.getElementById('rev-slider');
  const stockoutSlider = document.getElementById('stockout-slider');
  const carrySlider = document.getElementById('carry-slider');

  function sliderFill(slider) {
    const min = parseFloat(slider.min), max = parseFloat(slider.max), v = parseFloat(slider.value);
    slider.style.setProperty('--fill', ((v - min) / (max - min)) * 100 + '%');
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
    netEl.textContent = formatINR(net);
    bump(netEl);

    document.getElementById('roi-multiple').textContent = roiMultiple.toFixed(1) + '× ROI';
    document.getElementById('roi-payback').textContent =
      paybackMonths < 1 ? '< 1 month payback' : paybackMonths.toFixed(1) + ' months payback';

    // bars (scaled to the largest component)
    const maxVal = Math.max(stockoutSaving, holdingSaving, efficiencySaving, cost);
    function setBar(barId, valId, val, negative) {
      document.getElementById(barId).style.width = Math.max((val / maxVal) * 100, 2) + '%';
      document.getElementById(valId).textContent = (negative ? '−' : '') + formatINR(val);
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

})();
