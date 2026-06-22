# ScoreSprint

Live multi-sport scoreboard app with sport tab selection, plus an official FIFA World Cup 2026 live feed.

## Features

- FIFA World Cup live scores from FIFA's public API
- Additional sports tabs still use public scoreboards where available
- Tabs for Soccer, Basketball, Baseball, Football, Hockey, Tennis, and MMA
- Auto-refresh every 30 seconds
- FIFA World Cup 2026 section powered by local dataset

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open the shown local URL (default: `http://localhost:5173`).

## World Cup Data Refresh

Run:

```bash
python3 update_scores.py
```

This updates:

- `world_cup_2026_scores.csv`
- `world_cup_2026_scores.json`
- `public/world_cup_2026_scores.csv`
- `public/world_cup_2026_scores.json`

The app's FIFA World Cup tab pulls live match data directly from FIFA's public competition API.

## Deploy + Domain

The project is ready for Vercel deployment.

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Deploy (build command: `npm run build`, output: `dist`).
4. Vercel will assign a free `.vercel.app` domain after the deployment finishes.
5. Use the exact Vercel-assigned URL from your project dashboard as your public URL.

### Free domain option

If you want a free domain, use the Vercel subdomain assigned to the project.

Recommended setup:

1. Deploy the project on Vercel.
2. Keep the generated `.vercel.app` domain Vercel gives you.
3. Share that free URL as the live site.

If you later want a branded custom domain like `livewcscores.com`, you can add it in Vercel separately.
