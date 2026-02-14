# Integration Handoff: What Can Be Done in Code vs Manual

Use this when continuing in a directory that has access to **both** the simulator API (avr8js/dev-platform) and the external repo.

**Goal:** Test and use the “database of projects and progress per user” via the API: list projects per user, get/create/update project, diagram, and code; then connect the external app to this API and embed the simulator.

---

## Current Status (as of last session)

| Item | Status |
|------|--------|
| Simulator (dev-platform) | Deployed at `https://dev-platform-eight.vercel.app` |
| `/api/test`, `/api/health` | ✅ Working (200) |
| `/api/projects/[userId]`, `/api/projects/[userId]/[projectId]/*` | Code fixed (use `[userId].ts` / `[projectId].ts`); redeploy and set Blob token for 200 |
| Blob storage | Unknown – needs `BLOB_READ_WRITE_TOKEN` in Vercel |
| External repo | Curio-web: env, `app/lib/simulatorApi.ts`, `/projects/simulator` list + detail + embed |

**API base URL:** `https://dev-platform-eight.vercel.app/api`

---

## Changes You Can Make (in Code / This Repo)

These can be done by editing the **avr8js/dev-platform** repo (or the external repo if your workspace includes it).

### In simulator repo (avr8js / dev-platform)

| Change | Where | Notes |
|--------|--------|--------|
| Fix Vercel build so project API routes are built and deployed | `vercel.json`, `package.json`, or add an explicit build step for `api/` | Ensure `api/projects/[userId]/` and `api/projects/[userId]/[projectId]/` are compiled (e.g. run `tsc` in `api/` or adjust build command) so they appear under Vercel **Functions**. |
| Update `generic.html` to accept `userId` and `projectId` query params and load project from API | `demo/generic.html`, `demo/src/generic-demo.ts` (or equivalent) | On load, read `?userId=&projectId=`; if present, fetch diagram/code from API and init editor/diagram instead of localStorage. |
| Add or adjust scripts to test project API (e.g. list, create, get diagram/code) | New or existing script in repo (e.g. `upload-simple-test.js`, or a small `test-projects-api.js`) | Use `API_BASE = https://dev-platform-eight.vercel.app/api`; call GET list, POST create, GET diagram/code. |
| Add integration docs or checklist | e.g. `INTEGRATION_HANDOFF.md` (this file), or a short “Testing the API” section elsewhere | Document curl commands, script names, and expected responses. |
| CORS / response / handler fixes in API | Already done in `api/` (Node `req`/`res`, storage `head().url`) | No further code change needed unless you add new endpoints. |

### In external repo (when you have it in the same workspace)

| Change | Where | Notes |
|--------|--------|--------|
| Set API base URL (env or config) | e.g. `.env`, `config.ts`, or app config | `NEXT_PUBLIC_SIMULATOR_API_URL=https://dev-platform-eight.vercel.app/api` (or equivalent). |
| Implement API client for projects | e.g. `lib/api/projects.ts` or `services/simulatorApi.ts` | Functions: `listProjects(userId)`, `getProject(userId, projectId)`, `createProject(userId, body)`, `getDiagram`, `getCode`, `saveDiagram`, `saveCode`. |
| Project list and detail UI | Pages/components that list projects and open one | Call list API for current user; link to project detail; detail page can embed simulator (iframe) or load diagram/code via API. |
| Simulator embed | e.g. `<iframe src={embedUrl} />` | `embedUrl = `${SIMULATOR_ORIGIN}/api/simulator/embed?userId=${userId}&projectId=${projectId}`` (SIMULATOR_ORIGIN = `https://dev-platform-eight.vercel.app`). |
| E2E or manual test flow | Tests or a short checklist | Create project from external app → list projects → open project → open simulator embed → verify diagram/code load. |

---

## Changes That Require Manual Work

These need to be done in the Vercel dashboard, GitHub, or on your machine (not just by editing code in the repo).

### Vercel dashboard (dev-platform project)

**Project:** The Vercel project that deploys the simulator API — i.e. the one whose deployment URL is `https://dev-platform-eight.vercel.app`. In the Vercel dashboard this is likely named **dev-platform** or **dev-platform-eight** (check **Deployments** or the project URL to confirm).

| Task | Where | What to do |
|------|--------|------------|
| Set `BLOB_READ_WRITE_TOKEN` | That project → **Settings** → **Environment variables** | Add variable for Production (and Preview if you use it). Token from [Vercel Blob / Storage](https://vercel.com/dashboard/stores). Required for list/create/get diagram/code to work. |
| Confirm Node.js version | That project → **Settings** → **General** → Node.js Version | Should be **20.x** (we pinned it in `package.json`; if the project was created earlier, confirm it’s not still on 24.x). |
| Check that project API routes are deployed | That project → **Deployments** → latest → **Functions** (or build logs) | Look for entries like `api/projects/[userId]/route`, `api/projects/[userId]/[projectId]/route`, `diagram`, `code`. If missing, the build isn’t emitting them – then the “fix Vercel build” item in the table above is the code change to make. |
| Redeploy after env or build changes | That project → **Deployments** → … → **Redeploy** (or push a commit) | After adding `BLOB_READ_WRITE_TOKEN` or changing build, trigger a new deployment. |

### Running scripts / local tests

| Task | What to do |
|------|------------|
| Upload a test project (e.g. simple-test) | From avr8js repo: `node upload-simple-test.js` (after Blob token is set and project routes return 200). |
| Test project API with curl | Run the curl commands from `API_TEST_COMMANDS.md` or `API_ENDPOINTS_EXPLAINED.md` against `https://dev-platform-eight.vercel.app/api`. |
| Authenticate Git for push | If push fails (e.g. permission denied): `gh auth login` and choose the correct GitHub account, then push again. |

### External repo (if not in same workspace)

| Task | What to do |
|------|------------|
| Add env and API client | Set `NEXT_PUBLIC_SIMULATOR_API_URL` (or equivalent) and implement the project API client (see “In external repo” above). |
| Deploy external app | Deploy to Vercel/elsewhere and point it at the same simulator API URL. |

---

## Quick reference: Project API endpoints

- **List projects:** `GET /api/projects/{userId}`
- **Create project:** `POST /api/projects/{userId}` with JSON `{ projectId, name?, diagram?, code? }`
- **Get project:** `GET /api/projects/{userId}/{projectId}`
- **Get diagram:** `GET /api/projects/{userId}/{projectId}/diagram`
- **Save diagram:** `PUT /api/projects/{userId}/{projectId}/diagram` (JSON body)
- **Get code:** `GET /api/projects/{userId}/{projectId}/code`
- **Save code:** `PUT /api/projects/{userId}/{projectId}/code` (plain text body)
- **Simulator embed:** `GET /api/simulator/embed?userId={userId}&projectId={projectId}`

Base URL: `https://dev-platform-eight.vercel.app/api`

---

## Testing the API

- **Local (no deploy):** See [LOCAL_TESTING.md](LOCAL_TESTING.md) — run `vercel dev` in avr8js, then use the test script or curl against `http://localhost:3000/api`.
- **Script:** From the avr8js repo run `node scripts/test-projects-api.mjs` (see [api/TESTING.md](api/TESTING.md)).
- **curl:** See [api/TESTING.md](api/TESTING.md) for curl examples for list, create, get project/diagram/code, and the simulator embed URL.

---

## Suggested order when continuing

1. **Fix 404 on project routes** (code): Adjust build so `api/projects/[userId]/...` are compiled and deployed; verify in Vercel **Functions**.
2. **Set Blob token** (manual): Vercel → Settings → Environment variables → `BLOB_READ_WRITE_TOKEN` → Redeploy.
3. **Test “database” from this repo** (code + manual): Add/run script or curl: list projects, create one, get diagram/code; confirm 200 and expected JSON.
4. **Simulator loads from API** (code): Update `generic.html` / demo to support `?userId=&projectId=` and load from API.
5. **External repo** (code in that repo + manual deploy): API base URL, client, list/detail UI, embed iframe, then E2E test.

This file lives in the **avr8js** (dev-platform) repo; when you open a parent or sibling directory that has access to both APIs (simulator + external app), you can still use this checklist and point the external app at the same base URL and endpoints.
