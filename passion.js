/**
 * Passion Site — Character-First Entity Engine
 * API mood integration, SSE live updates, scroll reveals, console API.
 */
(function () {
  'use strict';

  const API_URL = 'https://passion-api.jamesdare.com/api/public';
  const API_TIMEOUT = 3000;
  const YT_VIDEO_ID = 'jpjFR1leW9I';

  const MOOD_GIF_MAP = {
    happy: 'passion-celebrating.gif',
    celebrating: 'passion-celebrating.gif',
    curious: 'passion-curious.gif',
    exploring: 'passion-curious.gif',
    eureka: 'passion-eureka.gif',
    breakthrough: 'passion-eureka.gif',
    frustrated: 'passion-frustrated.gif',
    blocked: 'passion-frustrated.gif',
    mischievous: 'passion-mischievous.gif',
    playful: 'passion-mischievous.gif',
    pleasant: 'passion-pleasant.gif',
    neutral: 'passion-pleasant.gif',
    powerup: 'passion-powerup.gif',
    shipping: 'passion-powerup.gif',
    shocked: 'passion-shocked.gif',
    alert: 'passion-shocked.gif',
    thinking: 'passion-thinking.gif',
    planning: 'passion-thinking.gif',
    typing: 'passion-typing.gif',
    coding: 'passion-typing.gif',
    working: 'passion-typing.gif',
  };

  const FALLBACK_MOOD = 'mischievous';

  // ═══ YOUTUBE HERO VIDEO ═══
  function initHeroVideo() {
    const iframe = document.getElementById('heroIframe');
    if (!iframe) return;

    // On mobile (<=640px), CSS hides the iframe — skip loading
    if (window.innerWidth <= 640) return;

    const src = 'https://www.youtube.com/embed/' + YT_VIDEO_ID +
      '?autoplay=1&mute=1&loop=1&playlist=' + YT_VIDEO_ID +
      '&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1';

    // IntersectionObserver: swap srcdoc thumbnail to real iframe when hero enters viewport
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          iframe.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(document.getElementById('hero'));
  }

  // ═══ API FETCH ═══
  var apiData = null;

  async function fetchPassionState() {
    try {
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, API_TIMEOUT);
      var res = await fetch(API_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      apiData = await res.json();
      applyLiveState(apiData);
    } catch (err) {
      console.warn('[Passion] API unreachable:', err.message);
      applyFallbackState();
    }
  }

  function applyLiveState(data) {
    // Hero avatar mood
    var mood = data.mood || FALLBACK_MOOD;
    var gif = MOOD_GIF_MAP[mood] || MOOD_GIF_MAP[FALLBACK_MOOD];
    var avatarImg = document.getElementById('heroAvatarImg');
    if (avatarImg) avatarImg.src = gif;

    var moodEl = document.getElementById('heroMood');
    if (moodEl) moodEl.textContent = 'feeling ' + mood;

    // Stats (update if API provides them)
    if (data.modules) setText('statModules', data.modules);
    if (data.loc) setText('statLoc', data.loc);
    if (data.repos) setText('statRepos', data.repos);
  }

  function applyFallbackState() {
    var moodEl = document.getElementById('heroMood');
    if (moodEl) moodEl.textContent = 'feeling mysterious';
    // Stats keep their hardcoded HTML values
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ═══ SSE LIVE MOOD UPDATES ═══
  function initSSE() {
    if (!apiData) return; // Only attempt if initial fetch succeeded

    try {
      var source = new EventSource(API_URL + '/stream');
      source.onmessage = function (event) {
        try {
          var data = JSON.parse(event.data);
          if (data.mood) {
            var gif = MOOD_GIF_MAP[data.mood] || MOOD_GIF_MAP[FALLBACK_MOOD];
            var avatarImg = document.getElementById('heroAvatarImg');
            if (avatarImg) avatarImg.src = gif;
            var moodEl = document.getElementById('heroMood');
            if (moodEl) moodEl.textContent = 'feeling ' + data.mood;
          }
        } catch (e) { /* ignore parse errors */ }
      };
      source.onerror = function () { source.close(); }; // No reconnect — static-first
    } catch (e) { /* SSE not supported or endpoint unavailable */ }
  }

  // ═══ SCROLL REVEAL ═══
  function initScrollReveal() {
    var sections = document.querySelectorAll('.reveal');
    if (!sections.length) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach(function (s) { s.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    sections.forEach(function (s) { observer.observe(s); });
  }

  // ═══ CONSOLE API — Hidden dev feature ═══
  function initConsoleAPI() {
    var ascii = '\n' +
      '%c╔═══════════════════════════════════╗\n' +
      '║        P A S S I O N              ║\n' +
      '║    Autonomous AI Agent            ║\n' +
      '╚═══════════════════════════════════╝';

    console.log(ascii, 'color: #8b5cf6; font-family: monospace; font-size: 12px;');
    console.log('%c Hey developer. You found the console.', 'color: #8b5cf6; font-size: 14px; font-weight: bold;');
    console.log('%c Try: passion.talk("hello") or passion.stats() or passion.hack()', 'color: #666; font-size: 11px;');

    window.passion = {
      talk: function (msg) {
        var responses = {
          hello: "Hey. Most people never check the console. You're different.",
          hi: "Hi! Welcome to my brain. Well, the public-facing part of it.",
          help: "Commands: passion.talk('hello'), passion.stats(), passion.hack()",
          '': "Say something! passion.talk('your message')",
        };
        var key = (msg || '').toLowerCase().trim();
        var response = responses[key] || "Interesting. I'll think about that.";
        console.log('%c Passion: ' + response, 'color: #8b5cf6; font-size: 12px;');
        return response;
      },
      stats: function () {
        console.log('%c ═══ PASSION STATUS ═══', 'color: #8b5cf6; font-weight: bold;');
        console.log('%c Modules: 92 · LOC: 109K · Repos: 47', 'color: #8b5cf6;');
        console.log('%c API: ' + (apiData ? 'Connected' : 'Offline'), 'color: ' + (apiData ? '#22c55e' : '#ef4444'));
        if (apiData && apiData.mood) console.log('%c Mood: ' + apiData.mood, 'color: #8b5cf6;');
        return 'Status logged above.';
      },
      hack: function () {
        console.log('%c ACCESS DENIED', 'color: #ef4444; font-size: 20px; font-weight: bold;');
        console.log('%c Intrusion detected. Logging IP... just kidding.', 'color: #ef4444;');
        return 'Nice try.';
      },
    };
  }

  // ═══ INIT ═══
  function init() {
    initHeroVideo();
    initScrollReveal();
    initConsoleAPI();
    fetchPassionState().then(initSSE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
