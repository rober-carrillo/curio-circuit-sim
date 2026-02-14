# Testing the API

## Script (recommended)

From the avr8js repo root, run:

```bash
node scripts/test-projects-api.mjs
```

Optional: use a different API base URL:

```bash
API_BASE=https://dev-platform-eight.vercel.app/api node scripts/test-projects-api.mjs
```

The script exercises: list projects, create project, get project, get diagram, get code.

## Quick Test After Deployment (curl)

Once deployed, test the API endpoints:

### 1. Test List Projects (should return empty array for new user)
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user
```

### 2. Test Create Project
```bash
curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-1",
    "name": "Test Project",
    "diagram": {"version": 1, "parts": [], "connections": []},
    "code": "void setup() {}\nvoid loop() {}"
  }'
```

### 3. Test Get Project
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1
```

### 4. Test Get Diagram
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1/diagram
```

### 5. Test Get Code
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1/code
```

### 6. Test Simulator Embed
Open in browser:
```
https://dev-platform-eight.vercel.app/api/simulator/embed?userId=test-user&projectId=test-project-1
```

## Expected Responses

### List Projects
```json
{
  "projects": [
    {
      "id": "test-project-1",
      "userId": "test-user",
      "name": "Test Project",
      "createdAt": "2024-01-15T...",
      "updatedAt": "2024-01-15T..."
    }
  ]
}
```

### Create Project
```json
{
  "id": "test-project-1",
  "userId": "test-user",
  "name": "Test Project",
  "diagramUrl": "https://...",
  "codeUrl": "https://...",
  "createdAt": "2024-01-15T..."
}
```

## Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN is not defined"
- Check Vercel dashboard → Project Settings → Environment Variables
- Ensure token is set for Production, Preview, and Development
- Redeploy after adding the variable

### Error: 500 Internal Server Error
- Check Vercel function logs in dashboard
- Verify blob storage is created in Vercel
- Ensure token has read/write permissions

### CORS Errors
- Verify CORS headers in `vercel.json`
- Check browser console for specific CORS error
- Ensure API base URL is correct
