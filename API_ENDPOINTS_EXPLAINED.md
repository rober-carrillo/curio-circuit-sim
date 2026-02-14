# API Endpoints Explained

## Current Status

✅ **Functions are detected in Vercel** - You can see functions like `/api/projects/[userId]/[projectId]/diagram`  
⏳ **Routes may still be deploying** - Wait for the latest deployment to complete

## How the API Works

The API stores projects in Vercel Blob Storage. Each project has:
- **userId**: The user who owns the project (e.g., "test-user")
- **projectId**: Unique identifier for the project (e.g., "simple-test")
- **diagram**: Circuit diagram JSON (from `diagram.json`)
- **code**: Arduino code (from `.ino` file)

## API Endpoint Structure

### Base URL
```
https://dev-platform-eight.vercel.app/api
```

### Endpoints

#### 1. List Projects
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

#### 2. Create Project
```
POST /api/projects/{userId}
Content-Type: application/json
```
Creates a new project and uploads diagram/code to blob storage.

**Example:**
```bash
curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "simple-test",
    "name": "Simple Test Project",
    "diagram": {...},
    "code": "void setup() {...}"
  }'
```

#### 3. Get Project Metadata
```
GET /api/projects/{userId}/{projectId}
```
Gets project information (whether it has diagram/code).

**Example:**
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test
```

#### 4. Get Diagram
```
GET /api/projects/{userId}/{projectId}/diagram
```
Downloads the diagram JSON.

**Example:**
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram
```

**Response:** The same JSON as `simple-test/diagram.json`

#### 5. Save Diagram
```
PUT /api/projects/{userId}/{projectId}/diagram
Content-Type: application/json
```
Updates the diagram JSON.

**Example:**
```bash
curl -X PUT https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram \
  -H "Content-Type: application/json" \
  -d @simple-test/diagram.json
```

#### 6. Get Code
```
GET /api/projects/{userId}/{projectId}/code
```
Downloads the Arduino code.

**Example:**
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code
```

**Response:** The same content as `simple-test/simple-test.ino`

#### 7. Save Code
```
PUT /api/projects/{userId}/{projectId}/code
Content-Type: text/plain
```
Updates the Arduino code.

**Example:**
```bash
curl -X PUT https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code \
  -H "Content-Type: text/plain" \
  --data-binary @simple-test/simple-test.ino
```

#### 8. Delete Project
```
DELETE /api/projects/{userId}/{projectId}
```
Deletes both diagram and code files.

**Example:**
```bash
curl -X DELETE https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test
```

#### 9. Embed Simulator
```
GET /api/simulator/embed?userId={userId}&projectId={projectId}
```
Returns an HTML page with the simulator pre-loaded.

**Example:**
Open in browser:
```
https://dev-platform-eight.vercel.app/api/simulator/embed?userId=test-user&projectId=simple-test
```

## Uploading Your `simple-test` Project

### Method 1: Using the Node.js Script

```bash
node upload-simple-test.js
```

### Method 2: Using curl (after installing jq)

```bash
# Install jq first: brew install jq

curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"simple-test\",
    \"name\": \"Simple Test Project\",
    \"diagram\": $(cat simple-test/diagram.json | jq -c .),
    \"code\": $(cat simple-test/simple-test.ino | jq -Rs .)
  }"
```

### Method 3: Manual JSON Construction

1. Read `simple-test/diagram.json` and `simple-test/simple-test.ino`
2. Escape the JSON properly
3. Send POST request

## Testing All Endpoints

Once the project is uploaded, test each endpoint:

```bash
# 1. List projects
curl https://dev-platform-eight.vercel.app/api/projects/test-user

# 2. Get project metadata
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test

# 3. Get diagram
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram

# 4. Get code
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code

# 5. Test simple endpoint
curl https://dev-platform-eight.vercel.app/api/test
```

## Current Issue

If you're still seeing `NOT_FOUND`:
1. **Wait for deployment** - The latest changes may still be deploying
2. **Check Functions tab** - Verify functions are listed in Vercel dashboard
3. **Check build logs** - Ensure the `cp -r api demo/dist/` command succeeded
4. **Test locally** - Run `vercel dev` to test routes locally first

## Next Steps

1. Wait for the latest deployment to complete (check Vercel dashboard)
2. Once deployed, try the upload script: `node upload-simple-test.js`
3. Test each endpoint individually
4. If still not working, check Vercel function logs for errors
