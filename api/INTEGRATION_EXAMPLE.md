# External Repository Integration Example

This document shows how to integrate the simulator API from an external repository.

## Setup

1. **Get API Base URL**
   - Production: `https://dev-platform-eight.vercel.app` (or your Vercel deployment URL)
   - Development: `http://localhost:3000` (when running `vercel dev`)

2. **API Base Path**
   ```
   const API_BASE = 'https://dev-platform-eight.vercel.app/api';
   ```

## Example: Fetch and Display a Project

### 1. Fetch Project List

```typescript
async function getUserProjects(userId: string) {
  const response = await fetch(`${API_BASE}/projects/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  const data = await response.json();
  return data.projects; // Array of project objects
}
```

### 2. Fetch Project Data

```typescript
async function getProject(userId: string, projectId: string) {
  // Get metadata
  const metaResponse = await fetch(`${API_BASE}/projects/${userId}/${projectId}`);
  const metadata = await metaResponse.json();
  
  // Get diagram
  const diagramResponse = await fetch(`${API_BASE}/projects/${userId}/${projectId}/diagram`);
  const diagram = await diagramResponse.json();
  
  // Get code
  const codeResponse = await fetch(`${API_BASE}/projects/${userId}/${projectId}/code`);
  const code = await codeResponse.text();
  
  return { metadata, diagram, code };
}
```

### 3. Save Project

```typescript
async function saveProject(userId: string, projectId: string, diagram: any, code: string) {
  // Create or update project
  const createResponse = await fetch(`${API_BASE}/projects/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      name: projectId, // or custom name
      diagram,
      code,
    }),
  });
  
  if (!createResponse.ok) {
    throw new Error('Failed to save project');
  }
  
  return await createResponse.json();
}
```

### 4. Update Diagram Only

```typescript
async function updateDiagram(userId: string, projectId: string, diagram: any) {
  const response = await fetch(`${API_BASE}/projects/${userId}/${projectId}/diagram`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(diagram),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update diagram');
  }
  
  return await response.json();
}
```

### 5. Update Code Only

```typescript
async function updateCode(userId: string, projectId: string, code: string) {
  const response = await fetch(`${API_BASE}/projects/${userId}/${projectId}/code`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: code,
  });
  
  if (!response.ok) {
    throw new Error('Failed to update code');
  }
  
  return await response.json();
}
```

### 6. Embed Simulator in iframe

```html
<iframe 
  src="https://dev-platform-eight.vercel.app/api/simulator/embed?userId=user123&projectId=project456"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>
```

### 7. React Component Example

```tsx
import React, { useEffect, useState } from 'react';

const API_BASE = 'https://dev-platform-eight.vercel.app/api';

interface Project {
  id: string;
  userId: string;
  name: string;
}

function ProjectList({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    fetch(`${API_BASE}/projects/${userId}`)
      .then(res => res.json())
      .then(data => setProjects(data.projects))
      .catch(console.error);
  }, [userId]);
  
  return (
    <div>
      <h2>My Projects</h2>
      <ul>
        {projects.map(project => (
          <li key={project.id}>
            <a href={`/project/${project.id}`}>{project.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimulatorEmbed({ userId, projectId }: { userId: string; projectId: string }) {
  return (
    <iframe
      src={`${API_BASE}/simulator/embed?userId=${userId}&projectId=${projectId}`}
      width="100%"
      height="600px"
      style={{ border: 'none' }}
      title="Simulator"
    />
  );
}
```

## Error Handling

All API endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

Example error handling:

```typescript
async function safeFetch(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

## CORS

The API supports CORS from any origin. If you need to restrict this in production, update the CORS configuration in `api/_utils/cors.ts` and `vercel.json`.

## Next Steps

1. Set up `BLOB_READ_WRITE_TOKEN` in Vercel dashboard
2. Deploy the API routes
3. Test the endpoints from your external repository
4. Integrate the simulator embed in your pages
