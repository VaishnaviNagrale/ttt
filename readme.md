# 🎮 TicTacToe — Real-time Multiplayer

A production-ready multiplayer Tic-Tac-Toe game built with **React + Vite + Tailwind CSS** on the frontend and **Nakama** as the server-authoritative backend.

---

## ✨ Features

- **Real-time multiplayer** — WebSocket-based, sub-100ms move delivery
- **Server-authoritative** — all game logic runs in Lua on Nakama; clients cannot cheat
- **Automatic matchmaking** — players are paired by game mode (classic vs timed)
- **Timed mode** — 30-second turn timer with auto-forfeit on timeout
- **Leaderboard** — global W/L/D rankings persisted in PostgreSQL via Nakama
- **Disconnect handling** — opponent leaving immediately forfeits the match
- **Concurrent matches** — Nakama isolates every match in its own server-side state machine
- **Responsive UI** — works on mobile and desktop

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│   Frontend (Netlify)            │        │   Backend (Railway / any VPS)    │
│                                 │        │                                  │
│   React + Vite + Tailwind       │        │   Nakama 3.21                    │
│   Zustand (state)               │◄──────►│   └── tictactoe.lua              │
│   @heroiclabs/nakama-js         │  wss:// │       (server-authoritative)     │
│                                 │        │                                  │
└─────────────────────────────────┘        │   PostgreSQL 14                  │
                                           │   (sessions, leaderboard)        │
                                           └──────────────────────────────────┘
```

### How a match works

```
Player A                   Nakama Server                  Player B
   │                            │                             │
   │── addMatchmaker() ────────►│◄─────────── addMatchmaker() ─│
   │                            │  (pairs by mode)             │
   │◄── onmatchmakermatched ────┤──── onmatchmakermatched ────►│
   │── joinMatch() ────────────►│◄──────────── joinMatch() ────│
   │                            │                             │
   │◄──────────── game_start ───┤──────────── game_start ─────►│
   │                            │                             │
   │── move (op:1) ────────────►│  validate + apply           │
   │                            ├──────── board_update ───────►│
   │◄──────── board_update ─────│                             │
   │                            │  (repeat until win/draw)    │
   │◄──────── game_over ────────┤──────────── game_over ──────►│
   │                            │  write leaderboard          │
```

---

## 🚀 Local Development

### Prerequisites

- Node.js 18+
- Docker + Docker Compose
- Git

### 1. Clone and set up

```bash
git clone https://github.com/VaishnaviNagrale/ttt.git
cd ttt
```

### 2. Start the Nakama backend

```bash
cd backend
docker compose up -d
```

| Service | URL |
|---|---|
| Nakama API | http://localhost:7350 |
| Nakama Console | http://localhost:7351 (admin / admin) |
| PostgreSQL | localhost:5432 |

Verify the Lua module loaded: Console → **Runtime** → **Modules** → should show `tictactoe`.

### 3. Start the frontend

```bash
cd ../frontend
cp .env.example 
npm install
npm run dev
```

Open **two browser tabs** at `http://localhost:5173`, enter different nicknames in each — they will auto-match against each other.

---
### Backend → render

**Step 1** — Push `backend/` to a GitHub repo.

**Step 2** — Create a new Render project:
```
render.com → New Project → Deploy from GitHub → select your repo
```
Render detects `docker-compose.yml` and deploys both Nakama and PostgreSQL automatically.

**Step 3** — Expose the port:
```
Render → Nakama service → Settings → Networking → Add port 7350
```
Render gives you a public URL like `nakama-abc123.up.render.com`.

**Step 4** — Note your connection details:
```
Host:  nakama-abc123.up.render.com
Port:  443   ← Render terminates SSL, so use 443 not 7350
SSL:   true
Key:   defaultkey  ← change this in production!
```

> **Security:** Before going live, change `--socket.server_key defaultkey` in `docker-compose.yml` to a strong random string.

---

### Frontend → Netlify

**Step 1** — Push `frontend/` to a GitHub repo.

**Step 2** — Create a new Netlify site:
```
netlify.com → Add new site → Import from Git → select your repo
```

Build settings:
| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |

**Step 3** — Add environment variables in Netlify:
```
Site settings → Environment variables → Add variable
```

| Variable | Value |
|---|---|
| `VITE_NAKAMA_HOST` | `nakama-abc123.up.railway.app` |
| `VITE_NAKAMA_PORT` | `443` |
| `VITE_NAKAMA_USE_SSL` | `true` |
| `VITE_NAKAMA_KEY` | `your_secret_key` |

**Step 4** — Deploy. Netlify auto-deploys on every push to `main`.

> The `public/_redirects` file is already included — this prevents 404s on page refresh (Netlify SPA fix).

---

## 🎮 Game Flow

```
NICKNAME → WAITING → GAME → RESULT
```

| Phase | Description |
|---|---|
| **NICKNAME** | Player enters a username and selects Classic or Timed mode |
| **WAITING** | Player is added to the Nakama matchmaker queue; waits for opponent |
| **GAME** | Real-time board — moves sent to server via WebSocket, validated, broadcast back |
| **RESULT** | Win / draw / loss screen with score delta and global leaderboard |

---

## 🖥️ Server Message Reference

The frontend and Lua backend communicate via these JSON message types over the Nakama match data channel:

| Type | Direction | Description |
|---|---|---|
| `game_start` | Server → Client | Both players joined; contains board, marks, whose turn, mode |
| `board_update` | Server → Client | A move was validated; contains new board state and next turn |
| `timer` | Server → Client | Countdown tick (timed mode only); contains `remaining` seconds |
| `game_over` | Server → Client | Match ended; contains winner, win_combo, reason |
| `waiting` | Server → Client | First player joined, waiting for second |
| `error` | Server → Client | Move rejected (not your turn / cell taken / invalid position) |
| `move` (op: 1) | Client → Server | Player submits a move; `position` is 1-indexed |

---

## 🏆 Scoring

| Outcome | Points |
|---|---|
| Win | +200 |
| Draw | +25 |
| Loss | −50 |

Scores are written to Nakama's built-in leaderboard storage (`global_leaderboard`) after every match and fetched via the `get_leaderboard` RPC.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State management | Zustand 5 |
| Nakama client | @heroiclabs/nakama-js 2.9 |
| Backend runtime | Nakama 3.21 |
| Game logic | Lua 5.1 (Nakama runtime) |
| Database | PostgreSQL 14 |
| Frontend hosting | Netlify |
| Backend hosting | Railway (or any Docker-capable VPS) |

---