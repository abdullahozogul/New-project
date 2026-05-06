# Colingual

Colingual is a React and Vite web app for level-based language learning. The current MVP includes learner setup, CEFR-level news reading, browser text-to-speech listening, vocabulary saving, chat-style writing practice, and progress panels.

## Setup

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment

API keys and secrets live in `.env.local`. The app can run without them using seed content. Add these when the backend services are ready:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_NEWS_SOURCE_ENDPOINT=
VITE_AI_ASSISTANT_ENDPOINT=
VITE_TTS_ENDPOINT=
SUPABASE_SERVICE_ROLE_KEY=
NEWS_SOURCE_API_KEY=
AI_ASSISTANT_API_KEY=
TTS_API_KEY=
```

Only variables prefixed with `VITE_` are exposed to browser code.
