# Railway Test App

A minimal full-stack app to validate a React + Node + PostgreSQL deploy on Railway.
It's a single Todo list: React frontend (Vite), Express backend, PostgreSQL for storage.
The backend serves the built frontend, so it deploys as **one Railway service**.

## Structure

```
railway-test-app/
├── backend/          # Express API + serves built frontend
│   ├── server.js
│   ├── db.js         # pg Pool + auto-migration (creates `todos` table)
│   └── package.json
├── frontend/          # React (Vite) app
│   ├── src/
│   └── package.json
├── package.json       # root build/start scripts Railway will run
└── railway.json        # explicit Railway build/start config
```

## Local development

Run backend and frontend in two terminals (needs a local Postgres, or use a
free Railway/Neon instance and point `DATABASE_URL` at it):

```bash
# 1. Backend
cd backend
npm install
cp ../.env.example .env   # edit DATABASE_URL if needed
node server.js             # http://localhost:3001

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :3001)
```

Or test the production build locally:

```bash
npm run build   # from repo root — builds frontend, copies into backend/public
npm start        # serves everything on http://localhost:3001
```

## Deploying to Railway

**Option A — Railway CLI**

```bash
npm install -g @railway/cli
railway login
cd railway-test-app
railway init
railway up
```

**Option B — GitHub**

1. Push this folder to a GitHub repo.
2. In the Railway dashboard: New Project → Deploy from GitHub repo → select it.

Then, either way:

1. In your Railway project, click **New → Database → Add PostgreSQL**.
2. Open your app service → **Variables** tab → add a variable:
   - `DATABASE_URL` → reference `${{Postgres.DATABASE_URL}}` (Railway autocompletes this once the Postgres plugin exists in the same project).
3. Railway will detect Node via Nixpacks and use `railway.json`, which runs:
   - Build: `npm run build` (installs frontend deps, builds it, copies `dist` into `backend/public`, installs backend deps)
   - Start: `npm start` (runs `backend/server.js`)
4. Once deployed, open the generated `*.up.railway.app` URL. The app auto-creates its `todos` table on first boot — no manual migration step needed.

## Verifying it worked

- `GET /api/health` → `{ "status": "ok", "db": "connected" }` confirms the app can reach Postgres.
- The UI itself shows a "DB status" badge at the top for the same check.
- Add/check/delete a few todos to confirm writes are persisted (refresh the page — they should still be there).

## Notes

- SSL for Postgres is auto-enabled in `db.js` whenever `DATABASE_URL` isn't `localhost`, which matches Railway's proxy connection requirements.
- No ORM is used on purpose, to keep this a lean, easy-to-read test harness. Swap in Prisma/TypeORM later if you want to build this into something real.
