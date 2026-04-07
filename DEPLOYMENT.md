# Deployment (Vercel + Render)

## Vercel (frontend)

### Fix for `404 NOT_FOUND` at the root URL

That error usually means Vercel did **not** run a valid Next.js build for this app, often because:

1. **Wrong Root Directory** — the Next.js app lives in `frontend/`, not the repo root.
2. **Invalid `vercel.json`** — custom `outputDirectory` / `npm --prefix` broke the build output.

### Recommended settings

1. In Vercel → Project → **Settings → General → Root Directory**  
   Set to: **`frontend`**  
   Then save and **Redeploy**.

2. **Environment variables** (Settings → Environment Variables), for **Production** (and Preview if needed):

   | Name | Example value |
   |------|----------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://your-backend.onrender.com` |

3. Trigger a **new deployment** after changing env vars.

### If you deploy from the repository root (no Root Directory)

A root `vercel.json` runs `npm install` / `npm run build` under `./frontend`. Prefer still setting **Root Directory** to `frontend` and using the minimal `frontend/vercel.json` (framework: Next.js only).

---

## Render (backend)

- Set `NODE_ENV=production`, `PORT` (Render provides), `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CLIENT_URL` (your Vercel URL, e.g. `https://smart-queue-ivory.vercel.app`).
