/* ============================================================
   SANKETH — "Sanket" Guided Voice Tour
   Primary voice: pre-generated neural audio (audio/*.mp3,
   en-IN-PrabhatNeural via generate_voice.py).
   Fallback: browser Speech Synthesis if a clip fails to load.
   ============================================================ */
(function () {
  'use strict';

  const hasTTS = 'speechSynthesis' in window;
  const AUDIO_BASE = 'audio/';

  /* ---------- Tour script ---------- */
  // IMPORTANT: keep these texts identical to generate_voice.py — both files
  // split sentences with the same regex to derive matching clip filenames.
  const STEPS = [
    {
      target: '#hero',
      text: "Namaste, and welcome! I'm Sanket, your guide. Sanketh means 'the signal' in Sanskrit — and that's exactly what we sell: the signal before demand moves. Give me two minutes, and I'll walk you through the product, the market, and the returns — all in rupees."
    },
    {
      target: '#problem',
      text: "First, the problem. Indian businesses lose nearly one point seven five lakh crore rupees every year to stockouts — customers walk away when shelves are empty. Another thirty percent of working capital sits frozen in unsold inventory. Why? Because most companies still plan stock with spreadsheets and gut feeling."
    },
    {
      target: '#solution',
      text: "Our answer is three words: Sense. Predict. Act. Sanketh connects to a company's sales systems, reads live market signals — search trends, social buzz, even weather — runs twelve AI forecasting models, and tells the operations team exactly what to stock, five to fourteen days before demand shifts."
    },
    {
      target: '#product',
      action: function () { clickTab('fashion'); },
      text: "Here is the product in action — this dashboard below is a live preview. For fashion brands, Sanketh reads social trends to predict which styles will sell, and cuts end-of-season markdown losses by over forty percent."
    },
    {
      target: '#product',
      action: function () { clickTab('pharma'); },
      text: "Now watch — one click, and the same engine serves pharmaceuticals. Batch tracking, cold-chain monitoring, and audit-ready compliance built to U S FDA standards. This is a regulatory moat that competitors cannot easily copy. Five industries. One platform."
    },
    {
      target: '#market',
      text: "The market. Globally, this is a one hundred and forty lakh crore rupee category. In India alone, supply-chain software is worth eight and a half thousand crore rupees — and we are targeting four hundred and twenty five crores of it within five years."
    },
    {
      target: '#business',
      text: "Our business model is classic SaaS. Subscriptions start at about fifty thousand rupees a month, and scale to enterprise contracts above forty lakhs a year — with eighty five percent gross margins, and a target of six and a half rupees returned for every one rupee spent on sales."
    },
    {
      target: '#roi',
      action: function () { demoRoiSlider(); },
      text: "And here is the pitch that closes customers. Watch the numbers — for a typical twenty five crore revenue business, Sanketh saves around eighty four lakh rupees a year. That is a five point seven times return on investment, with payback in just over two months."
    },
    {
      target: '#roadmap',
      text: "One more thing — this is not a slide deck. The platform is already built and live today. The investment goes into go-to-market: ten paying pilots this year, and a twelve crore rupee A R R target by twenty twenty seven."
    },
    {
      target: '#cta',
      text: "That's Sanketh — we read the signal before demand moves. Try the live product, or request our investor deck right here. Thank you for listening — I hope you join us on this journey!"
    }
  ];

  /* ---------- Step helper actions ---------- */
  function clickTab(industry) {
    const tab = document.querySelector('.ind-tab[data-industry="' + industry + '"]');
    if (tab) tab.click();
  }

  let sliderTimer = null;
  function demoRoiSlider() {
    const slider = document.getElementById('rev-slider');
    if (!slider) return;
    clearInterval(sliderTimer);
    let v = 5;
    const target = 35; // ≈ ₹25 Cr
    slider.value = v;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    sliderTimer = setInterval(function () {
      v += 1;
      slider.value = v;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      if (v >= target) clearInterval(sliderTimer);
    }, 90);
  }

  /* ---------- Build UI ---------- */
  const launchBtn = document.createElement('button');
  launchBtn.id = 'tour-launch';
  launchBtn.innerHTML =
    '<span class="tl-icon"><svg viewBox="0 0 32 32" aria-hidden="true">' +
    '<circle cx="9" cy="23" r="3.2" fill="currentColor"/>' +
    '<path d="M9 16a7 7 0 0 1 7 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
    '<path d="M9 10.5a12.5 12.5 0 0 1 12.5 12.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.7"/>' +
    '</svg></span>' +
    '<span class="tl-text"><strong>Meet Sanket</strong><small>Voice-guided tour · 2 min</small></span>';
  document.body.appendChild(launchBtn);

  const hud = document.createElement('div');
  hud.id = 'tour-hud';
  hud.innerHTML =
    '<div class="tour-progress"><span id="tour-progress-fill"></span></div>' +
    '<div class="tour-hud-main">' +
    '  <div class="tour-avatar" id="tour-avatar">' +
    '    <svg viewBox="0 0 32 32" aria-hidden="true">' +
    '      <circle cx="9" cy="23" r="3.2"/>' +
    '      <path d="M9 16a7 7 0 0 1 7 7" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
    '      <path d="M9 10.5a12.5 12.5 0 0 1 12.5 12.5" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.75"/>' +
    '    </svg>' +
    '    <span class="eq"><i></i><i></i><i></i><i></i></span>' +
    '  </div>' +
    '  <div class="tour-body">' +
    '    <div class="tour-name">Sanket <span id="tour-step-count"></span></div>' +
    '    <div class="tour-caption" id="tour-caption"></div>' +
    '  </div>' +
    '  <div class="tour-controls">' +
    '    <button id="tour-prev" title="Previous section" aria-label="Previous">⏮</button>' +
    '    <button id="tour-toggle" title="Pause / resume" aria-label="Pause or resume">⏸</button>' +
    '    <button id="tour-next" title="Next section" aria-label="Next">⏭</button>' +
    '    <button id="tour-close" title="End tour" aria-label="End tour">✕</button>' +
    '  </div>' +
    '</div>';
  document.body.appendChild(hud);

  const captionEl = document.getElementById('tour-caption');
  const stepCountEl = document.getElementById('tour-step-count');
  const progressFill = document.getElementById('tour-progress-fill');
  const avatar = document.getElementById('tour-avatar');
  const toggleBtn = document.getElementById('tour-toggle');

  /* ---------- Fallback voice selection (browser TTS) ---------- */
  function pickVoice() {
    if (!hasTTS) return null;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    const score = function (v) {
      let s = 0;
      if (/en[-_]IN/i.test(v.lang)) s += 100;
      else if (/^en/i.test(v.lang)) s += 40;
      if (/ravi|prabhat|madhur/i.test(v.name)) s += 30;
      if (/neerja|heera|swara/i.test(v.name)) s += 20;
      if (/natural|online/i.test(v.name)) s += 15;
      if (/google/i.test(v.name)) s += 8;
      return s;
    };
    return voices.slice().sort(function (a, b) { return score(b) - score(a); })[0];
  }
  if (hasTTS) {
    speechSynthesis.getVoices();
    if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
      speechSynthesis.onvoiceschanged = function () { speechSynthesis.getVoices(); };
    }
  }

  /* ---------- Sound engine: neural clips + TTS fallback ---------- */
  let touring = false;
  let paused = false;
  let stepIndex = 0;
  let session = 0;          // generation token: invalidates callbacks of stopped speech
  let currentAudio = null;  // the <audio> clip currently playing

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function clipUrl(stepIdx, sentenceIdx) {
    return AUDIO_BASE + 'step' + pad2(stepIdx + 1) + '_' + pad2(sentenceIdx + 1) + '.mp3';
  }

  function splitSentences(text) {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  function stopAllSound() {
    if (currentAudio) {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio = null;
    }
    if (hasTTS) speechSynthesis.cancel();
  }

  function speakFallback(sentence, mySession, onDone) {
    if (!hasTTS) { setTimeout(onDone, Math.max(1600, sentence.length * 55)); return; }
    const u = new SpeechSynthesisUtterance(sentence);
    const voice = pickVoice();
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    u.rate = 0.98;
    u.onend = function () { if (mySession === session) onDone(); };
    u.onerror = function () { if (mySession === session) onDone(); };
    speechSynthesis.speak(u);
  }

  function playSentence(stepIdx, sentenceIdx, sentence, mySession, onDone) {
    const a = new Audio(clipUrl(stepIdx, sentenceIdx));
    currentAudio = a;
    let fellBack = false;
    function fallback() {
      if (fellBack || mySession !== session) return;
      fellBack = true;
      currentAudio = null;
      speakFallback(sentence, mySession, onDone);
    }
    a.onended = function () {
      if (mySession !== session) return;
      currentAudio = null;
      onDone();
    };
    a.onerror = fallback;
    a.play().catch(fallback);
  }

  function preloadStep(stepIdx) {
    if (stepIdx < 0 || stepIdx >= STEPS.length) return;
    splitSentences(STEPS[stepIdx].text).forEach(function (s, j) {
      const a = new Audio();
      a.preload = 'auto';
      a.src = clipUrl(stepIdx, j);
    });
  }

  function speakStep(stepIdx, mySession, done) {
    const sentences = splitSentences(STEPS[stepIdx].text);
    let i = 0;
    function next() {
      if (mySession !== session) return;
      if (i >= sentences.length) { done(); return; }
      const sentence = sentences[i].trim();
      captionEl.textContent = sentence;
      playSentence(stepIdx, i, sentence, mySession, function () {
        if (mySession !== session) return;
        setTimeout(next, 140); // tiny breath between sentences
      });
      i++;
    }
    next();
  }

  /* ---------- Tour engine ---------- */
  function highlight(targetSel) {
    document.querySelectorAll('section').forEach(function (s) { s.classList.remove('tour-spot'); });
    const el = document.querySelector(targetSel);
    if (el) {
      el.classList.add('tour-spot');
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function runStep(idx) {
    if (idx < 0 || idx >= STEPS.length) { endTour(); return; }
    stepIndex = idx;
    session++;
    const mySession = session;
    stopAllSound();
    paused = false;
    toggleBtn.textContent = '⏸';
    avatar.classList.add('speaking');

    const step = STEPS[idx];
    stepCountEl.textContent = '· ' + (idx + 1) + ' / ' + STEPS.length;
    progressFill.style.width = ((idx + 1) / STEPS.length * 100) + '%';
    highlight(step.target);
    if (step.action) { try { step.action(); } catch (e) { /* page state not ready — narration continues */ } }
    preloadStep(idx + 1);

    // Small delay so the scroll settles before Sanket speaks.
    setTimeout(function () {
      if (mySession !== session) return;
      speakStep(idx, mySession, function () {
        avatar.classList.remove('speaking');
        if (mySession !== session) return;
        setTimeout(function () {
          if (mySession === session && touring) runStep(idx + 1);
        }, 600);
      });
    }, 700);
  }

  function startTour() {
    touring = true;
    document.body.classList.add('touring');
    hud.classList.add('open');
    launchBtn.classList.add('hidden');
    preloadStep(0);
    runStep(0);
  }

  function endTour() {
    touring = false;
    session++;
    stopAllSound();
    clearInterval(sliderTimer);
    document.body.classList.remove('touring');
    document.querySelectorAll('section').forEach(function (s) { s.classList.remove('tour-spot'); });
    hud.classList.remove('open');
    launchBtn.classList.remove('hidden');
    avatar.classList.remove('speaking');
  }

  function pauseTour() {
    if (!touring || paused) return;
    paused = true;
    if (currentAudio) currentAudio.pause();
    if (hasTTS) speechSynthesis.pause();
    toggleBtn.textContent = '▶';
    avatar.classList.remove('speaking');
  }

  function resumeTour() {
    if (!touring || !paused) return;
    paused = false;
    if (currentAudio) currentAudio.play().catch(function () { /* resume blocked — user can skip */ });
    if (hasTTS) speechSynthesis.resume();
    toggleBtn.textContent = '⏸';
    avatar.classList.add('speaking');
  }

  /* ---------- Controls ---------- */
  launchBtn.addEventListener('click', startTour);
  document.getElementById('tour-close').addEventListener('click', endTour);
  document.getElementById('tour-next').addEventListener('click', function () {
    if (touring) runStep(Math.min(stepIndex + 1, STEPS.length - 1));
  });
  document.getElementById('tour-prev').addEventListener('click', function () {
    if (touring) runStep(Math.max(stepIndex - 1, 0));
  });
  toggleBtn.addEventListener('click', function () {
    paused ? resumeTour() : pauseTour();
  });

  // Stop sound if the visitor leaves the page mid-tour.
  window.addEventListener('beforeunload', stopAllSound);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && touring) pauseTour();
  });

})();
