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

  // Adaptive polling — back off if API is consistently down
  function scheduleNextPoll() {
    const delay = consecutiveFailures > 3
      ? Math.min(POLL_INTERVAL * Math.pow(2, consecutiveFailures - 3), 300000) // Max 5 min
      : POLL_INTERVAL;
    setTimeout(() => {
      fetchData().then(scheduleNextPoll);
    }, delay);
  }

  // Init
  initParticles();
  fetchData().then(scheduleNextPoll);
})();
