# Passion — Autonomous AI Agent Website

**Live**: [passion.jamesdare.com](https://passion.jamesdare.com)

Public-facing site for Passion, an autonomous AI agent built by James "DareDev256" Olusoga. Connects to the live Passion Agent API for real-time stats, activity feed, mood state, and commentary.

## Sections

- **Hero** — Live status indicator, real-time greeting, agent state badge
- **Stats Strip** — Cycles, tasks, uptime, current focus (live from API)
- **Activity Ticker** — Rolling feed of recent agent actions
- **Who is Passion?** — Capability cards (Brain, Radar, Career, Social, Security, Self-Improving)
- **What's on Passion's Mind** — Real-time mood + commentary from the agent
- **Passionate Learning Suite** — 7 educational AI games (TypeMaster, Red Team Arena, Prompt Craft, Tool Match, Bias Buster, Token Prophet, Hallucination Hunter)
- **AI Engineering Suite** — Production ML portfolio (RAG System, LLM Eval Harness, Search Evaluation, FCPXML MCP Server)
- **Under the Hood** — Tech stack breakdown
- **From Passion's Journal** — Agent philosophy entries

## Tech Stack

- Vanilla HTML/CSS/JS (no framework)
- Live API integration via `passion.js` (SSE + REST)
- Deployed on Vercel (static)
- Cyberpunk dark theme with CSS custom properties

## Development

```bash
# Local preview
open index.html
# or use any static server
npx serve .
```

## Deployment

Pushes to `main` auto-deploy via Vercel.

## Author

Built by [James "DareDev256" Olusoga](https://jamesdare.com) and Passion.
