# ModelPulse — AI Model Intelligence

**Find the right AI model for your workload — not just the cheapest one.**

ModelPulse turns scraped AI model pricing data into actionable model-selection intelligence. Instead of manually comparing 150+ AI models across 27 providers on scattered pricing pages, ModelPulse helps developers answer: *"Which AI model should I use for my workload and budget?"*

Built for the **Into the Scrape-Verse** hackathon by WeMakeDevs × Bright Data.

🔗 **Live demo:** https://mahboobali.dpdns.org/

---

## What it does

- **Dashboard** — key stats (models tracked, average price, highest quality, cheapest model) and a "Best Value Models" leaderboard, plus a live **Refresh Data** button
- **Explorer** — search, filter (provider, price, quality, context), and sort through 150+ AI models
- **Compare** — put up to 4 models side-by-side, with the best price/quality/speed/value automatically highlighted
- **Calculator** — estimate your monthly cost for a given workload (input/output tokens, request volume) across models
- **Analytics** — price distribution, provider comparison, and quality-vs-price charts

## How Bright Data is used

The model dataset (pricing, context window, quality score, speed, value) is extracted from a live pricing page using **Bright Data Scraper Studio** — a custom, AI-assisted scraper, not one of Bright Data's pre-built packages. The target site (a niche AI pricing aggregator) has no pre-built collector, so this scraper was purpose-built for this project.

The same collector is also driven from the **Bright Data CLI (`bdata`)**:
```bash
bdata scraper run <collector_id> <url>      # trigger a run from the terminal
bdata scraper heal <collector_id> "<what to check/fix>"   # self-heal the extraction
```

### Data pipeline

TokenCost.app (pricing page)
↓
Bright Data Scraper Studio ← custom, AI-built, self-healing scraper
↓
Structured model data (pricing, context, quality, speed, value)
↓
ModelPulse ← this app
↓
Model recommendation for your workload


### Live refresh

The dashboard's **Refresh Data** button triggers the same Bright Data collector via its API, polls for completion, and upserts the results into a Supabase table. The app reads from that table first and falls back to a local snapshot if it's ever empty — so the site is never broken, even mid-refresh.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- Recharts (charts)
- Supabase (live data storage + refresh function)
- Bright Data Scraper Studio + CLI (data extraction)

## AI tools used

This project was built with the help of AI coding assistants, as allowed by the hackathon rules:
- **Claude (Anthropic)** — used to plan the project, write scraping instructions for Bright Data, and guide the overall build process
- **Bright Data Scraper Studio's AI builder** — used to generate the custom scraper
- **Lovable** — used to generate the React/TypeScript frontend from a detailed spec, based on the scraped dataset

## Running locally

```bash
git clone https://github.com/Mahboob-Ali-321/model-pulse-brighten
cd model-pulse-brighten
npm i
npm run dev
```

## Built for

**Into the Scrape-Verse** hackathon by WeMakeDevs × Bright Data
