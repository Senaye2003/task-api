# Deploy Guide — Render (backend + Postgres) + Vercel (frontend)

This guide assumes the repo is at `https://github.com/Senaye2003/task-api` and is up to date on `main`.

There are three pieces to stand up, in this order:

1. Postgres database + backend web service on Render
2. Frontend static site on Vercel
3. Wire up CORS so the two can talk

Everything below is one-time setup. After it's done, pushing to `main` redeploys both sides automatically.

---

## 1. Backend + database on Render

The repo includes `render.yaml` at the root that describes both the web service and a free Postgres instance. Render calls this a "Blueprint" — you point it at the repo and it provisions everything.

1. Go to <https://dashboard.render.com/blueprints> and click **New Blueprint Instance**.
2. Connect your GitHub account if you haven't, then pick the `task-api` repo and the `main` branch.
3. Render reads `render.yaml`, shows you what it will create (one web service named `task-api` and one Postgres database named `task-api-db`), and asks you to confirm. Click **Apply**.
4. Render will provision the database first (this takes 1–2 minutes), then build the web service.

### What the blueprint does

The web service runs:

```
npm install && npm run build   # build = prisma generate && prisma migrate deploy
npm start                       # node src/server.js
```

`DATABASE_URL` is wired automatically from the managed Postgres instance. The first deploy runs your migrations against the new database.

### Set CORS_ORIGIN after the frontend deploys

The blueprint declares `CORS_ORIGIN` as a `sync: false` env var, which means Render leaves it blank until you set it. You'll come back and set it in step 3, after you know the Vercel URL.

### Backend health check

After the service is live, open `https://<your-service>.onrender.com/health` — you should see `{"status":"ok"}`. Also try `/api-docs` for the Swagger UI.

### Free-tier caveat

Render's free web service spins down after ~15 minutes of inactivity and takes ~30 seconds to wake up on the next request. Fine for a demo; upgrade to Starter ($7/mo) if you want it always-on.

---

## 2. Frontend on Vercel

1. Go to <https://vercel.com/new> and import the same `task-api` repo.
2. **Important**: when Vercel asks for the project root, set **Root Directory** to `task-api-frontend`. Vercel will auto-detect Vite.
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com` (copy from the Render dashboard, no trailing slash)
4. Click **Deploy**. Vercel runs `npm run build` (which bakes `VITE_API_URL` into the built JS) and serves `dist/`.

If you later change the API URL, you must **redeploy** the frontend — Vite env vars are baked in at build time, not read at runtime.

---

## 3. Wire up CORS

The backend's CORS middleware allows only the origin in `CORS_ORIGIN`. Once Vercel gives you a domain (something like `https://task-api-frontend-xyz.vercel.app`):

1. Go to your Render service → **Environment** → edit `CORS_ORIGIN` to that Vercel URL (no trailing slash).
2. Render will redeploy. After ~30 seconds the frontend can call the API without browser CORS errors.

If you add a custom domain on Vercel later, update `CORS_ORIGIN` to match (or change the backend to accept a list of origins).

---

## Smoke test after deploy

From the deployed frontend, do this end-to-end check:

1. The page loads without "Failed to load tasks" — confirms `VITE_API_URL` is correct and the backend is awake.
2. Open browser devtools → Network. Filter to `Fetch/XHR`. You should see calls to `https://<render-url>/tasks` returning `200`.
3. Create a task. The new row should appear without a refresh.
4. Toggle, edit, and delete the new task — each should succeed.
5. Reload the page. The state should match what's on the server.

If you see CORS errors, double-check `CORS_ORIGIN` matches the exact Vercel URL (scheme + host, no path, no trailing slash).

If `/tasks` returns 500 on first read, check Render logs — likeliest cause is `prisma migrate deploy` didn't run, so the `tasks` table doesn't exist. Re-deploy via Render → Manual Deploy → "Clear build cache & deploy".

---

## Optional: seed the deployed database

The repo has `prisma/seed.js` which truncates and re-fills the table. **Do not run this in production casually** — it wipes existing rows. If you do want to seed:

```bash
# from your laptop, against the production DB (one-time):
DATABASE_URL="<paste from Render>" npm run seed
```

---

## Operating notes

- **Rotating the DB password**: managed by Render; if you need to rotate, go to the database → "Connections" → "Rotate password". Render updates the linked service automatically.
- **Logs**: Render's "Logs" tab shows the running stdout. Vercel's logs are under Deployments → the deployment → "Functions" / "Build" / "Runtime".
- **Cost**: free tier covers this app indefinitely. Postgres free tier is wiped after 30 days of inactivity (Render emails a warning); upgrade to Starter ($7/mo) if you want persistence.
