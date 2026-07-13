# Stockout Tracker — Deployment Guide

## Deploy to Vercel (required for the AI feature)

The "Ask AI" feature uses a Vercel serverless function (`api/ask.js`) that calls
the Anthropic API with the `claude-fable-5` model. The API key lives server-side
as an environment variable — never in the browser.

```bash
npm i -g vercel
vercel --prod
```

Then set your API key (get one at console.anthropic.com):
```bash
vercel env add ANTHROPIC_API_KEY production
# paste your key when prompted, then redeploy:
vercel --prod
```

Or via the Vercel dashboard: Project → Settings → Environment Variables →
`ANTHROPIC_API_KEY` → paste key → redeploy.

Point your DNS (GoDaddy) the same way as abdulahmad.com if you want a custom domain.

## Local development with the AI feature
```bash
vercel dev          # runs Vite + the /api functions locally
# create .env with: ANTHROPIC_API_KEY=sk-ant-...
```
Plain `npm run dev` works too, but /api/ask will 404 — everything else works.

## Weekly data update workflow
1. Export your stockout report from the Smartsheet/AX view as CSV
2. Map columns to: `Gating Item, Name, Product Line, Lead Time, Approximate Shipping Date, Escalation Owner, Top Level`
   - Top Level: comma-separated within a quoted cell e.g. `"043-816,CTC-0002,DM-007"`
3. Go to **Upload** tab in the app → drop the CSV → preview → Load
4. Data persists in localStorage per browser session

## AI usage notes
- Model: `claude-fable-5` — every question sends the current dataset as context
- Cost scales with dataset size; a ~15-item weekly report is a few cents per query
- The system prompt restricts answers to the loaded data only

## Stack
- React 18 + TypeScript (Vite)
- Vercel serverless function → Anthropic API (claude-fable-5)
- PapaParse for CSV parsing, lucide-react for icons
- Data client-side in localStorage
