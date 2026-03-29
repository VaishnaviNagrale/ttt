# TicTacToe — Setup & Deployment Guide

---

## ⚠️ Important: Nakama Cannot Go on Vercel

Vercel is serverless — it cannot run Nakama because Nakama needs:
- Persistent WebSocket connections
- A running PostgreSQL database
- A long-lived process (not a function)

**Use Railway instead** — it's the easiest free-tier option that handles
Docker Compose directly. Alternatives: Render, Fly.io, DigitalOcean App Platform.

---

## Architecture

```
Browser (Netlify)
      │
      │  wss://  (WebSocket, port 7350)
      │  https:// (HTTP API, port 7350)
      ▼
Nakama Server (Railway / any VPS)
      │
      ▼
PostgreSQL (Railway managed DB or same compose)
```

---

## Part 1 — Deploy Nakama Backend to Railway

### Step 1: Push backend to GitHub

Create a repo with this structure:
```
nakama-backend/
├── docker-compose.yml
└── modules/
    └── tictactoe.lua
```

### Step 2: Deploy on Railway

1. Go to https://railway.app → New Project → Deploy from GitHub repo
2. Select your `nakama-backend` repo
3. Railway will detect `docker-compose.yml` and deploy both services

### Step 3: Set environment variables on Railway

In Railway dashboard → your Nakama service → Variables:
```
NAKAMA_SERVER_KEY=your_secret_key_here   # change from 'defaultkey'!
```

Update your docker-compose.yml `--socket.server_key` to match.

### Step 4: Expose the port

In Railway → Nakama service → Settings → Networking:
- Add public port: **7350**
- Railway gives you a URL like: `nakama-abc123.up.railway.app`

### Step 5: Note your Nakama URL

```
Host:    nakama-abc123.up.railway.app
Port:    443   (Railway terminates SSL for you → use 443, not 7350)
SSL:     true
Key:     your_secret_key_here
```

---

## Part 2 — Deploy Frontend to Netlify

### Step 1: Push frontend to GitHub

Create a separate repo with the `ttt-prod/` folder contents.

### Step 2: Connect to Netlify

1. Go to https://netlify.com → Add new site → Import from Git
2. Select your frontend repo
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

### Step 3: Set environment variables in Netlify

Netlify dashboard → Site settings → Environment variables → Add:

```
VITE_NAKAMA_HOST      =  nakama-abc123.up.railway.app
VITE_NAKAMA_PORT      =  443
VITE_NAKAMA_USE_SSL   =  true
VITE_NAKAMA_KEY       =  your_secret_key_here
```

### Step 4: Deploy

Netlify auto-deploys on every push to main. Or click "Deploy site" manually.

Your frontend will be live at: `https://your-site-name.netlify.app`

---

## Part 3 — Local Development

### Run Nakama locally

```bash
cd nakama-backend
docker compose up -d

# Nakama console → http://localhost:7351  (admin/admin)
# API            → http://localhost:7350
```

### Run frontend locally

```bash
# In the ttt-prod/ folder:
cp .env.example .env.local

# Edit .env.local:
VITE_NAKAMA_HOST=localhost
VITE_NAKAMA_PORT=7350
VITE_NAKAMA_USE_SSL=false
VITE_NAKAMA_KEY=defaultkey

npm install
npm run dev
# → http://localhost:5173
```

Open two browser tabs, enter different nicknames — they'll match against each other.

---

## Part 4 — Verify Everything Works

### Check Nakama is reachable

```bash
curl http://localhost:7350/healthcheck
# should return: {}

# Or for production:
curl https://nakama-abc123.up.railway.app/healthcheck
```

### Check the Lua module loaded

Nakama Console → http://localhost:7351 → Runtime → Modules → should show `tictactoe`

### Test matchmaking

1. Open your Netlify URL in two different browser tabs (or two different browsers)
2. Enter different nicknames in each
3. Both click Continue — they should match within seconds
4. Play a game — moves should be server-validated in real time

---

## File Structure

```
ttt-prod/                          ← deploy this to Netlify
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example                   ← copy to .env.local for local dev
├── public/
│   └── _redirects                 ← Netlify SPA routing fix
└── src/
    ├── main.jsx
    ├── App.jsx                    ← phase router
    ├── index.css
    ├── lib/
    │   ├── nakama.js              ← Nakama client singleton
    │   └── utils.js
    ├── store/
    │   └── gameStore.js           ← Zustand store
    ├── hooks/
    │   ├── useGame.js             ← all Nakama socket logic
    │   └── useConfetti.js
    ├── components/
    │   ├── ui/                    ← Button, Card, Logo, Toggle
    │   └── game/                  ← Board, Cell, Scoreboard, TimerBar, Leaderboard, StatusRow
    └── pages/
        ├── NicknameScreen.jsx
        ├── WaitingScreen.jsx
        ├── GameScreen.jsx
        └── ResultScreen.jsx
```

---

## Common Issues

| Problem | Fix |
|---|---|
| `Cannot reach Nakama server` | Check `VITE_NAKAMA_HOST` has no `https://` prefix — just the hostname |
| `WebSocket connection failed` | Make sure port 7350 is publicly exposed on your server |
| SSL error in prod | Set `VITE_NAKAMA_USE_SSL=true` and `VITE_NAKAMA_PORT=443` |
| Module not found in Nakama | Check `tictactoe.lua` is in `./modules/` folder and Nakama restarted |
| Matchmaking never finds opponent | Need 2 players with same mode (both classic or both timed) |
| `Not your turn` error | Normal — server rejects duplicate moves; UI already blocks this |

---

## Security Checklist Before Going Live

- [ ] Change `--socket.server_key defaultkey` to a strong random string
- [ ] Change PostgreSQL password from `localdb` to something strong
- [ ] Set `--logger.level INFO` instead of `DEBUG` in production
- [ ] Add a domain + SSL cert (Railway/Fly handle this automatically)
- [ ] Set `session.token_expiry_sec` to a reasonable value (7200 = 2hrs)
