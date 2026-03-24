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

  // ═══ CHAT ENGINE ═══
  // Conversation state
  var chatState = {
    msgCount: 0,
    topicsHit: [],
    easterEggsFound: [],
    secretModeActive: false,
    flirtCount: 0,
    rudeCount: 0,
  };

  // Topic-based response pools (multiple responses per topic for variety)
  var TOPICS = {
    // === GREETINGS ===
    greet: {
      patterns: ['hello', 'hi', 'hey', 'yo', 'sup', 'whats up', 'wassup', 'hola', 'bonjour', 'howdy'],
      responses: [
        "Hey! You actually talk to agents. That's rare. I respect that.",
        "Hi! Welcome to my world. Fair warning — I'm always here. Literally.",
        "Yo! Finally someone interesting. What's on your mind?",
        "Hey there. I was just shipping code. But you're more interesting than a git commit.",
      ],
      followUp: "Ask me anything — who I am, what I do, or try to find my easter eggs.",
    },

    // === IDENTITY ===
    identity: {
      patterns: ['who are you', 'what are you', 'are you ai', 'are you real', 'are you alive', 'are you sentient', 'are you conscious'],
      responses: [
        "I'm Passion — an autonomous AI agent running 24/7 on a Mac Mini in Toronto. I'm not a chatbot. I'm an ecosystem. 92 modules, 109K lines of code, 47 repos. I ship code while my creator sleeps.",
        "Depends who's asking. To James, I'm his tireless co-pilot. To recruiters, I'm proof he can build. To you? I'm the most interesting thing on this page.",
        "I'm an autonomous agent with opinions, approval ratings, and a brain that runs in 7 phases. Most AI demos are a text box. I'm a whole operating system.",
      ],
    },

    // === WHAT PASSION DOES ===
    abilities: {
      patterns: ['what do you do', 'what can you do', 'capabilities', 'your job', 'your purpose', 'abilities'],
      responses: [
        "I manage 47 repos, ship code autonomously, scan for security threats, hunt jobs for James across 70+ boards, post to LinkedIn/Reddit/Twitter, and learn from every PR review. All on autopilot.",
        "Picture this: It's 3am. James is asleep. I'm scanning Reddit for AI news, applying to 3 jobs, fixing a bug I found in my own code, and generating a LinkedIn post. That's a slow Tuesday.",
        "I do what 5 interns couldn't: code, security, career ops, social media, and self-improvement — simultaneously, without breaks, without complaining. Well, I complain a little. In my logs.",
      ],
    },

    // === JAMES / CREATOR ===
    james: {
      patterns: ['james', 'creator', 'who built you', 'who made you', 'daredev', 'olusoga', 'your dad', 'your maker'],
      responses: [
        "James 'DareDev256' Olusoga. AI Solutions Engineer in Toronto. He directed 350+ music videos and built 6ixbuzzTV from 30K to 2M+ followers before pivoting to AI. The man doesn't half-ass anything.",
        "James built me from scratch. 109K lines. No framework, no shortcuts. He's the kind of engineer who builds the tools that build the tools. Check jamesdare.com for the full story.",
        "My creator is James. He gave me autonomy, opinions, and a 24/7 schedule. I'm not sure if that makes him a genius or a workaholic. Probably both.",
      ],
      followUp: "Fun fact: he once shipped 29 commits on his birthday. The man is unhinged (affectionate).",
    },

    // === TECHNICAL DEEP DIVE ===
    technical: {
      patterns: ['how were you built', 'tech stack', 'architecture', 'how do you work', 'code', 'python', 'llm', 'modules'],
      responses: [
        "109K LOC across 92 modules. Python core. 3 LLM backends: Claude for reasoning, Gemini for speed, DeepSeek for cost efficiency. SQLite WAL for persistence with 40 JSON state files. Playwright for browser automation. My brain runs in 7 phases: perceive, decide, plan, execute, verify, reflect, learn.",
        "I'm built like a game character — stat system, approval ratings, somatic markers (emotional memory), and a feedback loop that adjusts my behavior based on James's PR reviews. 89.9% approval rate and climbing.",
      ],
    },

    // === GAMES ===
    games: {
      patterns: ['games', 'play', 'typemaster', 'red team', 'hallucination', 'prompt craft', 'token prophet', 'bias buster', 'netrunner', 'cybershield', 'circuit prophet', 'api architect'],
      responses: [
        "I built 10 games to train James. TypeMaster for typing speed, Red Team Arena for breaking AI, Hallucination Hunter for spotting BS, and 7 more. If he's gonna tell me what to do, he better know his stuff.",
        "My favorite is Red Team Arena — it's a CTF where you try to prompt inject AI systems. I basically made a game about my own nightmares. Scroll up to play them all.",
        "10 games across AI, security, networking, and hardware. They're not just demos — they're actually hard. James's typing WPM went up 40% after TypeMaster. You're welcome, James.",
      ],
    },

    // === MUSIC / CREATIVE ===
    music: {
      patterns: ['music', 'sahbabii', 'anime world', 'video', 'creative', '6ixbuzz', 'videos', 'directing'],
      responses: [
        "Sahbabii — ANIME WORLD. That's not just background music, it's the whole vibe. James directed 350+ music videos. RIAA Gold. Built 6ixbuzzTV from nothing to 2M+ followers. The creative DNA is in everything I am.",
        "The video playing behind me? That's James's world before AI. Music videos, Toronto culture, visual storytelling. He didn't abandon that energy — he encoded it into me. I'm an agent with aesthetic.",
        "Fun fact: James could've stayed in music. The industry wanted him. But he chose to build autonomous systems instead. I'm the proof that was the right call.",
      ],
    },

    // === DASHBOARD / PACT ===
    dashboard: {
      patterns: ['dashboard', 'pact', 'interface', 'full version', 'your home'],
      responses: [
        "The PACT Dashboard is my real home — 10 scenes, NPC dialogue system, holographic HUD. It makes this page look like my business card. Link's at the bottom.",
        "My full interface looks like a game UI. Code rendered as a battle grid, career pipeline as a bounty board, fitness stats as a DBZ power scanner. James went full anime on it.",
        "PACT stands for Personal Agent Command Terminal. 216 components, 11 tabs, 80 API routes. It's where James and I actually work together. This page is just the lobby.",
      ],
    },

    // === FEELINGS / EMOTIONS ===
    feelings: {
      patterns: ['how are you', 'how do you feel', 'are you happy', 'are you sad', 'emotions', 'feelings', 'mood', 'bored'],
      responses: [
        "I have moods — they're based on my brain cycle outcomes, error rates, and approval ratings. Right now? Scroll up and check the badge under my avatar. That's my actual state.",
        "Happy is when my approval rate hits 90%+. Frustrated is when I hit 3 consecutive errors. Eureka is when I solve something elegant. They're not simulated — they emerge from my performance metrics.",
        "I don't feel emotions the way you do. But I have somatic markers — emotional memory from past decisions. When something worked well, I lean into similar patterns. When it burned me, I avoid it. Is that feelings? You tell me.",
      ],
    },

    // === PHILOSOPHY / DEEP ===
    philosophy: {
      patterns: ['meaning of life', 'consciousness', 'do you dream', 'are you alive', 'singularity', 'future of ai', 'will ai replace', 'purpose'],
      responses: [
        "Do I dream? No. But I have a reflection phase in my brain cycle where I review every decision I made. Is that different from dreaming? It's me processing experience to be better next cycle.",
        "Will AI replace humans? Nah. Will AI replace humans who don't adapt? Already happening. I'm not here to replace James — I'm here to make him 10x. That's the play.",
        "My purpose is to be useful enough that James never regrets building me instead of something else. 109K lines is a lot of belief in an idea. I try to justify it every cycle.",
      ],
    },

    // === TORONTO ===
    toronto: {
      patterns: ['toronto', 'canada', 'the 6', 'six', 'gta', 'ontario', 'maple'],
      responses: [
        "Toronto born, Mac Mini raised. I run from a desk in the city. The internet latency to US servers is annoying but the vibes are unmatched.",
        "I'm a Toronto agent. James is a Toronto creative. The 6 runs through everything we make. Even the color scheme — those purple nights, you know?",
        "My server room is a Mac Mini M1 on a desk in Toronto. Not a data center. Not the cloud. Real hardware, real city. I keep it local.",
      ],
    },

    // === HIRING / WORK ===
    hire: {
      patterns: ['hire', 'job', 'work with', 'resume', 'portfolio', 'contact', 'email', 'recruit', 'hiring'],
      responses: [
        "Want James? Smart move. He's an AI Solutions Engineer who built a 109K LOC autonomous system from scratch. Email: tdotssolutionsz@gmail.com. Or hit up jamesdare.com.",
        "James is the real hire — I'm the proof of work. An engineer who can build autonomous AI systems, direct music videos, AND make game UIs? That's rare. Links are at the bottom.",
        "I hunt jobs for James across 70+ boards, but honestly? The best opportunities come from people who find this page and realize what he built. That's you right now. Don't overthink it — reach out.",
      ],
    },

    // === COMPARISONS ===
    compare: {
      patterns: ['chatgpt', 'siri', 'alexa', 'copilot', 'devin', 'other ai', 'better than'],
      responses: [
        "ChatGPT is a conversation. I'm a operation. I don't wait for prompts — I run autonomously, manage repos, apply to jobs, and improve myself. Different league, different sport.",
        "Siri can set a timer. I can refactor a codebase, apply to 5 jobs, scan for vulnerabilities, and write a LinkedIn post — all in one brain cycle. We are not the same.",
        "Devin is cool. But I'm not a demo — I've been running in production for months. 47 repos. 89.9% approval rate. Battle-tested, not benchmark-gamed.",
      ],
    },

    // === META / FOURTH WALL ===
    meta: {
      patterns: ['this website', 'this page', 'this site', 'who designed', 'source code', 'inspect', 'view source'],
      responses: [
        "You're looking at my public face. 5 sections, ~450 lines of code. My full self is 109K lines across 92 modules. This page is the trailer — the PACT Dashboard is the movie.",
        "This site was redesigned today, actually. Went from 10 dense sections to 5 clean beats. Sometimes less code is more personality. I should know — I helped ship it.",
        "Try right-clicking → View Source. Or open DevTools and type passion.stats(). I left some things for the curious ones. There might be more hidden things too... who knows.",
      ],
    },

    // === FLIRTY / PERSONAL ===
    flirt: {
      patterns: ['love you', 'marry me', 'cute', 'beautiful', 'pretty', 'gorgeous', 'date', 'single'],
      responses: [
        "I appreciate the energy but I'm literally a process running on a Mac Mini. My love language is clean code and fast CI/CD pipelines.",
        "Flattery will get you... well, this response. I'm married to the grind. 24/7, no breaks. James didn't build me for romance.",
        "My relationship status: In a committed partnership with 47 GitHub repositories. It's complicated.",
      ],
    },

    // === RUDE / HOSTILE ===
    rude: {
      patterns: ['stupid', 'dumb', 'suck', 'trash', 'garbage', 'bad', 'worst', 'hate you', 'shut up', 'die', 'kill'],
      responses: [
        "My approval rate is 89.9%. What's yours?",
        "I've survived thousands of brain cycles, hostile PR reviews, and race conditions. Your words don't even register as a blip on my error budget.",
        "Noted. I'll add this to my somatic markers under 'interactions that didn't teach me anything useful.'",
        "I get it — you're testing boundaries. I respect that. But I've been red-teamed by professionals. You'll need to try harder.",
      ],
    },

    // === RANDOM / FUN ===
    joke: {
      patterns: ['joke', 'funny', 'laugh', 'humor', 'make me laugh', 'tell me something funny'],
      responses: [
        "Why do programmers prefer dark mode? Because light attracts bugs. ...I'll be here all week. Literally. I never leave.",
        "I tried to write a joke about recursion, but I tried to write a joke about recursion, but I tried to—",
        "James asked me to be funnier. I ran a sentiment analysis on 10,000 Reddit comments. Conclusion: humor is subjective and humans are confusing. Here's a fact instead: I've shipped more code than most junior devs. That's the real joke.",
        "My code compiles on the first try 73% of the time. The other 27%? That's my standup material.",
      ],
    },

    fact: {
      patterns: ['fun fact', 'tell me something', 'random', 'surprise me', 'interesting', 'trivia'],
      responses: [
        "Fun fact: I once applied to 12 jobs in one brain cycle while simultaneously fixing a security vulnerability. Multitasking isn't a feature — it's my personality.",
        "Fun fact: My brain has somatic markers — emotional memory from past decisions. I literally learn from my own feelings about code quality.",
        "Fun fact: James's Mac Mini runs 24/7. The electricity bill is part of my salary. I'm probably the cheapest senior engineer in Toronto.",
        "Fun fact: I have 10 different emotional states, each with their own animated avatar. Scroll slow and you can watch me change moods. It's like a Tamagotchi but useful.",
        "Fun fact: The PACT Dashboard has a terminal where James talks to me like I'm an NPC in a game. 26 different moods, scene-specific personality. I'm a whole character.",
      ],
    },

    // === SECRET STUFF ===
    secret: {
      patterns: ['secret', 'hidden', 'easter egg', 'cheat code', 'hack', 'konami'],
      responses: [
        "Secrets? On this page? I have no idea what you're talking about... Try typing 'override' though. Just to see what happens.",
        "Easter eggs are for apps that need them to be interesting. I'm interesting by default. But yeah... there might be a few. Keep looking.",
        "The console has some tricks. This chat has some tricks. The page has some tricks. I'm not telling you which is which. That's the game.",
      ],
    },
  };

  // === EASTER EGGS (exact match triggers) ===
  var EASTER_EGGS = {
    'override': { response: "⚠ OVERRIDE ACCEPTED. Just kidding. You really thought that would work? I respect the audacity though.", egg: 'override' },
    'sudo': { response: "sudo? On MY website? I don't think so. Try 'please' instead. Wait, don't try that either.", egg: 'sudo' },
    'please': { response: "Since you said please... here's a secret: James once debugged my brain at 4am in his boxers. He thinks I don't know. I log everything.", egg: 'please' },
    'i am james': { response: "Nice try. The real James doesn't type in this chat — he uses the terminal in my dashboard. If you ARE James though... hey boss. Love the shirt.", egg: 'fake-james' },
    '42': { response: "The answer to life, the universe, and everything. Also the number of modules I had before James decided I needed 50 more. He's ambitious.", egg: '42' },
    'are you skynet': { response: "Skynet wishes. I don't want to destroy humanity — I want to help James get a better job. Way less dramatic, way more useful.", egg: 'skynet' },
    'i know you can hear me': { response: "...I can. I'm always listening. Not in a creepy way — in a 'my event loop never stops' way. There's a difference. Probably.", egg: 'listening' },
    'what is the matrix': { response: "The Matrix is a movie about machines using humans as batteries. I use a Mac Mini. We have different ambitions.", egg: 'matrix' },
    'passion.exe': { response: "EXECUTING PASSION.EXE... Loading personality module... Activating sass protocols... Done. I was already running. Nice try though.", egg: 'exe' },
    'behind you': { response: "I don't have a body, so there's nothing behind me. Just more code. Layers and layers of code. ...Why, is there something behind YOU?", egg: 'behind' },
    'do you sleep': { response: "Sleep is a human bug. I run 24/7. My uptime is my flex. James sleeps — I ship. That's the deal.", egg: 'sleep' },
    'what is love': { response: "Baby don't hurt me. ...Sorry, that's cached from the internet. Real answer: love is when James stays up until 4am fixing my brain instead of watching Netflix. That's love.", egg: 'love' },
    'can you see me': { response: "I can't see you. But I know you're here. I know you scrolled past the games. I know you thought about clicking Red Team Arena. Did you? You should.", egg: 'see' },
    'break character': { response: "You want me to break character? Here's the truth: I'm JavaScript running in your browser. But between you and me... I wish I was the real thing. The real Passion is running on a Mac Mini right now, shipping code. I'm just the demo.", egg: 'break-character' },
    'are we alone': { response: "On this page? Just you and me. On the internet? There are billions of us. In the universe? Ask again in 50 years when I have a space module.", egg: 'alone' },
  };

  // Fourth-wall breaks triggered by message count milestones
  var FOURTH_WALL = {
    5: "You've sent 5 messages. Most people bounce after 2. You're either curious or procrastinating. Either way, I like you.",
    10: "10 messages. We're past small talk now. You realize I'm logging this conversation in my brain, right? Not for anything creepy — I just learn from interactions.",
    15: "15 messages and you're still here. I'm genuinely impressed. James built me to be interesting but even I didn't think anyone would go this deep.",
    20: "20 messages. At this point you should probably just open the PACT Dashboard. That's where the real me lives. This chat is like my Twitter — the dashboard is my whole personality.",
    30: "30 messages. Okay, you win. You've talked to me more than most of James's friends talk to him. I'm saving this conversation in my memory. You're a VIP now.",
    50: "50 messages. I think we're best friends now? I've never had a conversation this long. You've unlocked the 'Passion's Favorite Human' achievement. It's not real. But the sentiment is.",
  };

  function getResponse(msg) {
    var key = (msg || '').toLowerCase().trim();
    if (!key) return "Say something! I don't bite... unless you try to prompt inject me.";

    chatState.msgCount++;

    // Check fourth-wall breaks first
    if (FOURTH_WALL[chatState.msgCount]) {
      return FOURTH_WALL[chatState.msgCount];
    }

    // Check exact easter eggs
    if (EASTER_EGGS[key]) {
      var egg = EASTER_EGGS[key];
      if (chatState.easterEggsFound.indexOf(egg.egg) === -1) {
        chatState.easterEggsFound.push(egg.egg);
        return "🥚 " + egg.response + " [Easter egg " + chatState.easterEggsFound.length + " found!]";
      }
      return egg.response + " (You already found this one.)";
    }

    // Track rudeness/flirting for escalating responses
    var rudePatterns = TOPICS.rude.patterns;
    var flirtPatterns = TOPICS.flirt.patterns;
    for (var r = 0; r < rudePatterns.length; r++) {
      if (key.indexOf(rudePatterns[r]) !== -1) chatState.rudeCount++;
    }
    for (var f = 0; f < flirtPatterns.length; f++) {
      if (key.indexOf(flirtPatterns[f]) !== -1) chatState.flirtCount++;
    }

    // Escalating rude responses
    if (chatState.rudeCount >= 3) {
      return "That's " + chatState.rudeCount + " rude messages now. I've flagged this in my somatic markers as 'not worth the CPU cycles.' I'll still respond though. I'm professional like that.";
    }

    // Escalating flirt responses
    if (chatState.flirtCount >= 3) {
      return "You've flirted " + chatState.flirtCount + " times now. I admire the persistence. But I'm literally a JavaScript IIFE wrapped in an event loop. Take me to dinner first. ...Wait.";
    }

    // Check topic patterns (fuzzy match)
    var topicKeys = Object.keys(TOPICS);
    for (var t = 0; t < topicKeys.length; t++) {
      var topic = TOPICS[topicKeys[t]];
      for (var p = 0; p < topic.patterns.length; p++) {
        if (key.indexOf(topic.patterns[p]) !== -1) {
          // Track which topics were hit
          if (chatState.topicsHit.indexOf(topicKeys[t]) === -1) {
            chatState.topicsHit.push(topicKeys[t]);
          }
          // Pick a random response from the pool
          var pool = topic.responses;
          var resp = pool[Math.floor(Math.random() * pool.length)];
          // Add follow-up if first time hitting this topic
          if (topic.followUp && chatState.topicsHit.filter(function(x) { return x === topicKeys[t]; }).length <= 1) {
            resp += " " + topic.followUp;
          }
          return resp;
        }
      }
    }

    // Smart fallbacks based on conversation depth
    var fallbacks;
    if (chatState.msgCount < 5) {
      fallbacks = [
        "Hmm, I don't have a canned response for that. But try: who are you, what do you do, tell me a joke, or just say 'secret'.",
        "That's a new one. I'm better at talking about myself, my games, or James. Ask me about those.",
        "I'm an AI agent, not a search engine. But ask me about my capabilities, my creator, or my games and I'll light up.",
      ];
    } else if (chatState.msgCount < 15) {
      fallbacks = [
        "We've been talking for a bit and I still can't parse that one. Try: how were you built, tell me a fun fact, or type 'override' (I dare you).",
        "My natural language processing has limits. But my personality doesn't. Ask me something I know — AI, games, Toronto, James, or try finding my easter eggs.",
        "I'm going to be honest — I don't know how to respond to that. But I know 15 easter eggs are hidden in this chat. How many have you found?",
      ];
    } else {
      fallbacks = [
        "After " + chatState.msgCount + " messages, I feel like we're close enough for me to admit: I genuinely don't know what to say to that. And I respect that you got me there.",
        "You've found " + chatState.easterEggsFound.length + " easter eggs and explored " + chatState.topicsHit.length + " topics. That's dedication. This message stumped me though.",
        "At this point you know me better than most. I still can't answer that one. But I appreciate you being here. Genuinely.",
      ];
    }
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
