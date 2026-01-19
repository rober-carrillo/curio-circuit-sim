# Deployment Steps - API Foundation

## ✅ Completed
- [x] API routes created
- [x] CORS configured
- [x] Vercel Blob Storage token added to Vercel dashboard

## Next Steps

### 1. Commit and Push Changes

```bash
# Add all new files
git add .

# Commit
git commit -m "Add API foundation for external repository integration

- Created API routes for project CRUD operations
- Added Vercel Blob Storage integration
- Configured CORS headers
- Added API documentation and integration examples"

# Push to trigger Vercel deployment
git push origin main
```

### 2. Wait for Vercel Deployment

- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Watch the deployment progress
- Wait for "Ready" status (usually 2-3 minutes)

### 3. Test the API

Once deployed, test the endpoints:

#### Quick Test Script
```bash
# Replace with your actual Vercel URL
API_BASE="https://dev-platform-eight.vercel.app/api"
USER_ID="test-user"
PROJECT_ID="test-project-1"

# 1. Create a project
curl -X POST "$API_BASE/projects/$USER_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"name\": \"Test Project\",
    \"diagram\": {\"version\": 1, \"parts\": [], \"connections\": []},
    \"code\": \"void setup() {}\nvoid loop() {}\"
  }"

# 2. List projects
curl "$API_BASE/projects/$USER_ID"

# 3. Get project
curl "$API_BASE/projects/$USER_ID/$PROJECT_ID"

# 4. Get diagram
curl "$API_BASE/projects/$USER_ID/$PROJECT_ID/diagram"

# 5. Get code
curl "$API_BASE/projects/$USER_ID/$PROJECT_ID/code"
```

### 4. Verify Environment Variable

If you get errors about missing token:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `BLOB_READ_WRITE_TOKEN` is set
3. Ensure it's enabled for **Production**, **Preview**, and **Development**
4. If you just added it, you may need to redeploy

### 5. Test Simulator Embed

Open in browser:
```
https://dev-platform-eight.vercel.app/api/simulator/embed?userId=test-user&projectId=test-project-1
```

## Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN is not defined"
- **Solution**: The token is set in Vercel, but you may need to:
  1. Go to Vercel Dashboard → Project Settings → Environment Variables
  2. Ensure token is enabled for all environments
  3. Trigger a new deployment (push a commit or use "Redeploy" button)

### Error: 500 Internal Server Error
- **Solution**: Check Vercel function logs:
  1. Go to Vercel Dashboard → Your Project → Functions
  2. Click on the failed function
  3. Check the logs for error details
  4. Common issues:
     - Blob storage not created (create it in Vercel Dashboard → Storage)
     - Token permissions (ensure it's a read/write token)

### CORS Errors
- **Solution**: CORS is already configured in `vercel.json`
- If you still see CORS errors, check:
  1. API base URL is correct
  2. Request method is allowed (GET, POST, PUT, DELETE, OPTIONS)
  3. Headers are correct

## Next Phase

After successful deployment and testing:
1. ✅ API endpoints working
2. ⏳ Update `generic.html` to load projects from API (optional)
3. ⏳ Connect external repository to use the API
4. ⏳ Add authentication (Phase 1)

## Resources

- [API Documentation](./api/README.md)
- [Integration Examples](./api/INTEGRATION_EXAMPLE.md)
- [Testing Guide](./api/TESTING.md)
