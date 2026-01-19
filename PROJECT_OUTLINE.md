# Cloud Microcontroller Simulator Platform - Project Outline

This document outlines the architecture and organization for building a cloud-hosted microcontroller simulation platform on Vercel.

## Project Overview

A web-based platform for editing, configuring, and simulating microcontroller code with:
- User authentication
- Cloud storage for code and circuit diagrams
- Multi-project support per user
- Real-time simulation using AVR8js

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router) - optimized for Vercel
- **UI Components**: 
  - React components
  - `@wokwi/elements` for hardware visualization
  - Monaco Editor for code editing
- **State Management**: Zustand or React Context
- **Styling**: Tailwind CSS + CSS Modules

### Backend (Vercel Serverless)
- **API Routes**: Next.js API routes (serverless functions)
- **Database**: 
  - Vercel Postgres (for user data, projects, metadata)
  - Vercel Blob Storage (for code files and circuit diagrams)
- **Authentication**: NextAuth.js (Auth.js) with multiple providers
- **File Storage**: Vercel Blob or S3-compatible storage

### Simulation Engine
- **Core**: AVR8js library (this repository)
- **Compilation**: Arduino CLI or online compiler service
- **Execution**: Client-side simulation with Web Workers for performance

## Project Structure

```
platform/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth routes (login, signup)
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/             # Protected routes
│   │   ├── (student)/          # Student-specific routes
│   │   │   ├── projects/       # Project list
│   │   │   │   ├── [id]/      # Individual project
│   │   │   │   │   ├── editor/     # Code editor view
│   │   │   │   │   ├── simulator/  # Simulator view
│   │   │   │   │   └── diagram/    # Circuit diagram view
│   │   │   │   └── new/            # Create new project
│   │   │   └── tutors/         # View assigned tutors
│   │   ├── (tutor)/            # Tutor-specific routes
│   │   │   ├── students/       # List of assigned students
│   │   │   │   └── [studentId]/
│   │   │   │       └── projects/  # View student's projects
│   │   │   ├── projects/       # All projects from students
│   │   │   │   └── [id]/      # View/comment on project
│   │   │   └── comments/       # Manage comments/feedback
│   │   ├── settings/            # User settings
│   │   └── layout.tsx          # Dashboard layout (role-aware)
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── projects/           # Project CRUD operations
│   │   │   ├── route.ts        # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts    # GET, PUT, DELETE
│   │   │       ├── code/       # Code file operations
│   │   │       ├── diagram/    # Circuit diagram operations
│   │   │       └── comments/   # Comment operations
│   │   ├── relationships/      # Tutor-student relationships
│   │   │   ├── route.ts        # GET (list), POST (create)
│   │   │   └── [id]/route.ts   # PUT, DELETE
│   │   ├── compile/            # Code compilation service
│   │   └── storage/            # File storage operations
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
│
├── components/                   # Reusable React components
│   ├── editor/                 # Code editor components
│   │   ├── MonacoEditor.tsx
│   │   └── EditorToolbar.tsx
│   ├── simulator/                 # Simulator components
│   │   ├── SimulatorCanvas.tsx
│   │   ├── ComponentPalette.tsx
│   │   ├── SerialMonitor.tsx
│   │   └── PerformanceMetrics.tsx
│   ├── diagram/                # Circuit diagram components
│   │   ├── DiagramCanvas.tsx
│   │   ├── ComponentLibrary.tsx
│   │   └── WireTool.tsx
│   ├── project/                # Project management
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   └── ProjectSettings.tsx
│   ├── comments/               # Comment/feedback components
│   │   ├── CommentPanel.tsx
│   │   ├── CommentThread.tsx
│   │   ├── CodeComment.tsx
│   │   └── DiagramComment.tsx
│   ├── tutor/                  # Tutor-specific components
│   │   ├── StudentList.tsx
│   │   ├── StudentProjects.tsx
│   │   └── FeedbackDashboard.tsx
│   └── ui/                     # Base UI components
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── ...
│
├── lib/                         # Shared utilities and libraries
│   ├── avr8js/                 # AVR8js integration
│   │   ├── runner.ts           # AVRRunner wrapper
│   │   ├── compiler.ts         # Compilation service
│   │   └── components.ts       # Component-to-pin mapping
│   ├── db/                     # Database utilities
│   │   ├── client.ts           # Database client
│   │   ├── schema.ts           # Database schema (Drizzle ORM)
│   │   └── queries/            # Database queries
│   ├── auth/                   # Authentication utilities
│   │   └── config.ts           # NextAuth configuration
│   ├── storage/                 # File storage utilities
│   │   └── client.ts           # Blob storage client
│   └── utils/                  # General utilities
│
├── hooks/                       # Custom React hooks
│   ├── useSimulator.ts         # Simulator state management
│   ├── useProject.ts           # Project data management
│   ├── useEditor.ts            # Editor state
│   └── useDiagram.ts           # Diagram state
│
├── types/                       # TypeScript type definitions
│   ├── project.ts              # Project types
│   ├── user.ts                # User types
│   ├── simulator.ts           # Simulator types
│   └── diagram.ts              # Circuit diagram types
│
├── workers/                     # Web Workers
│   └── simulator.worker.ts     # Simulation worker (for performance)
│
├── public/                      # Static assets
│   └── components/             # Component images/icons
│
├── .env.local                  # Environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies

```

## Database Schema

### Users Table
```sql
- id: UUID (primary key)
- email: string (unique)
- name: string
- image: string (optional)
- role: enum ('student', 'tutor', 'admin') (default: 'student')
- created_at: timestamp
- updated_at: timestamp
```

### User Relationships Table (for tutor-student assignments)
```sql
- id: UUID (primary key)
- tutor_id: UUID (foreign key -> users.id)
- student_id: UUID (foreign key -> users.id)
- status: enum ('pending', 'active', 'inactive')
- created_at: timestamp
- updated_at: timestamp
- UNIQUE(tutor_id, student_id)
```

### Projects Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key -> users.id) -- project owner
- name: string
- description: text (optional)
- code_file_url: string (blob storage URL)
- diagram_file_url: string (blob storage URL)
- settings: JSONB (simulator settings, component configs)
- created_at: timestamp
- updated_at: timestamp
- is_public: boolean (default: false)
- tutor_access: boolean (default: true) -- allow assigned tutors to view
```

### Project Comments Table (for tutor feedback)
```sql
- id: UUID (primary key)
- project_id: UUID (foreign key -> projects.id)
- user_id: UUID (foreign key -> users.id) -- comment author
- comment_type: enum ('code', 'diagram', 'general')
- target_line: integer (optional, for code comments)
- target_component: string (optional, for diagram comments)
- content: text
- resolved: boolean (default: false)
- created_at: timestamp
- updated_at: timestamp
```

### Project Versions Table (optional, for history)
```sql
- id: UUID (primary key)
- project_id: UUID (foreign key -> projects.id)
- code_file_url: string
- diagram_file_url: string
- version_number: integer
- created_at: timestamp
```

## Core Features & Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Vercel deployment
- [ ] Set up database (Vercel Postgres)
- [ ] Implement authentication (NextAuth.js)
- [ ] Create basic project CRUD API
- [ ] Set up file storage (Vercel Blob)

### Phase 2: Core Editor (Weeks 3-4)
- [ ] Integrate Monaco Editor
- [ ] Implement code saving/loading
- [ ] Add syntax highlighting for Arduino/C++
- [ ] Create editor toolbar (save, run, stop)
- [ ] Implement auto-save functionality

### Phase 3: Simulator Integration (Weeks 5-6)
- [ ] Integrate AVR8js library
- [ ] Create simulator canvas component
- [ ] Implement code compilation service
- [ ] Add component palette (LEDs, buttons, etc.)
- [ ] Implement pin-to-component connections
- [ ] Add serial monitor
- [ ] Display performance metrics

### Phase 4: Circuit Diagram (Weeks 7-8)
- [ ] Choose diagram library (React Flow, Cytoscape, or custom)
- [ ] Implement drag-and-drop components
- [ ] Create wire connection tool
- [ ] Save/load diagram state
- [ ] Sync diagram with simulator components

### Phase 5: Project Management (Weeks 9-10)
- [ ] Project list view with cards
- [ ] Project creation/editing/deletion
- [ ] Project sharing (public/private)
- [ ] Project templates/examples
- [ ] Search and filter projects

### Phase 6: Enhanced Features (Weeks 11-12)
- [ ] User settings page
- [ ] Project versioning/history
- [ ] Export/import projects
- [ ] Component library expansion
- [ ] Documentation/help system

### Phase 7: Tutor/Student Features (Weeks 13-14)
- [ ] User role system (student/tutor/admin)
- [ ] Tutor-student relationship management
- [ ] Tutor dashboard to view student projects
- [ ] Comment system (code comments, diagram annotations)
- [ ] Notification system for comments/feedback
- [ ] Student view of tutor feedback

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Projects
- `GET /api/projects` - List user's projects (role-aware: students see own, tutors see assigned students')
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details (with permission check)
- `PUT /api/projects/[id]` - Update project (owner only)
- `DELETE /api/projects/[id]` - Delete project (owner only)
- `GET /api/projects/[id]/code` - Get project code
- `PUT /api/projects/[id]/code` - Update project code (owner only)
- `GET /api/projects/[id]/diagram` - Get circuit diagram
- `PUT /api/projects/[id]/diagram` - Update circuit diagram (owner only)
- `GET /api/projects/[id]/comments` - Get project comments
- `POST /api/projects/[id]/comments` - Create comment (tutors can comment)
- `PUT /api/projects/[id]/comments/[commentId]` - Update comment
- `DELETE /api/projects/[id]/comments/[commentId]` - Delete comment

### Relationships (Tutor-Student)
- `GET /api/relationships` - List relationships (tutors see students, students see tutors)
- `POST /api/relationships` - Create tutor-student relationship
- `PUT /api/relationships/[id]` - Update relationship status
- `DELETE /api/relationships/[id]` - Remove relationship

### Compilation
- `POST /api/compile` - Compile Arduino code to hex

## Key Design Decisions

### 1. Monorepo vs Separate Repos
**Recommendation**: Start with a single Next.js monorepo. Split later if needed.

### 2. State Management
**Recommendation**: Use Zustand for global state (simulator, editor), React Context for auth.

### 3. Diagram Library
**Options**:
- React Flow (recommended) - Modern, flexible, good for circuit diagrams
- Cytoscape.js - More powerful but heavier
- Custom SVG-based - Full control but more work

### 4. Code Compilation
**Options**:
- Arduino CLI in serverless function (requires Docker)
- External compilation service (like current demo)
- Client-side compilation (WASM-based, experimental)

**Recommendation**: Start with external service, migrate to serverless later.

### 5. File Storage Strategy
- **Code files**: Store in Vercel Blob (small, text-based)
- **Diagrams**: Store as JSON in database or Blob
- **Large assets**: Use Vercel Blob or CDN

### 6. Role-Based Access Control (RBAC)
**Implementation**:
- User roles stored in database (student, tutor, admin)
- Middleware to check roles and permissions
- Separate UI layouts for different roles (similar to Uber's driver/rider apps)
- Tutor dashboard shows aggregated view of all assigned students
- Student dashboard shows personal projects and tutor feedback
- Comments system allows tutors to annotate code and diagrams

## Security Considerations

1. **Authentication**: Use NextAuth.js with secure session management
2. **Authorization**: 
   - Verify user ownership on all project operations
   - Implement role-based access control (RBAC)
   - Check tutor-student relationships before granting access
   - Validate permissions on comment operations
3. **Input Validation**: Validate all user inputs (code, diagram data, comments)
4. **Rate Limiting**: Implement rate limits on compilation API
5. **CORS**: Configure properly for API routes
6. **File Upload**: Validate file types and sizes
7. **Data Privacy**: Ensure tutors can only access projects from assigned students

## Performance Optimizations

1. **Code Splitting**: Lazy load simulator and editor components
2. **Web Workers**: Run simulation in a worker thread
3. **Caching**: Cache compiled hex files
4. **CDN**: Serve static assets via Vercel CDN
5. **Database Indexing**: Index user_id and project_id columns
6. **Pagination**: Implement pagination for project lists

## Deployment Strategy

1. **Development**: Local development with Vercel CLI
2. **Staging**: Preview deployments on Vercel
3. **Production**: Main branch auto-deploys to production
4. **Database**: Use Vercel Postgres (managed)
5. **Monitoring**: Vercel Analytics + Sentry for error tracking

## External Repository Integration

### Current Status
- ✅ Simulator working locally with `generic.html`
- ✅ Project persistence using localStorage
- ✅ Vercel deployment configured
- ⏳ API endpoints for external repository connection (in progress)

### Integration Steps

#### Phase 0: API Foundation (Current Phase)
**Goal**: Enable external repository to fetch/save projects via API

1. **Set up Vercel Blob Storage**
   - [x] Install `@vercel/blob` package ✅ 2024-01-15
   - [ ] Configure `BLOB_READ_WRITE_TOKEN` environment variable in Vercel (TODO: Set in Vercel dashboard)
   - [ ] Test blob storage connection (TODO: After token is set)

2. **Create API Routes Structure**
   - [x] Created API routes structure ✅ 2024-01-15
   ```
   api/
   ├── _utils/
   │   ├── cors.ts              # CORS utilities
   │   ├── storage.ts            # Blob storage helpers
   │   └── response.ts           # Response helpers
   ├── projects/
   │   ├── [userId]/
   │   │   ├── route.ts          # GET: list, POST: create ✅
   │   │   └── [projectId]/
   │   │       ├── route.ts      # GET/PUT/DELETE: project metadata ✅
   │   │       ├── diagram.ts    # GET/PUT: diagram JSON ✅
   │   │       └── code.ts        # GET/PUT: code file (.ino) ✅
   └── simulator/
       └── embed.ts              # GET: embeddable simulator page ✅
   ```

3. **API Endpoints for External Repo**
   - [x] `GET /api/projects/[userId]` - List all projects for user ✅
   - [x] `POST /api/projects/[userId]` - Create new project ✅
   - [x] `GET /api/projects/[userId]/[projectId]` - Get project metadata ✅
   - [x] `PUT /api/projects/[userId]/[projectId]` - Update project metadata ✅
   - [x] `DELETE /api/projects/[userId]/[projectId]` - Delete project ✅
   - [x] `GET /api/projects/[userId]/[projectId]/diagram` - Get diagram JSON ✅
   - [x] `PUT /api/projects/[userId]/[projectId]/diagram` - Save diagram JSON ✅
   - [x] `GET /api/projects/[userId]/[projectId]/code` - Get code file ✅
   - [x] `PUT /api/projects/[userId]/[projectId]/code` - Save code file ✅
   - [x] `GET /api/simulator/embed?userId=X&projectId=Y` - Embeddable simulator ✅

4. **CORS Configuration**
   - [x] Add CORS headers to all API routes ✅
   - [x] Configure CORS in `vercel.json` ✅
   - [ ] Test CORS from external repository (TODO: After deployment)

5. **Embeddable Simulator Page**
   - [x] Create embed endpoint (`/api/simulator/embed`) ✅
   - [x] Accept query params: `userId`, `projectId` ✅
   - [x] Load project data from API ✅
   - [ ] Update `generic.html` to accept query params and load from API (TODO: Next step)
   - [ ] Test iframe embedding (TODO: After deployment)

6. **Update Vercel Configuration**
   - [x] Update `vercel.json` with API routes and CORS headers ✅
   - [ ] Test deployment (TODO: After setting BLOB_READ_WRITE_TOKEN)

#### Phase 0.5: External Repo Connection
**Goal**: Connect external repository to simulator API

1. **External Repository Setup**
   - [ ] Configure API base URL (Vercel deployment URL)
   - [ ] Create API client/service in external repo
   - [ ] Implement project fetching logic
   - [ ] Implement project saving logic
   - [ ] Create iframe/embed component for simulator

2. **Testing**
   - [ ] Test project creation from external repo
   - [ ] Test project loading in external repo
   - [ ] Test simulator embedding
   - [ ] Test end-to-end workflow

## Next Steps

1. **Run the local demo** (see LOCAL_SETUP.md)
2. **Explore the codebase** to understand AVR8js integration
3. **Set up Next.js project** with TypeScript (or continue with current Vite setup)
4. **Configure Vercel** and database
5. **Start with Phase 0: API Foundation** (external repo integration)
6. **Then proceed to Phase 1** features

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AVR8js Repository](https://github.com/wokwi/avr8js)
- [Wokwi Elements](https://github.com/wokwi/wokwi-elements)
- [React Flow](https://reactflow.dev/)

