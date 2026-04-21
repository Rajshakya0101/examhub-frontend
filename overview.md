# Exam Platform – Project Overview

This document provides a concise, practical overview of the Exam Platform monorepo: tech stack, architecture, key features, core workflows, data model, and how to run and deploy.

## Tech Stack

- Frontend: Vite + React 18 + TypeScript
- UI: MUI v5, Tailwind CSS (layout/utility classes)
- State: TanStack React Query (server state) + Zustand (UI/app state)
- Routing: React Router v6
- Forms & Validation: React Hook Form + Zod
- Animations & Charts: Framer Motion, Recharts
- Internationalization: i18next + react-i18next
- Error & Analytics: Sentry (client), GA4 (optional)
- Backend: Firebase (Auth, Firestore, Storage, Cloud Functions)
- AI Services (Cloud Functions): OpenAI, Google Gemini
- Tooling: ESLint, TypeScript, Tailwind, Vite

## Repository Structure

```
exam-platform/
  apps/
    web/                     # React app (Vite + TS)
      src/
        lib/                 # Firebase, models, services, hooks, store
        components/          # UI & domain components
        routes/              # Route-level pages
        styles/              # Tailwind & global CSS
  firebase/
    firestore.rules          # Firestore security rules
    storage.rules            # Storage security rules
    functions/               # Cloud Functions (TypeScript)
      src/
        analytics/           # Aggregations, leaderboards
        exams/               # Generation & scoring
        jobs/                # Scheduled jobs (daily quiz)
        reports/             # PDF report generation
        services/            # AI service clients (OpenAI, Gemini)
        storage/             # Signed/upload URL helpers
        shared/              # Shared types/schemas
```

## High-Level Architecture

- Client (apps/web): SPA that authenticates with Firebase Auth and interacts with Firestore/Storage. React Query manages server-state. Zustand for local UI state. Tailwind + MUI for styling.
- Firebase (backend-as-a-service):
  - Auth: User authentication (e.g., Google provider)
  - Firestore: Primary data store for users, attempts, stats, leaderboards, achievements, notifications
  - Storage: File storage (e.g., avatars, PDFs)
  - Cloud Functions: Secure server-side logic for AI generation, analytics, scoring, leaderboards, PDF export, and scheduled jobs

## Key Features

- Daily Quiz (no login required)
- AI-generated mock tests and practice questions (MCQ)
- Real exam-like UI and flow
- Auto scoring with detailed analysis and PDF report
- Global/periodic leaderboards (global/weekly/monthly)
- User profiles with streaks, badges, achievements
- Notifications for achievements, streaks, ranks
- Study PDFs and resource support

## Core Workflows

### 1) Authentication & Profile
- Users sign in via Firebase Auth. Profile data and personalization are loaded from Firestore.
- Hooks/context in `src/lib` coordinate auth state and gate routes.

### 2) Take Test / Practice Flow
- Question generation: Client requests an AI-backed generation via Cloud Functions (e.g., `exams/generateQuiz.ts`, `exams/generateQuestions.ts`).
- Attempt lifecycle: Created in Firestore; answers saved incrementally; submission triggers scoring via Cloud Functions (`exams/scoreAttempt.ts`) or client helpers.
- Analysis: Analytics functions compute aggregates (`analytics/aggregateDailyStats.ts`, `analytics/analyzeAttempt.ts`).
- PDF Reports: `reports/generatePDF.ts` uses Puppeteer to create downloadable reports.

### 3) User Stats & Leaderboards
- User stats stored in `userStats` and updated after each submission from the client helper `firestore.ts`.
- Leaderboards maintained in collections like `leaderboard_global`, `leaderboard_weekly`, `leaderboard_monthly`.
- Backend support scripts (`analytics/updateLeaderboards.ts`, `analytics/recalculateLeaderboards.ts`) and client helpers compute ranks and entries.

### 4) Achievements, Streaks, Notifications
- Achievements and badges tracked in `userAchievements`.
- Streak tracking and milestone notifications are created into a `notifications` collection by client helpers or functions.

### 5) Daily Quiz & Scheduled Jobs
- `jobs/generateDailyQuiz.ts` prepares daily content (scheduled via Firebase scheduler/CRON when configured).

### 6) Storage & Uploads
- `storage/generateUploadUrl.ts` function creates signed URLs for secure uploads (e.g., avatars, attachments).

## Data Model (Selected Collections)

Note: Field shapes are summarized for orientation. See `apps/web/src/lib/firestore.ts` and `firebase/functions/src/shared/schema.ts` for source of truth.

- `userStats/{userId}`: totals, accuracy, streaks, per-test-type stats, timestamps
- `attempts/{attemptId}`: userId, test config, questions, answers, score breakdown, submittedAt
- `leaderboard_global/{userId}`: displayName, photoURL, totalScore, testsCompleted, accuracy, streaks, badges, rank, updatedAt
- `leaderboard_weekly/{weekId_userId}`: same shape + `weekId`
- `leaderboard_monthly/{monthId_userId}`: same shape + `monthId`
- `userAchievements/{userId}`: list of earned achievements, levels, points, lastUpdated
- `notifications/{notificationId}`: userId, type, title, message, read, createdAt, optional data extras

## Important Modules (Frontend)

- `src/lib/firebase.ts` / `firebase.fixed.ts`: Firebase initialization and environment wiring
- `src/lib/firestore.ts`: High-level Firestore operations (stats, leaderboards, achievements, notifications)
- `src/lib/firestoreAttempts.ts`: Attempt lifecycle helpers
- `src/lib/functions.ts`: Client helpers that call Cloud Functions
- `src/lib/auth*.tsx/ts`: Auth context and helpers
- `src/lib/i18n.ts`: i18next configuration
- `src/store/useStore.ts`: Zustand store for UI/app state

## Important Modules (Cloud Functions)

- `src/exams/*`: Generate quizzes/papers and score attempts (AI-assisted)
- `src/analytics/*`: Analyze attempts, aggregate stats, update/recalculate leaderboards
- `src/reports/generatePDF.ts`: Build PDF reports via Puppeteer
- `src/services/openai.ts` and `src/services/gemini.ts`: AI providers
- `src/jobs/generateDailyQuiz.ts`: Scheduled content
- `src/storage/generateUploadUrl.ts`: Signed upload URLs
- `src/shared/schema.ts`: Shared types and validation

## Local Development

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm i -g firebase-tools`)
- A Firebase project (credentials)

### Setup
```powershell
# From repo root
cd apps/web
npm install

# Copy and fill environment variables
copy .env.local.example .env.local  # if present
# Ensure VITE_ prefixed Firebase keys are set in .env.local
```

### Run Web App
```powershell
cd apps/web
npm run dev
# Visit http://localhost:3000 (Vite may choose 3001 if 3000 is used)
```

### Firebase Emulators (optional)
```powershell
# In repo root (requires firebase-tools)
firebase emulators:start
```

### Cloud Functions Dev
```powershell
cd firebase/functions
npm install
npm run build:watch
# In another terminal, run emulators or deploy functions as needed
```

## Deployment

- Web: Standard static build via Vite; host on Firebase Hosting or any static host.
```powershell
cd apps/web
npm run build
npm run preview  # local preview
```
- Firebase: Deploy security rules, indexes, hosting, and functions with Firebase CLI.
```powershell
# From repo root
firebase deploy            # everything (if configured)
firebase deploy --only functions
firebase deploy --only hosting
```

## Notable Design Decisions

- React Query is used for Firestore reads to standardize caching and background refresh.
- Zustand keeps local UI/app state minimal and predictable.
- Tailwind + MUI: Tailwind for rapid layout/spacing; MUI for accessible, themeable components.
- Leaderboards are maintained per scope (global/weekly/monthly) to enable time-bounded competition.
- Achievements and notifications help drive engagement (streaks, progress, improvements).
- AI generation is isolated to Cloud Functions to keep keys secure and logic centralized.

## Future Enhancements

- Per-topic mastery dashboards and adaptive practice
- Server-driven pagination for large leaderboards
- Richer proctoring/anti-cheat measures
- Offline/low-bandwidth modes
- More providers (email/password, OTP) and roles (admin tools)

---

For deeper implementation details, start with:
- Frontend: `apps/web/src/lib/firestore.ts`, `apps/web/src/lib/functions.ts`, `apps/web/src/routes/*`
- Backend: `firebase/functions/src/index.ts` and feature subfolders
