# API Usage Guide

## Overview

The API allows you to store and retrieve Arduino projects (diagrams and code) on Vercel Blob Storage. Each project belongs to a user and has a unique project ID.

## API Structure

```
/api/projects/{userId}                    # List or create projects
/api/projects/{userId}/{projectId}        # Get/update/delete project
/api/projects/{userId}/{projectId}/diagram # Get/save diagram JSON
/api/projects/{userId}/{projectId}/code    # Get/save code file
/api/simulator/embed                      # Get embeddable simulator page
```

## How to Upload Your `simple-test` Project

### Step 1: Create the Project

```bash
curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "simple-test",
    "name": "Simple Test Project",
    "diagram": <diagram.json content>,
    "code": <simple-test.ino content>
  }'
```

### Step 2: Access the Project

Once uploaded, you can access it via:

- **Diagram**: `GET /api/projects/test-user/simple-test/diagram`
- **Code**: `GET /api/projects/test-user/simple-test/code`
- **Metadata**: `GET /api/projects/test-user/simple-test`

## Endpoint Details

### 1. List Projects
```bash
GET /api/projects/{userId}
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

### 2. Create Project
```bash
POST /api/projects/{userId}
Content-Type: application/json

{
  "projectId": "simple-test",
  "name": "Simple Test Project",
  "diagram": { ... },  // Optional
  "code": "void setup() { ... }"  // Optional
}
```

**Response:**
```json
{
  "id": "simple-test",
  "userId": "test-user",
  "name": "Simple Test Project",
  "diagramUrl": "https://...",
  "codeUrl": "https://...",
  "createdAt": "2024-01-24T..."
}
```

### 3. Get Project Metadata
```bash
GET /api/projects/{userId}/{projectId}
```

**Response:**
```json
{
  "id": "simple-test",
  "userId": "test-user",
  "name": "simple-test",
  "hasDiagram": true,
  "hasCode": true,
  "createdAt": "2024-01-24T...",
  "updatedAt": "2024-01-24T..."
}
```

### 4. Get Diagram
```bash
GET /api/projects/{userId}/{projectId}/diagram
```

**Response:** Diagram JSON object (same as `diagram.json`)

### 5. Save Diagram
```bash
PUT /api/projects/{userId}/{projectId}/diagram
Content-Type: application/json

{
  "version": 1,
  "parts": [...],
  "connections": [...]
}
```

### 6. Get Code
```bash
GET /api/projects/{userId}/{projectId}/code
```

**Response:** Plain text Arduino code

### 7. Save Code
```bash
PUT /api/projects/{userId}/{projectId}/code
Content-Type: text/plain

void setup() {
  // ...
}
```

### 8. Delete Project
```bash
DELETE /api/projects/{userId}/{projectId}
```

### 9. Get Embeddable Simulator
```bash
GET /api/simulator/embed?userId={userId}&projectId={projectId}
```

**Response:** HTML page with embedded simulator

## Quick Test Script

Run the test script to upload and test `simple-test`:

```bash
./test-api.sh
```

Or manually:

```bash
# 1. Upload simple-test
curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "projectId": "simple-test",
  "name": "Simple Test Project",
  "diagram": $(cat simple-test/diagram.json),
  "code": $(cat simple-test/simple-test.ino | jq -Rs .)
}
EOF

# 2. Get the diagram
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram

# 3. Get the code
curl https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code
```

## Using in Your External Repository

Once a project is uploaded, your external repository can:

1. **Fetch project data:**
   ```javascript
   const diagram = await fetch(
     'https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram'
   ).then(r => r.json());
   
   const code = await fetch(
     'https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/code'
   ).then(r => r.text());
   ```

2. **Save updates:**
   ```javascript
   await fetch(
     'https://dev-platform-eight.vercel.app/api/projects/test-user/simple-test/diagram',
     {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(updatedDiagram)
     }
   );
   ```

3. **Embed the simulator:**
   ```html
   <iframe src="https://dev-platform-eight.vercel.app/api/simulator/embed?userId=test-user&projectId=simple-test"></iframe>
   ```
