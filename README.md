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
- **Installable on iPhone** — it's a Progressive Web App (PWA): add it to your Home Screen
  from Safari and it opens full-screen with its own icon, like a native app.

### Stack

- **Backend:** Node.js, Express, PostgreSQL (`pg`), Anthropic SDK
- **Frontend:** React (Vite), React Router

### Project layout

```
server/   Express API + Postgres database
client/   React (Vite) frontend
```

### Setup

**1. Database**

You need a Postgres database and its connection string. For local development, either run
Postgres locally or grab a free instance from a hosted provider (see the deploy section
below for free options — the same database works for local dev and production).

**2. Backend**

```bash
cd server
npm install
cp .env.example .env   # set DATABASE_URL, and ANTHROPIC_API_KEY to enable the AI advisor
npm run dev             # starts the API on http://localhost:4000
```

The server creates its tables automatically on startup if they don't exist. The AI advisor
endpoint returns a friendly error if `ANTHROPIC_API_KEY` isn't set — everything else (plant
tracking, planner) works without it.

**3. Frontend**

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

### Installing on your iPhone (PWA)

The app is a Progressive Web App, so it installs to your Home Screen straight from Safari —
no App Store, no Apple Developer account. This requires the app to be reachable over **HTTPS**
at a real URL (installing from `localhost` won't work on a physical iPhone), and it must be
served from a single origin so the API and the app share one URL.

**1. Build the client and run the server in "production" mode** — the server automatically
serves the built client (and falls back to `index.html` for client-side routes) whenever
`client/dist` exists. A root-level `package.json` wires this up as the standard
`npm install && npm run build && npm start` sequence most hosts run automatically:

```bash
npm install
npm run build   # builds client/, then installs server/ deps
npm start        # runs the server, serving the built client + API from one origin
```

**2. Get a Postgres database.** [Neon](https://neon.tech) and [Supabase](https://supabase.com)
both have free tiers with real persistent storage (unlike most free app-hosting tiers, which
wipe local files like a SQLite database on every redeploy). Either gives you a connection
string to use as `DATABASE_URL`.

**3. Deploy the app somewhere with HTTPS.** Any host that runs a long-lived Node process
works — e.g. Render, Fly.io, Railway, a VPS behind Caddy/Nginx.

- **Render:** this repo includes a `render.yaml` blueprint — connect the repo in the Render
  dashboard, it picks up the build/start commands automatically, and just prompts you for
  `DATABASE_URL` and `ANTHROPIC_API_KEY`.
- **Any other host:** set the build command to `npm install && npm run build`, the start
  command to `npm start`, and set `DATABASE_URL`, `ANTHROPIC_API_KEY`, and `PORT` (if
  required) as environment variables.

**4. On your iPhone**, open the deployed URL in **Safari** (must be Safari, not Chrome) →
tap the **Share** icon → **Add to Home Screen**. The app now launches full-screen with its
own icon, and reads/writes go straight to your deployed API and database.

The service worker caches the app shell for fast loads and offline resilience, but API
requests (plant data, AI advisor) always hit the network live — there's no offline data sync.
Since the database is now real Postgres rather than a local file, your plants and garden
beds persist across redeploys.
