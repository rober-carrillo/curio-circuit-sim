# Vercel 300 Second Timeout Diagnosis

## Symptom
ALL API endpoints (even the simplest one with no code) timeout after 300 seconds.

## What This Means
The function is **NOT EXECUTING AT ALL**. If the code was running and had a bug, it would fail immediately or within a few seconds. A 300-second timeout means Vercel is waiting for something that never happens.

## Possible Causes

### 1. **outputDirectory Prevents API Route Execution** ⭐ Most Likely
When `outputDirectory` is set, Vercel may:
- Only serve static files from that directory
- Not execute API routes at all
- Route all requests to the static output first

### 2. **TypeScript Compilation Issue**
The compiled JavaScript files might be:
- In the wrong location
- Not recognized as valid API routes
- Missing required exports

### 3. **Runtime Configuration**
The `runtime: 'nodejs'` config might not be recognized or compatible.

### 4. **Build Process Issue**
The build might be:
- Not compiling the API routes
- Excluding them from deployment
- Placing them in the wrong location

## Solutions to Try

### Solution 1: Remove outputDirectory (Test)
Temporarily remove `outputDirectory` to see if API routes work:

```json
{
  "buildCommand": "npm run build:demo",
  "framework": null
}
```

If this works, we know `outputDirectory` is the issue.

### Solution 2: Use Vercel's Build Output API
Instead of `outputDirectory`, use `.vercel/output` structure:
- Put static files in `.vercel/output/static/`
- Put functions in `.vercel/output/functions/`

### Solution 3: Separate Static and API Deployments
Deploy static site and API separately, or use a different structure.

### Solution 4: Check Vercel Dashboard
In the Vercel dashboard:
1. Go to Functions tab
2. Check if functions are listed
3. Check their configuration
4. Look at the build logs - are API files being compiled?

## Key Question
**Are the functions even being detected and deployed?**

Check Vercel dashboard → Functions tab. If functions are listed but timing out, it's a runtime issue. If they're NOT listed, it's a build/detection issue.
