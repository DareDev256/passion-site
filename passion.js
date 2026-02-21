/**
 * Passion Site — Live Data Module
 * Fetches from /api/public via Cloudflare tunnel, falls back to cache.
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

  function applyData(data) {
    if (!data) return;

    // Greeting
    const greeting = $('greeting');
    if (greeting) greeting.textContent = data.greeting || "Hey! I'm Passion.";

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

    if (statCycles) statCycles.textContent = data.cyclesTotal ?? '—';
    if (statTasks) statTasks.textContent = data.tasksToday ?? '—';
    if (statUptime) statUptime.textContent = data.uptime ?? '—';
    if (statFocus) statFocus.textContent = data.currentFocus ?? '—';

    // Commentary
    const moodEmoji = $('moodEmoji');
    const commentaryText = $('commentaryText');
    const lastActive = $('lastActive');

    // Don't replace SVG icon with emoji — keep the digital look
    if (commentaryText && data.commentary) {
      commentaryText.textContent = data.commentary;
    }
    if (lastActive) lastActive.textContent = data.lastActive ? `Last active: ${data.lastActive}` : '';

    // Cache for offline
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _cached: Date.now() }));
    } catch {}
  }

  function applyOffline() {
    const stateText = $('stateText');
    if (stateText) stateText.textContent = 'Offline — checking back soon';

    const greeting = $('greeting');
    if (greeting) greeting.textContent = "Hey! I'm Passion, James's AI companion. I'm off duty right now, but feel free to look around!";

    // Try loading from cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached) {
        applyData(cached);
        const stateTextEl = $('stateText');
        if (stateTextEl) stateTextEl.textContent += ' (cached)';
      }
    } catch {}
  }

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
      applyData(data);
    } catch {
      applyOffline();
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

  // Init
  initParticles();
  fetchData();
  setInterval(fetchData, POLL_INTERVAL);
})();
