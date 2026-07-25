# Mini Content Engine

A full-stack AI content generation platform that transforms product details into professional marketing images. Built as a production-ready TypeScript monorepo demonstrating clean architecture, async job processing, and modern frontend design.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [How to Run](#how-to-run)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)

---

## Overview

Mini Content Engine accepts a product name, description, and reference image URL. It uses the **Google Gemini API** to craft a tailored Stable Diffusion prompt, then passes it to an image generation service to produce a professional product photograph.

The API is **non-blocking** — the endpoint responds immediately with a `jobId`, and processing continues in the background. The React frontend polls for status every 3 seconds and displays the result as soon as it is ready.

**Key engineering highlights:**

- Async fire-and-forget job pipeline with PostgreSQL-backed state machine
- Clean MVC architecture with strict layer separation (routes → controllers → services → DB)
- Type-safe across the entire stack — shared TypeScript interfaces on both sides
- Production-ready Express server with Helmet, CORS, Morgan, graceful shutdown, and fail-fast env validation
- Modern SaaS dashboard UI built with React, Tailwind CSS, and Vite

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | HTTP server and REST API |
| **TypeScript** | Type safety across the entire backend |
| **Prisma ORM** | Type-safe PostgreSQL access with migrations |
| **PostgreSQL** | Persistent job storage |
| **Google Gemini API** (`gemini-1.5-flash`) | AI prompt generation |
| **Helmet** | HTTP security headers |
| **Morgan** | Request logging (dev/combined format) |
| **dotenv** | Environment variable management |
| **nodemon + ts-node** | Hot-reload development server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI component library |
| **TypeScript** | Type-safe components and API calls |
| **Vite** | Fast dev server and bundler |
| **Tailwind CSS** | Utility-first styling |
| **Axios** | HTTP client with interceptors |
| **React Router v6** | Client-side routing |

---

## Architecture

### Request Lifecycle

```
POST /api/jobs/generate
        │
        ▼
  Input validation          ← controller layer
        │
        ▼
  Create Job (status: pending)   ← job.service → PostgreSQL
        │
        ▼
  201 { jobId }             ← response sent immediately (non-blocking)
        │
        ▼ (background, void — does not affect HTTP response)
  job.processor.ts
  ┌─────────────────────────────────────────────────┐
  │  setJobProcessing()  → status: processing        │
  │  generatePrompt()    → Gemini API                │
  │  generateImage()     → image generator service   │
  │  setJobCompleted()   → status: completed         │
  │                         generatedPrompt saved     │
  │                         resultImage saved         │
  │                                                   │
  │  on any error:                                    │
  │  setJobFailed()      → status: failed            │
  └─────────────────────────────────────────────────┘
```

### Job State Machine

```
  [pending] → [processing] → [completed]
                    │
                    └──────────→ [failed]
```

Each state transition is a single atomic DB write. The row is never left in a partially-complete state.

### Frontend Polling Architecture

```
Home (owns jobIds[])
  └── JobList
        └── JobListItem (one per job — isolated setInterval)
              └── useJobPolling → GET /api/jobs/:id every 3s
                    │  stops automatically at completed | failed
                    └── JobCard (re-renders on each poll)
```

No WebSockets. No server-sent events. Pure HTTP polling with automatic cleanup.

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `routes/` | URL-to-controller mapping only. No logic. |
| `controllers/` | Parse request, validate input, send response. No DB access. |
| `services/` | Business logic and DB operations. No HTTP concepts. |
| `job.processor.ts` | Async pipeline orchestrator. Never throws to caller. |
| `middleware/` | Error handling, logging, 404, request validation. |
| `utils/` | Env validation, Prisma singleton, HttpError, asyncHandler. |
| `types/` | Shared TypeScript interfaces. No runtime code. |

---

## Folder Structure

```
mini-content-engine/
├── package.json                    ← npm workspaces root
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           ← database schema + enum definitions
│   │   └── migrations/             ← SQL migration files
│   │
│   ├── src/
│   │   ├── index.ts                ← server entry point, graceful shutdown
│   │   ├── app.ts                  ← Express app, middleware stack
│   │   │
│   │   ├── controllers/
│   │   │   ├── health.controller.ts
│   │   │   └── job.controller.ts   ← generate, getJob
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts            ← root router, mounts sub-routers
│   │   │   ├── health.routes.ts
│   │   │   └── job.routes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── job.service.ts      ← DB operations (CRUD + state transitions)
│   │   │   ├── job.processor.ts    ← async pipeline orchestrator
│   │   │   ├── gemini.service.ts   ← Gemini API integration
│   │   │   └── imageGenerator.service.ts  ← image generation (mock/real)
│   │   │
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts     ← global error handler
│   │   │   ├── notFound.ts         ← 404 catch-all
│   │   │   └── requestLogger.ts    ← Morgan logger
│   │   │
│   │   ├── utils/
│   │   │   ├── env.ts              ← fail-fast env validation
│   │   │   ├── prisma.ts           ← singleton client + connect/disconnect
│   │   │   ├── httpError.ts        ← HttpError class + factory functions
│   │   │   └── asyncHandler.ts     ← wraps async handlers, forwards errors
│   │   │
│   │   └── types/
│   │       └── index.ts            ← all shared TypeScript interfaces
│   │
│   ├── .env.example
│   ├── nodemon.json
│   ├── tsconfig.json
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.tsx                ← React entry point
    │   ├── App.tsx                 ← router setup
    │   ├── index.css               ← Tailwind directives + component classes
    │   │
    │   ├── pages/
    │   │   └── Home.tsx            ← page layout, owns jobIds state
    │   │
    │   ├── components/
    │   │   ├── ProductForm.tsx     ← controlled form, validation, success banner
    │   │   ├── JobList.tsx         ← maps jobIds → isolated polling per item
    │   │   └── JobCard.tsx         ← status badge, spinner, image preview
    │   │
    │   ├── hooks/
    │   │   ├── useGenerateJob.ts   ← POST /generate, loading + error state
    │   │   └── useJobPolling.ts    ← GET /jobs/:id polling, auto-stop
    │   │
    │   ├── api/
    │   │   └── jobs.api.ts         ← typed Axios calls
    │   │
    │   ├── lib/
    │   │   └── axios.ts            ← configured Axios instance
    │   │
    │   └── types/
    │       └── index.ts            ← frontend type definitions
    │
    ├── vite.config.ts              ← dev proxy: /api → localhost:3000
    ├── tailwind.config.js
    ├── tsconfig.json
    └── package.json
```

---

## API Endpoints

### `GET /api/health`

Server liveness check.

**Response `200`**
```json
{
  "success": true,
  "message": "Server Running"
}
```

---

### `POST /api/jobs/generate`

Create a new image generation job. Returns immediately — processing continues in the background.

**Request Body**
```json
{
  "productName": "Wireless Headphones",
  "description": "Over-ear noise-cancelling headphones in matte black",
  "referenceImage": "https://example.com/headphones.jpg"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `productName` | string | ✓ | Name of the product |
| `description` | string | ✓ | Product description used to craft the AI prompt |
| `referenceImage` | string | ✓ | URL to a reference image for style guidance |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "jobId": "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
  }
}
```

**Error `400`** — missing or empty field
```json
{
  "success": false,
  "error": {
    "message": "productName is required and cannot be empty.",
    "code": "MISSING_PRODUCT_NAME"
  }
}
```

---

### `GET /api/jobs/:id`

Poll the current state of a job. Call this repeatedly until `status` is `completed` or `failed`.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "productName": "Wireless Headphones",
    "status": "completed",
    "generatedPrompt": "Professional product photography of wireless headphones...",
    "resultImage": "https://placehold.co/800x600/0f172a/e2e8f0?text=...",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:07.000Z"
  }
}
```

| `status` | Meaning |
|---|---|
| `pending` | Job created, pipeline not yet started |
| `processing` | Gemini called, image generation in progress |
| `completed` | `generatedPrompt` and `resultImage` are populated |
| `failed` | An error occurred — safe to retry |

**Error `404`** — job not found
```json
{
  "success": false,
  "error": {
    "message": "Job with id \"abc\" not found",
    "code": "JOB_NOT_FOUND"
  }
}
```

---

## Database Schema

```prisma
enum JobStatus {
  pending
  processing
  completed
  failed
}

model Job {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productName      String
  description      String
  referenceImage   String?
  generatedPrompt  String?
  status           JobStatus @default(pending)
  resultImage      String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([status])
  @@index([createdAt])
  @@map("jobs")
}
```

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Port the Express server listens on |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed origin for CORS |
| `GEMINI_API_KEY` | **Yes** | — | Google AI Studio API key |

**`backend/.env` example:**
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/mini_content_engine?schema=public"
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

---

## How to Run

### Prerequisites

- Node.js >= 18
- PostgreSQL running locally (or a cloud instance)
- A Gemini API key

### 1. Install dependencies

```bash
# From the monorepo root
npm install --workspaces
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL and GEMINI_API_KEY
```

### 3. Run database migrations

```bash
cd backend
npx prisma migrate dev
```

### 4. Start the backend

```bash
cd backend
npm run dev
# Server running on http://localhost:3000
```

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:3000` — no manual CORS configuration needed in development.

### Available backend scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## Deployment

### Backend

The backend compiles to plain JavaScript. Deploy to any Node.js host.

```bash
# Build
cd backend
npm run build

# Run in production
NODE_ENV=production node dist/index.js
```

**Recommended platforms:** Railway, Render, Fly.io, AWS EC2, Google Cloud Run

**Required in production environment:**
- `DATABASE_URL` — connection string to a managed PostgreSQL instance (Supabase, Neon, RDS)
- `GEMINI_API_KEY` — Google AI Studio key
- `CORS_ORIGIN` — your frontend's public URL
- `NODE_ENV=production`

### Frontend

```bash
cd frontend
npm run build
# Output in frontend/dist/ — deploy as static files
```

**Recommended platforms:** Vercel, Netlify, Cloudflare Pages

Set the `VITE_API_BASE_URL` if your backend is on a different domain, and update `vite.config.ts` accordingly.

### Docker (optional)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## Future Improvements

### Image Generation
- **Integrate ComfyUI** — replace `imageGenerator.service.ts` mock with a real ComfyUI workflow. The service interface (`ImageGenerationInput` → `ImageGenerationResult`) is already designed for this swap
- **Stable Diffusion via Replicate or Hugging Face** — alternative provider with zero infrastructure

### Job Queue
- **BullMQ + Redis** — replace in-process `void processJob()` with a durable queue. Jobs survive server restarts and can be distributed across workers
- **Job retry logic** — automatic retry with exponential backoff on transient failures
- **Concurrency control** — limit simultaneous Gemini/image generation calls

### Storage
- **Cloud image storage** — upload generated images to S3, GCS, or Cloudinary instead of returning placeholder URLs
- **CDN delivery** — serve images via CDN for low-latency global access

### API & Auth
- **API key authentication** — protect endpoints for multi-tenant use
- **Rate limiting** — per-user request throttling with Redis
- **Webhook support** — notify clients on job completion instead of relying on polling

### Observability
- **Structured logging** — replace `console.log` with Pino or Winston for JSON log output
- **OpenTelemetry tracing** — distributed tracing across the request/job lifecycle
- **Health check v2** — deep health check with DB ping, queue status, and Gemini API reachability

### Developer Experience
- **Unit and integration tests** — Jest + Supertest for the API, Vitest + React Testing Library for the frontend
- **CI/CD pipeline** — GitHub Actions: lint, type-check, test, build on every PR
- **Environment validation** — Zod schema for all env vars instead of manual checks

---

## Author

Built as an SDE Internship assignment demonstrating full-stack TypeScript development with clean architecture, async patterns, and production engineering practices.
