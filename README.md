# AI-Agent-Portfolio
AI Agent Portfolio for Matt MacLeod

## Garden Companion

A full-stack gardening app for tracking plant care, planning garden beds, and getting
AI-powered gardening advice.

- **Plant tracker** — log plants with watering/fertilizing schedules, mark care actions
  as done, and see a full history per plant.
- **Garden planner** — create garden beds with a grid layout and place plants into them.
- **AI advisor** — ask gardening questions, optionally with a photo attached, powered by
  the Claude API.

### Stack

- **Backend:** Node.js, Express, SQLite (`better-sqlite3`), Anthropic SDK
- **Frontend:** React (Vite), React Router

### Project layout

```
server/   Express API + SQLite database
client/   React (Vite) frontend
```

### Setup

**1. Backend**

```bash
cd server
npm install
cp .env.example .env   # then set ANTHROPIC_API_KEY to enable the AI advisor
npm run dev             # starts the API on http://localhost:4000
```

The AI advisor endpoint returns a friendly error if `ANTHROPIC_API_KEY` isn't set —
everything else (plant tracking, planner) works without it.

**2. Frontend**

```bash
cd client
npm install
npm run dev              # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend, so run both at once.

### API overview

| Method | Route | Description |
| --- | --- | --- |
| GET/POST | `/api/plants` | List / create plants |
| GET/PATCH/DELETE | `/api/plants/:id` | Read, update, or remove a plant |
| POST | `/api/plants/:id/care` | Log a care action (`water`, `fertilize`, `prune`, `note`) |
| GET/POST | `/api/beds` | List / create garden beds |
| PATCH/DELETE | `/api/beds/:id` | Update or remove a bed |
| POST | `/api/beds/:id/place` | Place a plant at a grid position in a bed |
| POST | `/api/beds/:id/unplace` | Remove a plant from a bed |
| POST | `/api/advisor/ask` | Ask the AI advisor a question (optional image + plant context) |
