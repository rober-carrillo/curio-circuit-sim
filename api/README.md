# API Documentation

This directory contains Vercel serverless functions (Edge Runtime) for the Cloud Microcontroller Simulator Platform.

## Setup

### 1. Environment Variables

Set the following in your Vercel project settings:

- `BLOB_READ_WRITE_TOKEN` - Get this from [Vercel Blob Dashboard](https://vercel.com/dashboard/stores)

### 2. Vercel Blob Storage

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project → Storage → Create Database/Store
3. Select "Blob" storage
4. Copy the `BLOB_READ_WRITE_TOKEN` and add it as an environment variable

## API Endpoints

### Projects

#### List User Projects
```
GET /api/projects/[userId]
```

**Response:**
```json
{
  "projects": [
    {
      "id": "project-123",
      "userId": "user-456",
      "name": "My Project",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Project
```
POST /api/projects/[userId]
Content-Type: application/json

{
  "projectId": "project-123",
  "name": "My Project",
  "diagram": { ... },  // Optional
  "code": "void setup() { ... }"  // Optional
}
```

**Response:**
```json
{
  "id": "project-123",
  "userId": "user-456",
  "name": "My Project",
  "diagramUrl": "https://...",
  "codeUrl": "https://...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Get Project
```
GET /api/projects/[userId]/[projectId]
```

**Response:**
```json
{
  "id": "project-123",
  "userId": "user-456",
  "name": "My Project",
  "hasDiagram": true,
  "hasCode": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

#### Update Project
```
PUT /api/projects/[userId]/[projectId]
Content-Type: application/json

{
  "name": "Updated Project Name"
}
```

#### Delete Project
```
DELETE /api/projects/[userId]/[projectId]
```

### Diagram

#### Get Diagram
```
GET /api/projects/[userId]/[projectId]/diagram
```

**Response:** Diagram JSON object

#### Save Diagram
```
PUT /api/projects/[userId]/[projectId]/diagram
Content-Type: application/json

{
  "version": 1,
  "parts": [...],
  "connections": [...]
}
```

**Response:**
```json
{
  "url": "https://...",
  "message": "Diagram saved successfully"
}
```

### Code

#### Get Code
```
GET /api/projects/[userId]/[projectId]/code
```

**Response:** Plain text Arduino code

#### Save Code
```
PUT /api/projects/[userId]/[projectId]/code
Content-Type: text/plain

void setup() {
  // ...
}
```

**Response:**
```json
{
  "url": "https://...",
  "message": "Code saved successfully"
}
```

### Simulator Embed

#### Get Embeddable Simulator
```
GET /api/simulator/embed?userId=[userId]&projectId=[projectId]
```

**Response:** HTML page that loads the simulator with the project data

## CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Error Responses

All errors return JSON in this format:

```json
{
  "error": "Error message here"
}
```

Status codes:
- `400` - Bad Request
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Testing Locally

To test API routes locally, use Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

The API routes will be available at `http://localhost:3000/api/...`

## Deployment

API routes are automatically deployed to Vercel when you push to the repository. They run on Vercel's Edge Runtime for fast global performance.
