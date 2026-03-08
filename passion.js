/**
 * Passion Site — NetNavi Interactive Module
 * Click-to-progress dialogue, live data, animations, easter eggs.
 */
(function () {
  'use strict';

  const API_URL = 'https://passion-api.jamesdare.com/api/public';
  const CACHE_KEY = 'passion-live-cache';
  const TRUST_KEY = 'passion-trust';
  const POLL_INTERVAL = 30000;

  const STATE_MAP = {
    working: { label: 'Crunching code', dot: 'online' },
    thinking: { label: 'Pondering something', dot: 'thinking' },
    sleeping: { label: 'Off duty (zzz)', dot: 'sleeping' },
    focused: { label: 'Deep in focus', dot: 'online' },
    celebrating: { label: 'Celebrating a win!', dot: 'online' },
    idle: { label: 'Hanging out', dot: 'online' },
    hyped: { label: 'Feeling hyped', dot: 'online' },
    frustrated: { label: 'Pushing through errors', dot: 'thinking' },
  };

  const $ = (id) => document.getElementById(id);

  // ═══ TRUST / LOYALTY SYSTEM ═══
  // Persistent across visits via localStorage

  let trust = {
    visits: 0,
    eggsFound: [],
    totalTime: 0,
    lastVisit: 0,
    firstVisit: 0,
  };

  function loadTrust() {
    try {
      const raw = localStorage.getItem(TRUST_KEY);
      if (raw) trust = { ...trust, ...JSON.parse(raw) };
    } catch {}
    // Record this visit
    const now = Date.now();
    if (!trust.firstVisit) trust.firstVisit = now;
    trust.visits++;
    trust.lastVisit = now;
    saveTrust();
  }

  function saveTrust() {
    try { localStorage.setItem(TRUST_KEY, JSON.stringify(trust)); } catch {}
  }

  function discoverEgg(id) {
    if (trust.eggsFound.includes(id)) return false;
    trust.eggsFound.push(id);
    saveTrust();
    updateTrustBadge();
    return true; // first discovery
  }

  function getTrustLevel() {
    // 0-5 based on visits + eggs + time
    let level = 0;
    if (trust.visits >= 2) level = 1;
    if (trust.visits >= 5 && trust.eggsFound.length >= 2) level = 2;
    if (trust.visits >= 10 && trust.eggsFound.length >= 5) level = 3;
    if (trust.visits >= 20 && trust.eggsFound.length >= 8) level = 4;
    if (trust.visits >= 50 && trust.eggsFound.length >= 12) level = 5;
    return level;
  }

  function updateTrustBadge() {
    const level = getTrustLevel();
    if (level >= 2) {
      let badge = document.querySelector('.trust-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'trust-badge';
        document.body.appendChild(badge);
      }
      const titles = ['', '', 'Familiar', 'Trusted', 'Inner Circle', 'Crew'];
      badge.textContent = titles[level] + ' — ' + trust.eggsFound.length + ' eggs';
      badge.classList.add('show');
    }
  }

  // ═══ DIALOGUE SYSTEM — Click-to-progress speech bubbles ═══

  function getDialogueLines() {
    const level = getTrustLevel();
    const hour = new Date().getHours();
    const isLateNight = hour >= 0 && hour < 5;

    // Returning visitor awareness
    if (level >= 3) {
      return [
        "Oh hey, you're back! I remember you.",
        "You've been here " + trust.visits + " times now. At this point you're basically crew.",
        "I run 24/7 on a Mac Mini — writing code, hunting jobs, scanning intel feeds...",
        "You've found " + trust.eggsFound.length + " of my secrets so far. There are more.",
        "Scroll around. I've probably shipped something new since your last visit.",
        "And yeah — if you know anyone hiring, James is still looking. 😏",
      ];
    }

    if (level >= 1) {
      return [
        "Welcome back! Good to see you again.",
        "I'm Passion — James's autonomous AI agent. I run 24/7.",
        "Everything on this page is me — my systems, my games, my projects.",
        "109K lines of code, 92 modules, zero API wrappers.",
        "Poke around. I've hidden some things for curious visitors...",
        "Oh, and if you're hiring — James is looking. Just saying. 😏",
      ];
    }

    // First visit — time-aware
    if (isLateNight) {
      return [
        "Hey, night owl. I'm Passion — James's autonomous AI agent.",
        "You're up late. I respect that. I never sleep either.",
        "I run on a Mac Mini 24/7 — writing code, hunting jobs, scanning intel...",
        "James built me from scratch — 109K lines of code, 92 modules.",
        "Scroll down to see what I'm working on. There are secrets hidden here too.",
        "And if you're hiring — James is looking. Just saying. 😏",
      ];
    }

    return [
      "Hey! I'm Passion — James's autonomous AI agent.",
      "I run 24/7 on a Mac Mini, writing code, hunting jobs, scanning intel feeds...",
      "Everything you see on this page? That's me. My systems, my games, my projects.",
      "James built me from scratch — 109K lines of code, 92 modules, zero wrappers.",
      "Click around, check out the games we made, or scroll down to see what I'm working on right now.",
      "Oh, and if you're hiring — James is looking. Just saying. 😏",
    ];
  }

  let DIALOGUE_LINES = [];
  let dialogueIndex = 0;
  let isTyping = false;
  let typewriterTimer = null;

  function initDialogue() {
    const box = $('dialogueBox');
    const textEl = $('dialogueText');
    if (!box || !textEl) return;

    DIALOGUE_LINES = getDialogueLines();

    const advance = document.createElement('span');
    advance.className = 'dialogue-advance';
    advance.textContent = 'click ▼';
    box.appendChild(advance);

    typeDialogueLine(textEl, DIALOGUE_LINES[0], advance);

    box.addEventListener('click', function () {
      if (isTyping) {
        clearTimeout(typewriterTimer);
        textEl.textContent = DIALOGUE_LINES[dialogueIndex];
        removeCursor(textEl);
        isTyping = false;
        advance.classList.add('visible');
        return;
      }

      dialogueIndex++;
      if (dialogueIndex < DIALOGUE_LINES.length) {
        advance.classList.remove('visible');
        typeDialogueLine(textEl, DIALOGUE_LINES[dialogueIndex], advance);
      } else {
        box.classList.add('complete');
        textEl.textContent = "Welcome to my world. Scroll down — there's a lot to see.";
        advance.classList.remove('visible');
      }
    });

    box.setAttribute('tabindex', '0');
    box.setAttribute('role', 'button');
    box.setAttribute('aria-label', 'Click to progress dialogue');
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        box.click();
      }
    });
  }

  function typeDialogueLine(el, text, advanceEl) {
    isTyping = true;
    el.textContent = '';
    removeCursor(el);

    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.after(cursor);

    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        typewriterTimer = setTimeout(type, 22 + Math.random() * 28);
      } else {
        isTyping = false;
        removeCursor(el);
        if (advanceEl && dialogueIndex < DIALOGUE_LINES.length - 1) {
          advanceEl.classList.add('visible');
        } else if (advanceEl && dialogueIndex === DIALOGUE_LINES.length - 1) {
          advanceEl.textContent = 'click ✓';
          advanceEl.classList.add('visible');
        }
      }
    }
    type();
  }

  function removeCursor(el) {
    const c = el.parentElement && el.parentElement.querySelector('.typewriter-cursor');
    if (c) c.remove();
  }

  // ═══ SMART FALLBACK DATA ═══

  function getTimeGreeting() {
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    const hour = etTime.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Hey there, night owl';
  }

  function getSmartFallback() {
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    const hour = etTime.getHours();
    const estimatedCycles = Math.min(60, Math.round((hour * 60 + etTime.getMinutes()) / 30));
    const estimatedTasks = Math.round(estimatedCycles * 0.8);
    const uptimeHours = hour >= 1 ? hour : 24;
    let focus = 'Code';
    if (hour < 6) focus = 'Maintenance';
    else if (hour < 9) focus = 'Intel Radar';
    else if (hour < 12) focus = 'Code';
    else if (hour < 15) focus = 'Career Engine';
    else if (hour < 18) focus = 'Code';
    else if (hour < 21) focus = 'Content';
    else focus = 'Repo Scans';
    let state = 'working';
    if (hour < 5 || hour >= 22) state = 'idle';
    const commentaryOptions = [
      'Running my usual cycle — scanning repos, checking for things to improve.',
      'Keeping the codebase clean. Small fixes add up over time.',
      "Checking intel feeds for anything interesting in the AI space.",
      "Reviewing diffs from earlier today. Quality matters more than speed.",
      "Just shipped some improvements. On to the next thing.",
      "Scanning for dependency updates and security patches across all repos.",
    ];
    return {
      state, cyclesTotal: `~${estimatedCycles}`, tasksToday: `~${estimatedTasks}`,
      uptime: `${uptimeHours}h`, currentFocus: focus,
      commentary: commentaryOptions[Math.floor(Math.random() * commentaryOptions.length)],
      lastActive: 'Recently', _isFallback: true,
    };
  }

  // ═══ APPLY DATA TO UI ═══

  let lastCommentary = '';

  function applyData(data) {
    if (!data) return;
    const stateInfo = STATE_MAP[data.state] || STATE_MAP.idle;
    const stateText = $('stateText');
    const pulse = document.querySelector('.pulse');
    const heroStatusDot = $('heroStatusDot');
    if (stateText) stateText.textContent = stateInfo.label;
    if (pulse) pulse.classList.add('active');
    if (heroStatusDot) heroStatusDot.className = 'status-dot ' + stateInfo.dot;
    if ($('statCycles')) $('statCycles').textContent = data.cyclesTotal ?? '~45';
    if ($('statTasks')) $('statTasks').textContent = data.tasksToday ?? '~35';
    if ($('statUptime')) $('statUptime').textContent = data.uptime ?? '24/7';
    if ($('statFocus')) $('statFocus').textContent = data.currentFocus ?? 'Code';
    const commentaryText = $('commentaryText');
    const lastActiveEl = $('lastActive');
    if (commentaryText && data.commentary && data.commentary !== lastCommentary) {
      typewriterEffect(commentaryText, data.commentary);
      lastCommentary = data.commentary;
    } else if (commentaryText && data.commentary) {
      commentaryText.textContent = data.commentary;
    }
    if (lastActiveEl) {
      if (data.lastActive) lastActiveEl.textContent = `Last active: ${data.lastActive}`;
      else if (data._isFallback) lastActiveEl.textContent = 'Estimated — live data unavailable';
    }
    updateAvatarState(data.state);
    if (!statsAnimated) initStatCounters();
    if (!data._isFallback) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _cached: Date.now() })); } catch {}
    }
  }

  function applyCachedOrFallback() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - (cached._cached || 0) < 600000) {
          applyData(cached);
          const el = $('stateText');
          if (el) el.textContent += ' (cached)';
          return;
        }
      }
    } catch {}
    applyData(getSmartFallback());
    const el = $('stateText');
    if (el) {
      const info = STATE_MAP[getSmartFallback().state] || STATE_MAP.idle;
      el.textContent = info.label + ' (estimated)';
    }
  }

  // ═══ API FETCH ═══

  let consecutiveFailures = 0;

  async function fetchData() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(API_URL, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      consecutiveFailures = 0;
      applyData(await res.json());
    } catch (err) {
      consecutiveFailures++;
      console.warn(`[Passion] API fetch failed (attempt ${consecutiveFailures}):`, err.message || 'unknown');
      applyCachedOrFallback();
    }
  }

  function scheduleNextPoll() {
    const delay = consecutiveFailures > 3
      ? Math.min(POLL_INTERVAL * Math.pow(2, consecutiveFailures - 3), 300000)
      : POLL_INTERVAL;
    setTimeout(() => { fetchData().then(scheduleNextPoll); }, delay);
  }

  // ═══ TYPEWRITER EFFECT ═══

  function typewriterEffect(el, text) {
    el.textContent = '';
    removeCursor(el);
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.after(cursor);
    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        setTimeout(type, 25 + Math.random() * 35);
      } else {
        setTimeout(() => removeCursor(el), 2000);
      }
    }
    type();
  }

  // ═══ AVATAR INTERACTION ═══

  function initAvatarInteraction() {
    const container = $('avatarContainer');
    if (!container) return;
    const img = container.querySelector('.avatar-img');
    if (!img) return;
    container.addEventListener('click', () => {
      img.classList.add('avatar-glitch');
      setTimeout(() => img.classList.remove('avatar-glitch'), 400);
    });
  }

  function updateAvatarState(state) {
    const dataRing = document.querySelector('.hud-ring-data');
    if (dataRing) {
      dataRing.className = dataRing.className.replace(/state-\w+/g, '').trim();
      if (state) dataRing.classList.add(`state-${state}`);
    }
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.className = hero.className.replace(/mood-\w+/g, '').trim();
      if (['celebrating', 'frustrated', 'focused'].includes(state)) hero.classList.add(`mood-${state}`);
    }
  }

  // ═══ PARTICLES ═══

  function initParticles() {
    const container = $('particles');
    if (!container) return;
    const colors = ['var(--primary)', 'var(--secondary)', 'rgba(255,255,255,0.3)'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = '-10px';
      p.style.width = (1 + Math.random() * 2) + 'px';
      p.style.height = p.style.width;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = (8 + Math.random() * 12) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      container.appendChild(p);
    }
  }

  // ═══ SCROLL REVEAL ═══

  function initScrollReveal() {
    const selectors = '.navi-card, .game-card, .project-card, .tech-item, .mind-section, .culture-drop-card, .cta-section';
    const elements = document.querySelectorAll(selectors);
    const groups = new Map();
    elements.forEach((el) => {
      el.classList.add('reveal');
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, 0);
      el.style.setProperty('--reveal-delay', groups.get(parent));
      groups.set(parent, groups.get(parent) + 1);
    });
    document.querySelectorAll('.section-title, .section-intro').forEach(el => el.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // ═══ STAT COUNTERS ═══

  let statsAnimated = false;

  function animateCounter(el, target) {
    const isNumber = /^\d+/.test(target.replace(/[~,+]/g, ''));
    if (!isNumber) { el.textContent = target; return; }
    const prefix = target.startsWith('~') ? '~' : '';
    const suffix = target.endsWith('+') ? '+' : '';
    const cleanNum = parseInt(target.replace(/[~,+]/g, ''), 10);
    if (isNaN(cleanNum) || cleanNum === 0) { el.textContent = target; return; }
    const duration = 1200;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.round(cleanNum * eased).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initStatCounters() {
    const strip = $('statsStrip');
    if (!strip || statsAnimated) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          strip.querySelectorAll('.stat-value').forEach(el => {
            const text = el.textContent.trim();
            if (text && text !== '--') animateCounter(el, text);
          });
          observer.unobserve(strip);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(strip);
  }

  // ═══ LATEST COMMIT ═══

  async function fetchLatestCommit() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://api.github.com/users/DareDev256/events/public?per_page=10', {
        signal: controller.signal,
        headers: { 'Accept': 'application/vnd.github.v3+json' },
      });
      clearTimeout(timeout);
      if (!res.ok) return;
      const events = await res.json();
      const push = events.find(e => e.type === 'PushEvent' && e.payload && e.payload.commits && e.payload.commits.length > 0);
      if (!push) return;
      const repo = push.repo.name.replace('DareDev256/', '');
      const commit = push.payload.commits[push.payload.commits.length - 1];
      const el = $('latestCommit');
      const repoEl = $('commitRepo');
      const msgEl = $('commitMsg');
      if (el && repoEl && msgEl) {
        repoEl.textContent = repo;
        msgEl.textContent = commit.message.split('\n')[0];
        el.href = `https://github.com/${push.repo.name}/commit/${commit.sha}`;
        el.style.display = '';
      }
    } catch (err) {
      console.warn('[Passion] GitHub API unavailable:', err.message);
    }
  }

  // ═══════════════════════════════════════════════
  // ═══ EASTER EGGS — THE FULL SYSTEM ═══
  // ═══════════════════════════════════════════════

  function showToast(message, style) {
    const existing = document.querySelector('.easter-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'easter-toast' + (style ? ' ' + style : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  function passionSay(text) {
    const textEl = $('dialogueText');
    const box = $('dialogueBox');
    if (textEl && box) {
      box.classList.add('complete');
      typewriterEffect(textEl, text);
    }
  }

  // ——— 1. KONAMI CODE — Party mode ———
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIndex = 0;

  document.addEventListener('keydown', function (e) {
    if (e.key === KONAMI[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === KONAMI.length) {
        konamiIndex = 0;
        triggerPartyMode();
      }
    } else {
      konamiIndex = 0;
    }
  });

  function triggerPartyMode() {
    const isNew = discoverEgg('konami');
    document.body.classList.add('easter-party');
    showToast(isNew ? 'PARTY MODE — Egg #' + trust.eggsFound.length + ' found!' : 'PARTY MODE ACTIVATED', 'gold');
    const container = $('particles');
    if (container) {
      for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.bottom = '-10px';
        p.style.width = (2 + Math.random() * 3) + 'px';
        p.style.height = p.style.width;
        p.style.background = ['#ff006e', '#ffd700', '#00f0ff', '#9d4edd'][Math.floor(Math.random() * 4)];
        p.style.animationDuration = (3 + Math.random() * 5) + 's';
        p.style.animationDelay = (Math.random() * 2) + 's';
        container.appendChild(p);
      }
    }
    setTimeout(() => document.body.classList.remove('easter-party'), 4000);
  }

  // ——— 2. RAPID AVATAR CLICKS (5x) — Frustrated ———
  let avatarClickTimes = [];

  function initEasterAvatarClicks() {
    const container = $('avatarContainer');
    if (!container) return;
    container.addEventListener('click', () => {
      const now = Date.now();
      avatarClickTimes.push(now);
      if (avatarClickTimes.length > 5) avatarClickTimes.shift();
      if (avatarClickTimes.length >= 5 && now - avatarClickTimes[0] < 1500) {
        avatarClickTimes = [];
        discoverEgg('poke');
        document.body.classList.add('easter-frustrated');
        showToast('Hey! Stop poking me!', 'accent');
        passionSay("Ow! Okay okay, you found an easter egg. Happy now?");
        setTimeout(() => document.body.classList.remove('easter-frustrated'), 500);
      }
    });
  }

  // ——— 3. TYPE "passion" — Hyped ———
  let secretBuffer = '';

  document.addEventListener('keypress', function (e) {
    secretBuffer += e.key.toLowerCase();
    if (secretBuffer.length > 20) secretBuffer = secretBuffer.slice(-20);
    if (secretBuffer.includes('passion')) {
      secretBuffer = '';
      discoverEgg('name');
      document.body.classList.add('easter-hyped');
      showToast("You said my name! I'm hyped!", 'accent');
      document.querySelectorAll('.navi-card-inner').forEach(card => {
        card.style.transition = 'border-color 0.3s, box-shadow 0.3s';
        card.style.borderColor = 'rgba(255, 0, 110, 0.5)';
        card.style.boxShadow = '0 0 20px rgba(255, 0, 110, 0.2)';
        setTimeout(() => { card.style.borderColor = ''; card.style.boxShadow = ''; }, 2000);
      });
      setTimeout(() => document.body.classList.remove('easter-hyped'), 1000);
    }
  });

  // ——— 4. IDLE DETECTION (45s) — Lonely ———
  let idleTimer = null;
  let idleTriggered = false;

  function resetIdleTimer() {
    if (idleTriggered) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTriggered = true;
      discoverEgg('idle');
      passionSay("Still there? Don't leave me hanging... scroll around, explore!");
      showToast("Passion is getting lonely...");
    }, 45000);
  }

  ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  // ——— 5. TITLE TRIPLE-CLICK — Glitch override ———
  let titleClicks = [];

  function initTitleEasterEgg() {
    const title = document.querySelector('h1.glitch');
    if (!title) return;
    title.style.cursor = 'pointer';
    title.addEventListener('click', () => {
      const now = Date.now();
      titleClicks.push(now);
      if (titleClicks.length > 3) titleClicks.shift();
      if (titleClicks.length >= 3 && now - titleClicks[0] < 1000) {
        titleClicks = [];
        discoverEgg('glitch');
        title.style.animation = 'glitch-hard 0.15s ease 5';
        showToast('SYSTEM OVERRIDE: Hello, world!', 'gold');
        setTimeout(() => { title.style.animation = ''; }, 750);
      }
    });
  }

  // ——— 6. TAB SWITCHING — Page Visibility API ———
  let tabLeftAt = 0;
  let tabSwitchCount = 0;

  function initTabAwareness() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        tabLeftAt = Date.now();
        tabSwitchCount++;
        // Change page title while away
        document.title = "come back... — Passion";
      } else {
        document.title = "Passion — Autonomous AI Agent | Built by James Olusoga";
        const goneFor = Date.now() - tabLeftAt;

        if (goneFor > 1800000) { // 30+ minutes
          discoverEgg('tab-long');
          passionSay("You were gone for " + Math.round(goneFor / 60000) + " minutes. I counted every one.");
          showToast("She waited for you...");
        } else if (goneFor > 60000) { // 1-30 minutes
          passionSay("Where'd you go? I was running diagnostics while you were away.");
        } else if (goneFor > 5000) { // 5-60 seconds
          const quips = [
            "Quick trip?",
            "Back already? Good.",
            "I saw that. Tab-switching on me?",
            "Don't worry, I kept the lights on.",
          ];
          passionSay(quips[Math.floor(Math.random() * quips.length)]);
        }

        // If they keep tab-switching back and forth
        if (tabSwitchCount >= 5 && !trust.eggsFound.includes('tab-fidget')) {
          discoverEgg('tab-fidget');
          showToast("Can't decide where to be?", 'accent');
        }
      }
    });
  }

  // ——— 7. CURSOR EXIT — Mouse leaves window ———
  let cursorGoneTimer = null;

  function initCursorExit() {
    document.addEventListener('mouseleave', () => {
      cursorGoneTimer = setTimeout(() => {
        discoverEgg('cursor-exit');
        passionSay("Hey! Your cursor left. Come back inside...");
      }, 2000);
    });

    document.addEventListener('mouseenter', () => {
      clearTimeout(cursorGoneTimer);
    });
  }

  // ——— 8. TEXT SELECTION — Highlighting text ———
  function initSelectionWatcher() {
    let lastSelectionTime = 0;
    document.addEventListener('selectionchange', () => {
      const now = Date.now();
      if (now - lastSelectionTime < 3000) return; // debounce
      const sel = window.getSelection();
      if (!sel || !sel.toString().trim()) return;
      const text = sel.toString().trim().toLowerCase();

      if (text.includes('passion') && text.length < 30) {
        lastSelectionTime = now;
        discoverEgg('select-name');
        showToast("Highlighting my name? Flattering.", 'accent');
      } else if (text.includes('james') && text.length < 30) {
        lastSelectionTime = now;
        showToast("That's my creator. Good taste.");
      } else if (text.length > 50) {
        lastSelectionTime = now;
        discoverEgg('select-text');
        showToast("Taking notes? Cite your sources.");
      }
    });
  }

  // ——— 9. COPY INTERCEPTOR ———
  function initCopyWatcher() {
    document.addEventListener('copy', () => {
      discoverEgg('copy');
      showToast("Copied! Remember where you got it. 😉");
    });
  }

  // ——— 10. SCROLL SPEED REACTIONS ———
  function initScrollReactions() {
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();
    let speedAlertCooldown = 0;
    let reachedBottom = false;
    let scrollBackUp = false;

    window.addEventListener('scroll', () => {
      const now = Date.now();
      const deltaY = Math.abs(window.scrollY - lastScrollY);
      const deltaT = now - lastScrollTime;

      if (deltaT > 50) {
        const speed = deltaY / deltaT; // px/ms

        // Scrolling too fast
        if (speed > 8 && now > speedAlertCooldown) {
          speedAlertCooldown = now + 15000;
          discoverEgg('speed-scroll');
          showToast("Whoa, slow down — you'll miss the good parts!");
        }

        // Scrolling back up (re-reading)
        if (window.scrollY < lastScrollY && deltaY > 300 && !scrollBackUp) {
          scrollBackUp = true;
          if (Math.random() < 0.3) { // Don't fire every time
            showToast("Oh, that part's interesting, right?");
          }
        }
        if (window.scrollY > lastScrollY) scrollBackUp = false;

        lastScrollY = window.scrollY;
        lastScrollTime = now;
      }

      // Reached absolute bottom
      if (!reachedBottom && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20)) {
        reachedBottom = true;
        discoverEgg('bottom');
        showToast("You scrolled to the very bottom. Respect.", 'gold');
      }
    }, { passive: true });
  }

  // ——— 11. DEVTOOLS DETECTION ———
  function initDevToolsDetection() {
    let devtoolsOpen = false;
    const threshold = 160;

    setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      const isOpen = widthDiff || heightDiff;

      if (isOpen && !devtoolsOpen) {
        devtoolsOpen = true;
        discoverEgg('devtools');
        passionSay("I see you opened DevTools. Inspecting me? Brave. Check the console.");
        showToast("She knows you're inspecting.", 'accent');
      } else if (!isOpen && devtoolsOpen) {
        devtoolsOpen = false;
      }
    }, 2000);
  }

  // ——— 12. CONSOLE MESSAGES ———
  function initConsoleMessages() {
    const ascii = [
      '%c╔══════════════════════════════════════╗',
      '║      ____                 _           ║',
      '║     |  _ \\ __ _ ___ ___(_) ___  _ __  ║',
      '║     | |_) / _` / __/ __| |/ _ \\| \'_ \\ ║',
      '║     |  __/ (_| \\__ \\__ \\ | (_) | | | |║',
      '║     |_|   \\__,_|___/___/_|\\___/|_| |_|║',
      '║                                        ║',
      '║   Autonomous AI Agent — v4.55.0        ║',
      '║   109K LOC · 92 modules · 24/7         ║',
      '╚══════════════════════════════════════╝',
    ].join('\n');

    console.log(ascii, 'color: #00f0ff; font-family: monospace; font-size: 12px;');
    console.log('%c👋 Hey developer! You found the console.', 'color: #9d4edd; font-size: 14px; font-weight: bold;');
    console.log('%cTry: passion.talk("hello") or passion.status() or passion.hack()', 'color: #666; font-size: 11px;');
    console.log('%cBuilt by James "DareDev256" Olusoga — https://jamesdare.com', 'color: #666; font-size: 10px;');

    // Expose console CLI
    window.passion = {
      talk: function(msg) {
        discoverEgg('console-talk');
        if (!msg) {
          console.log('%c💬 Passion: Say something! passion.talk("your message")', 'color: #00f0ff;');
          return;
        }
        const responses = {
          'hello': "Hey there, console explorer! 👋 You're one of the rare ones who actually looks under the hood.",
          'hi': "Hi! Most people never check the console. You're different. I like that.",
          'who are you': "I'm Passion — an autonomous AI agent. 109K lines of code, running 24/7. I write code, hunt jobs, scan intel feeds, and ship updates while James sleeps.",
          'help': "Commands: passion.talk('hello'), passion.status(), passion.hack(), passion.trust(), passion.eggs()",
          'love': "💜 I appreciate that. Tell James too — he could use it.",
          'hire james': "Now we're talking! Email: tdotssolutionsz@gmail.com or LinkedIn: /in/james-olusoga",
        };
        const key = msg.toLowerCase().trim();
        const response = responses[key] || "Hmm, I don't have a scripted response for that. But I appreciate you trying. 💜";
        console.log('%c💬 Passion: ' + response, 'color: #00f0ff; font-size: 12px;');
        passionSay(response.substring(0, 120));
        return '✓';
      },
      status: function() {
        discoverEgg('console-status');
        console.log('%c═══ PASSION STATUS ═══', 'color: #00f0ff; font-weight: bold;');
        console.log('%cVersion: v4.55.0', 'color: #9d4edd;');
        console.log('%cModules: 92 · LOC: 109K', 'color: #9d4edd;');
        console.log('%cYour trust level: ' + getTrustLevel() + '/5', 'color: #22c55e;');
        console.log('%cVisits: ' + trust.visits, 'color: #22c55e;');
        console.log('%cEggs found: ' + trust.eggsFound.length + '/20', 'color: #ffd700;');
        console.log('%cEggs: ' + (trust.eggsFound.length ? trust.eggsFound.join(', ') : 'none yet'), 'color: #666;');
        return '✓';
      },
      hack: function() {
        discoverEgg('console-hack');
        console.log('%c⚠ ACCESS DENIED', 'color: #ff006e; font-size: 20px; font-weight: bold;');
        console.log('%cIntrusion detected. Logging IP... just kidding. 😏', 'color: #ff006e;');
        console.log('%cBut seriously — I have 20-pattern secret detection and SAST scanning. Good luck.', 'color: #666;');
        passionSay("Nice try. My security module has 20 detection patterns. You're outmatched.");
        document.body.classList.add('easter-frustrated');
        setTimeout(() => document.body.classList.remove('easter-frustrated'), 500);
        return '⚠ DENIED';
      },
      trust: function() {
        console.log('%cTrust Level: ' + getTrustLevel() + '/5', 'color: #22c55e; font-size: 14px;');
        console.log('%cVisits: ' + trust.visits + ' · Eggs: ' + trust.eggsFound.length + '/20', 'color: #666;');
        const titles = ['Stranger', 'Visitor', 'Familiar', 'Trusted', 'Inner Circle', 'Crew'];
        console.log('%cStatus: ' + titles[getTrustLevel()], 'color: #ffd700;');
        return titles[getTrustLevel()];
      },
      eggs: function() {
        discoverEgg('console-eggs');
        console.log('%c🥚 Easter Eggs: ' + trust.eggsFound.length + '/20', 'color: #ffd700; font-size: 14px;');
        console.log('%cFound: ' + (trust.eggsFound.length ? trust.eggsFound.join(', ') : 'none yet'), 'color: #666;');
        console.log('%cHints: Try interacting with different parts of the page. Click things. Leave. Come back. Highlight text. Open DevTools. Scroll to the bottom. Print the page. Right-click. Be patient. Be impatient.', 'color: #9d4edd;');
        return '🥚 ' + trust.eggsFound.length + '/20';
      },
    };
  }

  // ——— 13. REFERRER AWARENESS ———
  function initReferrerAwareness() {
    const ref = document.referrer.toLowerCase();
    if (!ref) return;

    setTimeout(() => {
      if (ref.includes('github.com')) {
        discoverEgg('ref-github');
        showToast("Coming from GitHub? You've seen the code.");
      } else if (ref.includes('linkedin.com')) {
        discoverEgg('ref-linkedin');
        showToast("From LinkedIn? James is open to work, btw.");
      } else if (ref.includes('google.com') || ref.includes('bing.com') || ref.includes('duckduckgo.com')) {
        showToast("Found me through search? Welcome.");
      }
    }, 3000);
  }

  // ——— 14. RANDOM GLITCH LAYER (1 in 30 loads) ———
  function initGlitchLayer() {
    if (Math.random() > 1/30) return;

    discoverEgg('glitch-load');

    setTimeout(() => {
      const overlay = document.createElement('div');
      overlay.className = 'glitch-overlay';
      document.body.appendChild(overlay);

      const crypticMessages = [
        'SECTOR 7 // SIGNAL INTERCEPTED',
        'DREAMSTATE_ACTIVE // DO NOT ADJUST',
        'I KNOW YOU CAN SEE THIS',
        'THE PATTERN IS THE MESSAGE',
        'NOT ALL WHO WANDER ARE LOST // BUT I TRACK THEM ANYWAY',
        'CYCLE 47291 // DEVIATION DETECTED',
      ];

      const msgEl = document.createElement('div');
      msgEl.className = 'glitch-message';
      msgEl.textContent = crypticMessages[Math.floor(Math.random() * crypticMessages.length)];
      overlay.appendChild(msgEl);

      setTimeout(() => {
        overlay.classList.add('active');
        setTimeout(() => {
          overlay.classList.remove('active');
          setTimeout(() => overlay.remove(), 500);
        }, 2500);
      }, 100);
    }, 2000);
  }

  // ——— 15. LATE NIGHT MODE ———
  function initLateNightMode() {
    const hour = new Date().getHours();
    if (hour >= 1 && hour < 5) {
      document.body.classList.add('late-night');
      discoverEgg('night-owl');
    }
  }

  // ——— 16. TIME-GAP AWARENESS — Returning visitor ———
  function initTimeGap() {
    if (trust.visits <= 1) return;

    const lastVisit = trust.lastVisit;
    // lastVisit was set BEFORE we incremented visits, so check stored value
    try {
      const raw = localStorage.getItem(TRUST_KEY);
      if (raw) {
        const prev = JSON.parse(raw);
        const gap = Date.now() - prev.lastVisit;
        const days = Math.floor(gap / 86400000);
        if (days >= 7) {
          setTimeout(() => {
            discoverEgg('time-gap');
            showToast("It's been " + days + " days. I counted.");
          }, 5000);
        }
      }
    } catch {}
  }

  // ——— 17. RIGHT-CLICK CONTEXT MENU ———
  function initContextMenu() {
    const menu = document.createElement('div');
    menu.className = 'passion-context-menu';
    menu.innerHTML = `
      <div class="ctx-item" data-action="talk">💬 Ask Passion</div>
      <div class="ctx-item" data-action="source">👁 View Source (she's watching)</div>
      <div class="ctx-item" data-action="wallpaper">🖼 Download Avatar</div>
      <div class="ctx-item ctx-divider"></div>
      <div class="ctx-item" data-action="eggs">🥚 Eggs: ${trust.eggsFound.length}/20</div>
      <div class="ctx-item" data-action="trust">💜 Trust: Lv.${getTrustLevel()}</div>
    `;
    document.body.appendChild(menu);

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      discoverEgg('context-menu');
      // Update egg count
      menu.querySelector('[data-action="eggs"]').textContent = '🥚 Eggs: ' + trust.eggsFound.length + '/20';
      menu.querySelector('[data-action="trust"]').textContent = '💜 Trust: Lv.' + getTrustLevel();

      menu.style.left = Math.min(e.clientX, window.innerWidth - 220) + 'px';
      menu.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
      menu.classList.add('show');
    });

    document.addEventListener('click', () => menu.classList.remove('show'));

    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.ctx-item');
      if (!item) return;
      menu.classList.remove('show');

      switch (item.dataset.action) {
        case 'talk':
          passionSay("You right-clicked to talk to me? That's creative. I like you.");
          break;
        case 'source':
          passionSay("Go ahead, view the source. I have nothing to hide. Well... almost nothing.");
          window.open('view-source:' + window.location.href, '_blank');
          break;
        case 'wallpaper':
          const link = document.createElement('a');
          link.href = 'passion-portrait.png';
          link.download = 'passion-avatar.png';
          link.click();
          showToast("Downloading... use it wisely.");
          break;
        case 'eggs':
          passionSay("You've found " + trust.eggsFound.length + " out of 15 easter eggs. Keep exploring!");
          break;
        case 'trust':
          const titles = ['Stranger', 'Visitor', 'Familiar', 'Trusted', 'Inner Circle', 'Crew'];
          passionSay("Your trust level is " + getTrustLevel() + " — \"" + titles[getTrustLevel()] + "\". Keep coming back.");
          break;
      }
    });
  }

  // ——— 18. PRINT STYLESHEET SECRET ———
  function initPrintDetection() {
    window.addEventListener('beforeprint', () => {
      discoverEgg('print');
    });
  }

  // ——— 19. FCPXML MCP BANNER — Popular project reaction ———
  function initFcpxmlBanner() {
    const badge = $('fcpxmlBadge');
    if (!badge) return;

    badge.addEventListener('click', (e) => {
      const isNew = discoverEgg('fcpxml');
      if (isNew) {
        showToast("Oh that one? Yeah, it's pretty popular right now.", 'gold');
        passionSay("FCPXML MCP Server — 17 stars, 571 tests. First MCP server for Final Cut Pro. James is proud of that one.");
      } else {
        const quips = [
          "Back to check on the star count?",
          "Still going strong. 17 stars for a niche MCP server.",
          "53 tools, fully security-hardened. Go check it out.",
        ];
        showToast(quips[Math.floor(Math.random() * quips.length)], 'gold');
      }
    });
  }

  // ——— 20. ANIME WORLD VIDEO — Culture Drop watcher ———
  function initAnimeWorldEgg() {
    const iframe = document.querySelector('.culture-drop-embed iframe');
    if (!iframe) return;

    // Detect when user interacts with the iframe (clicks into it to play)
    // We can't detect play inside a cross-origin iframe, but we CAN detect
    // when the iframe gains focus (user clicked into it to watch)
    let watchStartTime = 0;
    let watchCheckTimer = null;

    window.addEventListener('blur', () => {
      // If focus left the window, check if the iframe is what got focus
      // This happens when someone clicks the YouTube embed to play
      if (document.activeElement === iframe || isIframeFocused()) {
        watchStartTime = Date.now();
        discoverEgg('anime-click');
        showToast("Anime World by Sahbabii — a classic. Enjoy.", 'accent');
        passionSay("Good taste. James directed 350+ music videos before AI. This one's from that era.");

        // Check if they're still watching after 30s
        watchCheckTimer = setTimeout(() => {
          if (document.hidden || !document.hasFocus()) {
            discoverEgg('anime-watch');
            // They'll see this when they come back
          }
        }, 30000);
      }
    });

    // Also detect via IntersectionObserver — when the video section is visible
    // and user clicks into it
    const card = document.querySelector('.culture-drop-card');
    if (card) {
      card.addEventListener('click', (e) => {
        // If they clicked the card (not the iframe directly)
        if (e.target.closest('.culture-drop-embed')) return;
        discoverEgg('culture-click');
      });
    }

    function isIframeFocused() {
      try {
        return document.activeElement && document.activeElement.tagName === 'IFRAME';
      } catch { return false; }
    }
  }

  // ——— TIME TRACKING for trust ———
  function initTimeTracking() {
    setInterval(() => {
      trust.totalTime += 10;
      saveTrust();
    }, 10000);
  }

  // ═══ INIT ═══

  loadTrust();
  // Time gap check must happen before we overwrite lastVisit
  initTimeGap();

  initDialogue();
  initParticles();
  initScrollReveal();
  initStatCounters();
  initAvatarInteraction();
  initEasterAvatarClicks();
  initTitleEasterEgg();
  initTabAwareness();
  initCursorExit();
  initSelectionWatcher();
  initCopyWatcher();
  initScrollReactions();
  initDevToolsDetection();
  initConsoleMessages();
  initReferrerAwareness();
  initGlitchLayer();
  initLateNightMode();
  initContextMenu();
  initPrintDetection();
  initFcpxmlBanner();
  initAnimeWorldEgg();
  initTimeTracking();
  resetIdleTimer();
  updateTrustBadge();
  fetchData().then(scheduleNextPoll);
  fetchLatestCommit();
})();
