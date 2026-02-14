# Vercel deployment – if you see 404

## 1. Set Output Directory in the dashboard

In **Vercel** → your project (**curio-circuit-sim**) → **Settings** → **General**:

- **Output Directory:** set to **`public`** (overrides or confirms `vercel.json`).
- **Root Directory:** leave empty (or **`.`**) so the repo root is used.
- **Build Command:** `npm run build:demo && mkdir -p public && cp -r demo/dist/* public/` (or leave empty to use `vercel.json`).
- **Node.js Version:** **20.x**.

Save and **Redeploy** (Deployments → … → Redeploy).

## 2. Confirm the build produces `public/`

The build should create:

- `public/generic.html` – main simulator
- `public/projects/simon-with-score/` – diagram and code
- `public/projects/simple-test/` – another demo project

To check locally:

```bash
npm run build:demo && mkdir -p public && cp -r demo/dist/* public/
ls -la public/
ls -la public/projects/
```

## 3. URLs after a successful deploy

- **Simulator (default):** `https://your-project.vercel.app/` or `https://your-project.vercel.app/generic.html`
- **Simon project assets:** `https://your-project.vercel.app/projects/simon-with-score/`
- **Simple-test project:** `https://your-project.vercel.app/projects/simple-test/`
- **API:** `https://your-project.vercel.app/api/health`

## 4. If 404 persists

- In **Deployments** → latest deployment → **Building**: open the build logs and confirm there are no errors and that `public/` is present after the build.
- If the build fails (e.g. missing dependency or wrong Node), fix that first.
- Ensure the deployment is from the branch that has `outputDirectory: "public"` in `vercel.json`.
