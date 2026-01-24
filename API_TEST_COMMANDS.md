# API Test Commands

## Base URL
Use one of your deployed domains:
- `https://dev-platform-eight.vercel.app`
- `https://dev-platform-git-main-curiolabs-projects.vercel.app`

## Test Commands

### 1. List Projects for a User
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user
```

### 2. Create a New Project
```bash
curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-1",
    "name": "My Test Project",
    "diagram": {"version": 1, "parts": [], "connections": []},
    "code": "void setup() {}\nvoid loop() {}"
  }'
```

### 3. Get a Specific Project
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1
```

### 4. Get Project Diagram
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1/diagram
```

### 5. Get Project Code
```bash
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1/code
```

### 6. Update Project Diagram
```bash
curl -X PUT https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1/diagram \
  -H "Content-Type: application/json" \
  -d '{"version": 1, "parts": [{"id": "uno1", "type": "wokwi-arduino-uno"}], "connections": []}'
```

### 7. Update Project Code
```bash
curl -X PUT https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1/code \
  -H "Content-Type: text/plain" \
  -d 'void setup() {
  Serial.begin(9600);
}
void loop() {
  Serial.println("Hello!");
  delay(1000);
}'
```

### 8. Delete a Project
```bash
curl -X DELETE https://dev-platform-eight.vercel.app/api/projects/test-user/test-project-1
```

### 9. Get Simulator Embed Page
Open in browser:
```
https://dev-platform-eight.vercel.app/api/simulator/embed?userId=test-user&projectId=test-project-1
```

## Expected Responses

### List Projects (GET /api/projects/{userId})
```json
{
  "projects": [
    {
      "id": "test-project-1",
      "userId": "test-user",
      "name": "test-project-1",
      "createdAt": "2024-01-15T...",
      "updatedAt": "2024-01-15T..."
    }
  ]
}
```

### Create Project (POST /api/projects/{userId})
```json
{
  "id": "test-project-1",
  "userId": "test-user",
  "name": "My Test Project",
  "diagramUrl": "https://...",
  "codeUrl": "https://...",
  "createdAt": "2024-01-15T..."
}
```

### Get Project (GET /api/projects/{userId}/{projectId})
```json
{
  "id": "test-project-1",
  "userId": "test-user",
  "name": "test-project-1",
  "hasDiagram": true,
  "hasCode": true,
  "createdAt": "2024-01-15T...",
  "updatedAt": "2024-01-15T..."
}
```

## Quick Test Sequence

```bash
# 1. List projects (should be empty initially)
curl https://dev-platform-eight.vercel.app/api/projects/test-user

# 2. Create a project
curl -X POST https://dev-platform-eight.vercel.app/api/projects/test-user \
  -H "Content-Type: application/json" \
  -d '{"projectId":"test-1","name":"Test","diagram":{},"code":"void setup(){}"}'

# 3. List projects again (should show the new project)
curl https://dev-platform-eight.vercel.app/api/projects/test-user

# 4. Get the project
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-1

# 5. Get the diagram
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-1/diagram

# 6. Get the code
curl https://dev-platform-eight.vercel.app/api/projects/test-user/test-1/code
```
