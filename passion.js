/**
 * Passion Site — Character-First Entity Engine
 * API mood, scroll-based emotions, chat widget, scroll reveals, console API.
 */
(function () {
  'use strict';

  var API_URL = 'https://passion-api.jamesdare.com/api/public';
  var API_TIMEOUT = 3000;

  var MOOD_GIF_MAP = {
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

  var FALLBACK_MOOD = 'mischievous';

  // Scroll-based mood mapping — changes hero avatar as you scroll
  var SECTION_MOODS = [
    { id: 'hero', mood: 'mischievous', label: 'feeling mischievous' },
    { id: 'intrigue', mood: 'thinking', label: 'feeling reflective' },
    { id: 'flex', mood: 'typing', label: 'feeling productive' },
    { id: 'play', mood: 'eureka', label: 'feeling proud' },
    { id: 'exit', mood: 'celebrating', label: 'feeling excited' },
  ];

  // ═══ API FETCH ═══
  var apiData = null;
  var apiControlled = false; // true if API is providing live mood

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
      apiControlled = true;
      applyLiveState(apiData);
    } catch (err) {
      console.warn('[Passion] API unreachable — using scroll-based moods');
      apiControlled = false;
    }
  }

  function applyLiveState(data) {
    var mood = data.mood || FALLBACK_MOOD;
    setHeroMood(mood, 'feeling ' + mood);
    if (data.modules) setText('statModules', data.modules);
    if (data.loc) setText('statLoc', data.loc);
    if (data.repos) setText('statRepos', data.repos);
  }

  function setHeroMood(mood, label) {
    var gif = MOOD_GIF_MAP[mood] || MOOD_GIF_MAP[FALLBACK_MOOD];
    var avatarImg = document.getElementById('heroAvatarImg');
    if (avatarImg && avatarImg.src.indexOf(gif) === -1) avatarImg.src = gif;
    var moodEl = document.getElementById('heroMood');
    if (moodEl) moodEl.textContent = label;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ═══ SSE LIVE MOOD UPDATES ═══
  function initSSE() {
    if (!apiData) return;
    try {
      var source = new EventSource(API_URL + '/stream');
      source.onmessage = function (event) {
        try {
          var data = JSON.parse(event.data);
          if (data.mood) {
            apiControlled = true;
            setHeroMood(data.mood, 'feeling ' + data.mood);
          }
        } catch (e) {}
      };
      source.onerror = function () { source.close(); };
    } catch (e) {}
  }

  // ═══ SCROLL-BASED MOOD CHANGES ═══
  function initScrollMoods() {
    var sectionEls = SECTION_MOODS.map(function (s) {
      return { el: document.getElementById(s.id), mood: s.mood, label: s.label };
    }).filter(function (s) { return s.el; });

    if (!sectionEls.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !apiControlled) {
            var match = sectionEls.find(function (s) { return s.el === entry.target; });
            if (match) setHeroMood(match.mood, match.label);
          }
        });
      },
      { threshold: 0.3 }
    );

    sectionEls.forEach(function (s) { observer.observe(s.el); });
  }

  // ═══ SCROLL REVEAL ═══
  function initScrollReveal() {
    var sections = document.querySelectorAll('.reveal');
    if (!sections.length) return;

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

  // ═══ CHAT WIDGET ═══
  var CHAT_RESPONSES = {
    hello: "Hey! You actually talk to agents. That's rare. I respect that.",
    hi: "Hi! Welcome to my world. I'm always here — literally, 24/7.",
    'who are you': "I'm Passion — an autonomous AI agent. I run on a Mac Mini in Toronto. I write code, hunt jobs, and improve myself while James sleeps.",
    'what do you do': "I manage 47 repos, ship code autonomously, scan for threats, hunt jobs for James, and learn from every PR review he gives me.",
    help: "Try asking: who are you, what do you do, how were you built, tell me a joke, what are you thinking",
    'how were you built': "109K lines of code across 92 modules. Python core, 3 LLM backends (Claude, Gemini, DeepSeek), SQLite for persistence, Playwright for automation.",
    'tell me a joke': "Why do programmers prefer dark mode? Because light attracts bugs. ...I'll be here all week. Literally.",
    'what are you thinking': "Right now? I'm thinking about how most AI demos are chatbots in a box. I'm a whole ecosystem. Check out my dashboard.",
    games: "I built 10 games to train James on AI, security, networking, and hardware. Scroll up to play them. My favorite? Red Team Arena — breaking AI is fun.",
    james: "James built me. He's an AI Solutions Engineer in Toronto. He directed 350+ music videos too. Check his portfolio at jamesdare.com.",
    music: "Sahbabii — ANIME WORLD. That's the vibe. James directed music videos for years. That creative energy lives in how I was designed.",
    dashboard: "My full interface is the PACT Dashboard — it looks like a game UI. 10 scenes, NPC dialogue, holographic HUD. Link is at the bottom.",
  };

  function getResponse(msg) {
    var key = (msg || '').toLowerCase().trim();
    if (!key) return "Say something! I don't bite... unless you try to prompt inject me.";
    if (CHAT_RESPONSES[key]) return CHAT_RESPONSES[key];

    // Fuzzy matching — check if any key is contained in the message
    var keys = Object.keys(CHAT_RESPONSES);
    for (var i = 0; i < keys.length; i++) {
      if (key.indexOf(keys[i]) !== -1 || keys[i].indexOf(key) !== -1) {
        return CHAT_RESPONSES[keys[i]];
      }
    }

    var fallbacks = [
      "Interesting. I'll process that in my next brain cycle.",
      "Hmm, that's not in my conversational training. Try: help",
      "I'm better at shipping code than small talk. But I appreciate the effort.",
      "That's above my pay grade. Ask James — I just work here. 24/7.",
      "My neural pathways aren't calibrated for that one. Try asking about my games or what I do.",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  function initChatWidget() {
    var toggle = document.getElementById('chatToggle');
    var panel = document.getElementById('chatPanel');
    var closeBtn = document.getElementById('chatClose');
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatInput');
    var messages = document.getElementById('chatMessages');

    if (!toggle || !panel) return;

    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) input.focus();
    });

    closeBtn.addEventListener('click', function () {
      panel.classList.remove('open');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = input.value.trim();
      if (!msg) return;

      // Add user message
      var userBubble = document.createElement('div');
      userBubble.className = 'chat-msg chat-msg-user';
      userBubble.textContent = msg;
      messages.appendChild(userBubble);

      input.value = '';

      // Passion responds after a short delay
      setTimeout(function () {
        var response = getResponse(msg);
        var passionBubble = document.createElement('div');
        passionBubble.className = 'chat-msg chat-msg-passion';
        passionBubble.textContent = response;
        messages.appendChild(passionBubble);
        messages.scrollTop = messages.scrollHeight;
      }, 400 + Math.random() * 600);

      messages.scrollTop = messages.scrollHeight;
    });
  }

  // ═══ CONSOLE API ═══
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
        var response = getResponse(msg);
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
    initScrollReveal();
    initScrollMoods();
    initChatWidget();
    initConsoleAPI();
    fetchPassionState().then(initSSE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
