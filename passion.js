/**
 * Passion Site — NetNavi Interactive Module
 * Click-to-progress dialogue, live data, animations.
 */
(function () {
  'use strict';

  const API_URL = 'https://passion-api.jamesdare.com/api/public';
  const CACHE_KEY = 'passion-live-cache';
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

  // ═══ DIALOGUE SYSTEM — Click-to-progress speech bubbles ═══

  const DIALOGUE_LINES = [
    "Hey! I'm Passion — James's autonomous AI agent.",
    "I run 24/7 on a Mac Mini, writing code, hunting jobs, scanning intel feeds...",
    "Everything you see on this page? That's me. My systems, my games, my projects.",
    "James built me from scratch — 109K lines of code, 92 modules, zero wrappers.",
    "Click around, check out the games we made, or scroll down to see what I'm working on right now.",
    "Oh, and if you're hiring — James is looking. Just saying. 😏",
  ];

  let dialogueIndex = 0;
  let isTyping = false;
  let typewriterTimer = null;

  function initDialogue() {
    const box = $('dialogueBox');
    const textEl = $('dialogueText');
    if (!box || !textEl) return;

    // Add advance indicator
    const advance = document.createElement('span');
    advance.className = 'dialogue-advance';
    advance.textContent = 'click ▼';
    box.appendChild(advance);

    // Start first line
    typeDialogueLine(textEl, DIALOGUE_LINES[0], advance);

    box.addEventListener('click', function () {
      if (isTyping) {
        // Skip typing animation — show full text immediately
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
        // Dialogue complete
        box.classList.add('complete');
        textEl.textContent = "Welcome to my world. Scroll down — there's a lot to see.";
        advance.classList.remove('visible');
      }
    });

    // Keyboard support
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
    if (hour >= 0 && hour < 6) focus = 'Maintenance';
    else if (hour >= 6 && hour < 9) focus = 'Intel Radar';
    else if (hour >= 9 && hour < 12) focus = 'Code';
    else if (hour >= 12 && hour < 15) focus = 'Career Engine';
    else if (hour >= 15 && hour < 18) focus = 'Code';
    else if (hour >= 18 && hour < 21) focus = 'Content';
    else focus = 'Repo Scans';

    let state = 'working';
    if (hour >= 0 && hour < 5) state = 'idle';
    else if (hour >= 22) state = 'idle';

    const commentaryOptions = [
      'Running my usual cycle — scanning repos, checking for things to improve.',
      'Keeping the codebase clean. Small fixes add up over time.',
      "Checking intel feeds for anything interesting in the AI space.",
      "Reviewing diffs from earlier today. Quality matters more than speed.",
      "Just shipped some improvements. On to the next thing.",
      "Scanning for dependency updates and security patches across all repos.",
    ];
    const commentary = commentaryOptions[Math.floor(Math.random() * commentaryOptions.length)];

    return {
      state,
      cyclesTotal: `~${estimatedCycles}`,
      tasksToday: `~${estimatedTasks}`,
      uptime: `${uptimeHours}h`,
      currentFocus: focus,
      commentary,
      lastActive: 'Recently',
      _isFallback: true,
    };
  }

  // ═══ APPLY DATA TO UI ═══

  let lastCommentary = '';

  function applyData(data) {
    if (!data) return;

    // Live badge
    const stateInfo = STATE_MAP[data.state] || STATE_MAP.idle;
    const stateText = $('stateText');
    const pulse = document.querySelector('.pulse');
    const heroStatusDot = $('heroStatusDot');

    if (stateText) stateText.textContent = stateInfo.label;
    if (pulse) pulse.classList.add('active');
    if (heroStatusDot) heroStatusDot.className = 'status-dot ' + stateInfo.dot;

    // Stats
    if ($('statCycles')) $('statCycles').textContent = data.cyclesTotal ?? '~45';
    if ($('statTasks')) $('statTasks').textContent = data.tasksToday ?? '~35';
    if ($('statUptime')) $('statUptime').textContent = data.uptime ?? '24/7';
    if ($('statFocus')) $('statFocus').textContent = data.currentFocus ?? 'Code';

    // Commentary (What's on My Mind)
    const commentaryText = $('commentaryText');
    const lastActiveEl = $('lastActive');

    if (commentaryText && data.commentary && data.commentary !== lastCommentary) {
      typewriterEffect(commentaryText, data.commentary);
      lastCommentary = data.commentary;
    } else if (commentaryText && data.commentary) {
      commentaryText.textContent = data.commentary;
    }

    if (lastActiveEl) {
      if (data.lastActive) {
        lastActiveEl.textContent = `Last active: ${data.lastActive}`;
      } else if (data._isFallback) {
        lastActiveEl.textContent = 'Estimated — live data unavailable';
      }
    }

    // Avatar state
    updateAvatarState(data.state);

    // Trigger stat counters
    if (!statsAnimated) initStatCounters();

    // Cache
    if (!data._isFallback) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _cached: Date.now() }));
      } catch {}
    }
  }

  function applyCachedOrFallback() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        const age = Date.now() - (cached._cached || 0);
        if (age < 600000) {
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
      const res = await fetch(API_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      consecutiveFailures = 0;
      applyData(data);
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
        // Keep cursor blinking for a bit then remove
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
      if (['celebrating', 'frustrated', 'focused'].includes(state)) {
        hero.classList.add(`mood-${state}`);
      }
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
      const current = Math.round(cleanNum * eased);
      el.textContent = prefix + current.toLocaleString() + suffix;
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

  // ═══ LATEST COMMIT — GitHub Events API ═══

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
      const msg = commit.message.split('\n')[0];
      const url = `https://github.com/${push.repo.name}/commit/${commit.sha}`;

      const el = $('latestCommit');
      const repoEl = $('commitRepo');
      const msgEl = $('commitMsg');

      if (el && repoEl && msgEl) {
        repoEl.textContent = repo;
        msgEl.textContent = msg;
        el.href = url;
        el.style.display = '';
      }
    } catch (err) {
      console.warn('[Passion] GitHub API unavailable:', err.message);
    }
  }

  // ═══ INIT ═══

  initDialogue();
  initParticles();
  initScrollReveal();
  initStatCounters();
  initAvatarInteraction();
  fetchData().then(scheduleNextPoll);
  fetchLatestCommit();
})();
