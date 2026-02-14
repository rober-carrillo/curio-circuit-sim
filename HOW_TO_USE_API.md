# How to Use the API - Complete Guide

## Current Status

✅ **Functions Detected**: You can see functions in Vercel dashboard  
⏳ **Routes May Still Be Deploying**: Wait for latest deployment to complete  
🔧 **If Still NOT_FOUND**: Check deployment logs in Vercel dashboard

## Understanding the API Structure

### How Projects Are Stored

Projects are stored in Vercel Blob Storage with this structure:
```
projects/
  {userId}/
    {projectId}/
      diagram.json    # Circuit diagram
      code.ino        # Arduino code
```

### API Endpoints

All endpoints are under: `https://dev-platform-eight.vercel.app/api`

#### 1. **List Projects** (GET)
```
GET /api/projects/{userId}
```
Lists all projects for a user.

**Example:**
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user
```

**Response:**
```json
{
  "projects": [
    {
      "id": "simple-test",
      "userId": "test-user",
      "name": "Simple Test Project",
      "createdAt": "2024-01-24T...",
      "updatedAt": "2024-01-24T..."
    }
  ]
}
```

#### 2. **Create Project** (POST)
```
POST /api/projects/{userId}
Content-Type: application/json
```
Creates a new project and uploads diagram/code.

**Example - Upload `simple-test`:**
```bash
curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "simple-test",
    "name": "Simple Test Project",
    "diagram": {
      "version": 1,
      "author": "Test",
      "editor": "wokwi",
      "parts": [...],
      "connections": [...]
    },
    "code": "void setup() { ... }"
  }'
```

#### 3. **Get Project Info** (GET)
```
GET /api/projects/{userId}/{projectId}
```
Gets project metadata.

**Example:**
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test
```

#### 4. **Get Diagram** (GET)
```
GET /api/projects/{userId}/{projectId}/diagram
```
Downloads the diagram JSON (same as `simple-test/diagram.json`).

**Example:**
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram
```

#### 5. **Save Diagram** (PUT)
```
PUT /api/projects/{userId}/{projectId}/diagram
Content-Type: application/json
```
Updates the diagram.

**Example:**
```bash
curl -X PUT https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram \
  -H "Content-Type: application/json" \
  -d @simple-test/diagram.json
```

#### 6. **Get Code** (GET)
```
GET /api/projects/{userId}/{projectId}/code
```
Downloads the Arduino code (same as `simple-test/simple-test.ino`).

**Example:**
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code
```

#### 7. **Save Code** (PUT)
```
PUT /api/projects/{userId}/{projectId}/code
Content-Type: text/plain
```
Updates the code.

**Example:**
```bash
curl -X PUT https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code \
  -H "Content-Type: text/plain" \
  --data-binary @simple-test/simple-test.ino
```

#### 8. **Delete Project** (DELETE)
```
DELETE /api/projects/{userId}/{projectId}
```
Deletes both diagram and code files.

**Example:**
```bash
curl -X DELETE https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test
```

#### 9. **Embed Simulator** (GET)
```
GET /api/simulator/embed?userId={userId}&projectId={projectId}
```
Returns HTML page with embedded simulator.

**Example:**
Open in browser:
```
https://dev-platform-eight.vercel.app/api/simulator/embed?userId=test-user&projectId=simple-test
```

## Uploading Your `simple-test` Project

### Method 1: Using Node.js Script

```bash
node upload-simple-test.js
```

This script reads `simple-test/diagram.json` and `simple-test/simple-test.ino` and uploads them.

### Method 2: Manual Upload

1. Read the files:
   ```bash
   cat simple-test/diagram.json
   cat simple-test/simple-test.ino
   ```

2. Create JSON payload (escape properly):
   ```json
   {
     "projectId": "simple-test",
     "name": "Simple Test Project",
     "diagram": { /* paste diagram.json content */ },
     "code": "/* paste simple-test.ino content */"
   }
   ```

3. Upload:
   ```bash
   curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
     -H "Content-Type: application/json" \
     -d @payload.json
   ```

## Testing All Endpoints

Once the project is uploaded, test in this order:

```bash
# 1. Test simple endpoint (should work first)
curl https://dev-platform-eight.vercel.app/api/test

# 2. List projects
curl https://dev-platform-eight.vercel.app/api/projects/test-user

# 3. Get project info
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test

# 4. Get diagram
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram

# 5. Get code
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code
```

## Troubleshooting

### If You See NOT_FOUND

1. **Check Deployment Status**
   - Go to Vercel Dashboard → Your Project → Latest Deployment
   - Wait for "Ready" status (green checkmark)
   - Check build logs for errors

2. **Verify Functions Are Listed**
   - Go to Functions tab in deployment
   - You should see routes like:
     - `/api/projects/[userId]/route`
     - `/api/projects/[userId]/[projectId]/diagram`
     - `/api/test`

3. **Check Build Logs**
   - Look for any errors during build
   - Verify API directory was included

4. **Wait for Deployment**
   - Latest changes may still be deploying
   - Give it 2-3 minutes after push

### If Functions Are Detected But Routes Don't Work

This might mean:
- Routes are detected but not yet accessible (deployment in progress)
- There's a routing configuration issue
- The functions need to be rebuilt

**Solution**: Wait for deployment to complete, then test again.

## Next Steps

1. **Wait for Latest Deployment** (2-3 minutes)
2. **Check Vercel Dashboard** → Functions tab should show all routes
3. **Test Simple Endpoint First**: `curl https://dev-platform-eight.vercel.app/api/test`
4. **If That Works**: Try uploading `simple-test` with `node upload-simple-test.js`
5. **Then Test All Endpoints** using the commands above

## Expected Behavior

Once working:
- ✅ `GET /api/test` → Returns `{"message": "API is working!"}`
- ✅ `GET /api/projects/test-user` → Returns list of projects
- ✅ `POST /api/projects/test-user` → Creates new project
- ✅ `GET /api/projects/test-user/simple-test/diagram` → Returns diagram JSON
- ✅ `GET /api/projects/test-user/simple-test/code` → Returns Arduino code
