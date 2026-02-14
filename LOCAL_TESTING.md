# Local testing (no Vercel deploy required)

You can verify the API and demo changes locally using the Vercel CLI. No deploy needed.

## 1. Run the simulator API locally

From the **avr8js** repo root:

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Optional: for create/get diagram/code to work, add a Blob token to .env
# echo "BLOB_READ_WRITE_TOKEN=your_token_here" > .env

# Run the app (serves demo + API)
vercel dev
```

- Demo: **http://localhost:3000/** (or http://localhost:3000/generic.html)
- API: **http://localhost:3000/api/...**

Leave this terminal running.

## 2. Test the project API

In another terminal, from **avr8js**:

```bash
# Test against local API
API_BASE=http://localhost:3000/api node scripts/test-projects-api.mjs
```

Or with curl:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/projects/test-user
```

If you did **not** set `BLOB_READ_WRITE_TOKEN`, list may return 200 with `projects: []`, but create/diagram/code may return 500. That’s expected; the route wiring is still validated.

## 3. Test the demo (load/save from API)

With `vercel dev` still running:

1. Create a project (so there is diagram/code to load):
   ```bash
   curl -X POST http://localhost:3000/api/projects/test-user \
     -H "Content-Type: application/json" \
     -d '{"projectId":"local-test","name":"Local test","diagram":{"version":1,"parts":[]},"code":"void setup() {} void loop() {}"}'
   ```
2. Open in the browser:
   **http://localhost:3000/generic.html?userId=test-user&projectId=local-test**
3. You should see the diagram/code loaded from the API. Use “Save project” to test PUT (requires `BLOB_READ_WRITE_TOKEN` for success).

## 4. Test Curio-web against the local API

In **CurioWebCollab/curio-web**, point the app at the local API:

**.env.local** (create from `.env.example` if needed):

```
NEXT_PUBLIC_SIMULATOR_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SIMULATOR_ORIGIN=http://localhost:3000
```

Then, with **avr8js** still running under `vercel dev`:

```bash
cd CurioWebCollab/curio-web
npm run dev
```

Open the app, go to Projects → “Simulator projects (Arduino cloud)”. Create a project and open it; the embed iframe will load **http://localhost:3000/api/simulator/embed?userId=...&projectId=...**, which redirects to generic.html with the same params, so the demo loads from the local API.

## Summary

| What you want to check | Command / URL |
|------------------------|----------------|
| API route wiring (no Blob) | `vercel dev` → `API_BASE=http://localhost:3000/api node scripts/test-projects-api.mjs` |
| Full API (list/create/diagram/code) | Add `BLOB_READ_WRITE_TOKEN` to `.env`, then same as above |
| Demo load from API | `vercel dev` → open `http://localhost:3000/generic.html?userId=test-user&projectId=local-test` |
| Curio-web + local API | `.env.local` with `http://localhost:3000/api` and `http://localhost:3000`, run curio-web dev |

You only need to update Vercel when you want to test in production or share the deployed URL.
