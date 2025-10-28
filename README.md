# Exam Platform

A production-grade, responsive SPA for competitive exam preparation with AI-generated practice questions.

## Features

- Daily Quiz (no login required)
- AI-generated Mock Tests and Practice Questions (MCQ only)
- Real exam UI (SSC/Banking style)
- Auto-scoring & Analysis with Report PDF
- Leaderboards (Global + Friends)
- Study PDFs
- User Profile (avatar, streaks, badges)

## Tech Stack

- **Frontend**: Vite + React 19 + TypeScript
- **UI**: MUI v6 + Tailwind CSS (for layout/spacing)
- **State Management**: React Query (Firestore), Zustand (UI state)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Internationalization**: react-i18next
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI Integration**: OpenAI API + Embeddings (Pinecone/Vertex AI)
- **Analytics**: GA4 + Sentry

## Development

### Prerequisites

- Node.js v18+
- Firebase CLI
- Git

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/exam-platform.git
   cd exam-platform
   ```

2. Install dependencies
   ```bash
   cd apps/web
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase and API credentials
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google provider)
3. Create a Firestore database with the collections as specified in the data model
4. Set up Firebase Storage
5. Set up Firebase Functions

## Deployment

The project is configured for deployment via GitHub Actions:

1. Set up repository secrets for GitHub Actions
2. Push changes to main branch
3. GitHub Actions will automatically build and deploy

## Project Structure

```
exam-platform/
  apps/
    web/           # Frontend application (Vite + React)
  firebase/
    firestore.rules
    storage.rules
    functions/     # Firebase Cloud Functions
  infra/
    github-actions/ # Deployment workflows
```

## License

MIT