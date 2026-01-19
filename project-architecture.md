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