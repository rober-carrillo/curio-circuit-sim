# Debug Checklist - API Routes Not Working

## Current Situation
- ✅ Functions ARE detected in Vercel dashboard
- ❌ `/api/test` returns `FUNCTION_INVOCATION_FAILED`
- ❌ `/api/projects/test-user` returns `NOT_FOUND`
- ✅ Code looks correct, imports are correct
- ✅ Latest fix was pushed

## Things to Check in Vercel Dashboard

### 1. Check Function Logs
**This is the most important step!**

1. Go to: https://vercel.com/curiolabs-projects/dev-platform
2. Click on the latest deployment
3. Click on the "Functions" tab
4. Click on `/api/test` function
5. Click "View Logs" or "Logs" tab
6. Look for error messages

**What to look for:**
- Import errors (can't find module)
- Runtime errors (syntax error)
- Environment variable issues
- Any stack traces

### 2. Check Build Logs
1. Go to the deployment
2. Click "Building" or "Build Logs"
3. Look for:
   - Are API routes being compiled?
   - Any TypeScript errors?
   - Are the files being included?

### 3. Check Function Configuration
In the Functions tab, for each function check:
- Runtime: Should be "Node.js"
- Memory: Should have a value
- Max Duration: Should have a value

## Possible Issues

### Issue 1: Import Path Problem
The import in `api/test.ts` uses:
```typescript
import { successResponse } from './_utils/response';
```

This should work, but Vercel might resolve imports differently. Check the logs for:
```
Cannot find module './_utils/response'
```

### Issue 2: outputDirectory Causing Route Conflicts
When `outputDirectory` is set to `demo/dist`, Vercel might:
- Look for API routes in `demo/dist/api/` instead of root `api/`
- Have routing conflicts between static files and API routes
- Not properly map URLs to functions

### Issue 3: Dynamic Routes Not Recognized
The `[userId]` and `[projectId]` folders might not be recognized as dynamic routes when `outputDirectory` is set.

### Issue 4: CORS or Runtime Configuration
The function might be executing but failing due to:
- CORS issues (but we have CORS configured)
- Runtime incompatibility
- Missing environment variables (BLOB_READ_WRITE_TOKEN)

## Solutions to Try

### Solution 1: Remove outputDirectory Temporarily
Test if removing `outputDirectory` fixes the issue:

```json
{
  "buildCommand": "npm run build:demo",
  "framework": null,
  "installCommand": "npm install",
  "devCommand": "npm run start"
}
```

If this works, it confirms `outputDirectory` is causing the issue.

### Solution 2: Move API Routes to Output Directory
Instead of having API routes in root, copy them during build:
```json
{
  "buildCommand": "npm run build:demo && cp -r api demo/dist/",
  "outputDirectory": "demo/dist"
}
```

Then access them at the same paths.

### Solution 3: Use Vercel's Routes Configuration
Add explicit route configuration:
```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/demo/dist/$1" }
  ]
}
```

### Solution 4: Check Environment Variables
Verify in Vercel dashboard:
1. Settings → Environment Variables
2. Confirm `BLOB_READ_WRITE_TOKEN` is set for Production

## Next Steps

1. **CHECK VERCEL FUNCTION LOGS** (most important!)
2. Share the error message from the logs
3. Based on the error, we can determine the exact issue
4. Apply the appropriate solution

The logs will tell us exactly why the function is failing.
