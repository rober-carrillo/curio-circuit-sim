# Troubleshooting API Routes on Vercel

## Current Issue
API routes are returning `NOT_FOUND` even though they exist in the `api/` directory.

## Possible Causes

1. **`outputDirectory` setting**: When `outputDirectory` is set, Vercel might be treating this as a pure static site deployment and not looking for API routes in the root `api/` directory.

2. **API routes not being deployed**: The API routes might not be included in the deployment.

3. **Route structure**: The dynamic route structure `[userId]` and `[projectId]` might not be recognized.

## Solutions to Try

### Option 1: Test Locally First
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Test locally
vercel dev
```

Then test:
```bash
curl http://localhost:3000/api/test
```

### Option 2: Check Vercel Deployment Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the "Functions" tab to see if API routes are being detected
4. Check the "Logs" tab for any errors

### Option 3: Verify API Routes Are Included
Check if the `api/` directory is being excluded by `.vercelignore` or if it's in the wrong location.

### Option 4: Try a Different Route Structure
Instead of `api/projects/[userId]/route.ts`, try:
- `api/projects/[userId].ts` (single file)
- Or use query parameters: `api/projects.ts?userId=...`

### Option 5: Remove outputDirectory Temporarily
Test if removing `outputDirectory` from `vercel.json` allows API routes to be detected. If it works, we can configure routing differently.

## Next Steps

1. Check Vercel dashboard logs to see what's actually happening
2. Test locally with `vercel dev`
3. Verify the API directory structure matches Vercel's expectations
4. Consider if we need to copy API routes to the output directory during build
