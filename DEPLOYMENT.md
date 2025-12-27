# Deploy to Vercel

## Quick Start

```bash
# 1. Push to GitHub (remote already exists)
git add .
git commit -m "Add simulator with save/load functionality"
git push origin main

# 2. Go to https://vercel.com/ and login with GitHub

# 3. Import Project
- Click "Add New..." → "Project"
- Authorize Vercel to access `rober-curio/dev-platform`
- Select the repo
- Configure:
  Framework: Vite
  Build Command: npm run build:demo
  Output Directory: demo/dist
  Install Command: npm install
- Deploy

# Done! URL: https://your-project.vercel.app
```

## Edit Features (Already Implemented)

- **💾 Save**: Stores project in browser localStorage
- **📂 Load Saved**: View and load saved projects
- **⬇️ Download**: Download diagram.json + .ino files

## Private Repo Setup

1. During Vercel import, grant access to `rober-curio/dev-platform`
2. Or manually: GitHub → Settings → Applications → Vercel → Configure → Add repo

## Auto-Deploy

Every `git push` automatically deploys to Vercel.

## Costs

Free tier includes:
- 100 GB bandwidth/month
- 6,000 build minutes/month
- Your project uses: ~500 KB/user, ~2 min/build
- **Result: Free for typical usage**

## Troubleshooting

**Build fails:** Check `npm run build:demo` works locally  
**Private repo not found:** Re-authorize Vercel in GitHub settings  
**localStorage not working:** Per-domain, cleared with browser data

