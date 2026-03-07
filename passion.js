/**
 * Passion Site — Live Data Module
 * Fetches from /api/public via Cloudflare tunnel, falls back to smart defaults.
 */
(function () {
  'use strict';

  const API_URL = 'https://passion-api.jamesdare.com/api/public';
  const CACHE_KEY = 'passion-live-cache';
  const POLL_INTERVAL = 30000; // 30s

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

  /** Returns a time-of-day aware greeting prefix (ET timezone) */
  function getTimeGreeting() {
    // Passion runs in Toronto (ET)
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    const hour = etTime.getHours();

    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Hey there, night owl';
  }

  /** Smart fallback data based on typical Passion behavior */
  function getSmartFallback() {
    const now = new Date();
    const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
    const hour = etTime.getHours();

    // Passion runs 24/7 with 30-min cycles (60/day max)
    // Estimate cycles based on time of day
    const estimatedCycles = Math.min(60, Math.round((hour * 60 + etTime.getMinutes()) / 30));

    // Typical task count scales with cycles (~0.8 tasks per cycle)
    const estimatedTasks = Math.round(estimatedCycles * 0.8);

    // Uptime is usually high — she runs on a dedicated Mac Mini
    const uptimeHours = hour >= 1 ? hour : 24;

    // Focus varies by time of day
    let focus = 'Code';
    if (hour >= 0 && hour < 6) focus = 'Maintenance';
    else if (hour >= 6 && hour < 9) focus = 'Intel Radar';
    else if (hour >= 9 && hour < 12) focus = 'Code';
    else if (hour >= 12 && hour < 15) focus = 'Career Engine';
    else if (hour >= 15 && hour < 18) focus = 'Code';
    else if (hour >= 18 && hour < 21) focus = 'Content';
    else focus = 'Repo Scans';

    // State estimation
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
      greeting: `${getTimeGreeting()}! I'm Passion, James's AI companion. Want the tour?`,
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

  function applyData(data) {
    if (!data) return;

    // Greeting — inject time-aware prefix if API provides a greeting
    const greeting = $('greeting');
    if (greeting) {
      if (data.greeting) {
        greeting.textContent = data.greeting;
      } else {
        greeting.textContent = `${getTimeGreeting()}! I'm Passion, James's AI companion. Want the tour?`;
      }
    }

    // Live badge
    const stateInfo = STATE_MAP[data.state] || STATE_MAP.idle;
    const stateText = $('stateText');
    const pulse = document.querySelector('.pulse');
    const statusDot = $('statusDot');

    if (stateText) stateText.textContent = stateInfo.label;
    if (pulse) pulse.classList.add('active');
    if (statusDot) {
      statusDot.className = 'status-dot ' + stateInfo.dot;
    }

    // Stats
    const statCycles = $('statCycles');
    const statTasks = $('statTasks');
    const statUptime = $('statUptime');
    const statFocus = $('statFocus');

    if (statCycles) statCycles.textContent = data.cyclesTotal ?? '~45';
    if (statTasks) statTasks.textContent = data.tasksToday ?? '~35';
    if (statUptime) statUptime.textContent = data.uptime ?? '24/7';
    if (statFocus) statFocus.textContent = data.currentFocus ?? 'Code';

    // Commentary
    const commentaryText = $('commentaryText');
    const lastActive = $('lastActive');

    if (commentaryText) {
      if (data.commentary) {
        commentaryText.textContent = data.commentary;
      } else {
        commentaryText.textContent = 'Running my usual cycle — scanning repos, checking for things to improve.';
      }
    }
    if (lastActive) {
      if (data.lastActive) {
        lastActive.textContent = `Last active: ${data.lastActive}`;
      } else if (data._isFallback) {
        lastActive.textContent = 'Estimated — live data unavailable';
      } else {
        lastActive.textContent = '';
      }
    }

    // Cache for offline (skip caching fallback data)
    if (!data._isFallback) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _cached: Date.now() }));
      } catch {}
    }
  }

  function applyCachedOrFallback() {
    // Try cache first
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        const age = Date.now() - (cached._cached || 0);
        // Use cache if less than 10 minutes old
        if (age < 600000) {
          applyData(cached);
          const stateTextEl = $('stateText');
          if (stateTextEl) stateTextEl.textContent += ' (cached)';
          return;
        }
      }
    } catch {}

    // Fall back to smart estimates
    applyData(getSmartFallback());

    const stateText = $('stateText');
    if (stateText) {
      const stateInfo = STATE_MAP[getSmartFallback().state] || STATE_MAP.idle;
      stateText.textContent = stateInfo.label + ' (estimated)';
    }
  }

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

  // Particle system — ambient floating dots
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

  // ═══ SCROLL REVEAL — Intersection Observer ═══
  function initScrollReveal() {
    const elements = document.querySelectorAll('.about-card, .building-card, .tech-item, .journal-entry, .commentary-box, .building-cta');

    // Add reveal class and stagger delay
    const groups = {};
    elements.forEach((el) => {
      el.classList.add('reveal');
      const parent = el.parentElement;
      if (!groups[parent]) groups[parent] = 0;
      el.style.setProperty('--reveal-delay', groups[parent]++);
    });

    // Also reveal section titles
    document.querySelectorAll('.section-title').forEach(el => el.classList.add('reveal'));

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

  // ═══ ANIMATED STAT COUNTERS ═══
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
      // Ease-out cubic
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
            if (text && text !== '—') animateCounter(el, text);
          });
          observer.unobserve(strip);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(strip);
  }

  // ═══ ACTIVITY TICKER ═══
  let tickerLines = [
    'Initializing activity feed...',
    'Scanning repos for improvements...',
    'Running security audits across 47 repos...',
  ];
  let tickerIndex = 0;

  function initTicker() {
    setInterval(() => {
      const container = $('tickerContent');
      if (!container) return;
      const lines = container.querySelectorAll('.ticker-line');
      lines.forEach(l => l.classList.remove('active'));
      tickerIndex = (tickerIndex + 1) % lines.length;
      lines[tickerIndex].classList.add('active');
    }, 4000);
  }

  function updateTickerFromAPI(data) {
    const container = $('tickerContent');
    if (!container) return;

    const newLines = [];
    if (data.commentary) newLines.push(data.commentary);
    if (data.currentFocus) newLines.push(`Currently focused on: ${data.currentFocus}`);
    if (data.cyclesTotal) newLines.push(`${data.cyclesTotal} brain cycles completed today`);
    if (data.tasksToday) newLines.push(`${data.tasksToday} tasks shipped so far today`);
    if (data.recentActivity) newLines.push(data.recentActivity);

    if (newLines.length > 0) {
      tickerLines = newLines;
      container.innerHTML = newLines.map((line, i) =>
        `<span class="ticker-line${i === 0 ? ' active' : ''}">${line}</span>`
      ).join('');
      tickerIndex = 0;
    }
  }

  // ═══ TYPEWRITER EFFECT ═══
  let typewriterTimeout = null;

  function typewriterEffect(el, text) {
    if (typewriterTimeout) clearTimeout(typewriterTimeout);
    el.textContent = '';
    // Remove existing cursor
    const existingCursor = el.parentElement.querySelector('.typewriter-cursor');
    if (existingCursor) existingCursor.remove();

    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.after(cursor);

    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        typewriterTimeout = setTimeout(type, 25 + Math.random() * 35);
      }
    }
    type();
  }

  let lastCommentary = '';

  // ═══ INTERACTIVE AVATAR ═══
  function initAvatarInteraction() {
    const avatar = $('avatar');
    if (!avatar) return;

    avatar.addEventListener('click', () => {
      avatar.classList.add('avatar-glitch');
      setTimeout(() => avatar.classList.remove('avatar-glitch'), 400);
    });
  }

  function updateAvatarState(state) {
    const dataRing = document.querySelector('.hud-ring-data');
    if (!dataRing) return;
    // Remove all state classes
    dataRing.className = dataRing.className.replace(/state-\w+/g, '').trim();
    if (state) dataRing.classList.add(`state-${state}`);

    // Mood-based hero background
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.className = hero.className.replace(/mood-\w+/g, '').trim();
      if (['celebrating', 'frustrated', 'focused'].includes(state)) {
        hero.classList.add(`mood-${state}`);
      }
    }
  }

  // Patch applyData to integrate new features
  const _originalApplyData = applyData;
  applyData = function(data) {
    _originalApplyData(data);

    // Update ticker with live data
    updateTickerFromAPI(data);

    // Typewriter on commentary if new
    if (data.commentary && data.commentary !== lastCommentary) {
      const commentaryText = $('commentaryText');
      if (commentaryText) typewriterEffect(commentaryText, data.commentary);
      lastCommentary = data.commentary;
    }

    // Avatar state
    updateAvatarState(data.state);

    // Re-init stat counters (they may have updated)
    if (!statsAnimated) initStatCounters();
  };

  // Adaptive polling — back off if API is consistently down
  function scheduleNextPoll() {
    const delay = consecutiveFailures > 3
      ? Math.min(POLL_INTERVAL * Math.pow(2, consecutiveFailures - 3), 300000) // Max 5 min
      : POLL_INTERVAL;
    setTimeout(() => {
      fetchData().then(scheduleNextPoll);
    }, delay);
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

      // Find the latest PushEvent
      const push = events.find(e => e.type === 'PushEvent' && e.payload && e.payload.commits && e.payload.commits.length > 0);
      if (!push) return;

      const repo = push.repo.name.replace('DareDev256/', '');
      const commit = push.payload.commits[push.payload.commits.length - 1];
      const msg = commit.message.split('\n')[0]; // First line only
      const sha = commit.sha.substring(0, 7);
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
      // Silent fail — commit card stays hidden
      console.warn('[Passion] GitHub API unavailable:', err.message);
    }
  }

  // Init
  initParticles();
  initScrollReveal();
  initStatCounters();
  initTicker();
  initAvatarInteraction();
  fetchData().then(scheduleNextPoll);
  fetchLatestCommit();
})();
