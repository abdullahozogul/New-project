# Colingual

Colingual is a React and Vite web app for level-based language learning. The current MVP includes learner setup, CEFR-level news reading, browser text-to-speech listening, vocabulary saving, chat-style writing practice, and progress panels.

**Live news:** On dev (`npm run dev`), the app fetches real headlines (Google News RSS via `/api/news/headlines`), then uses Gemini to build the **same story** at A1–C1. Use the refresh control in the reading queue for a new headline; seen stories are skipped so content stays fresh. Optional: `NEWS_SOURCE_API_KEY` (GNews) or `VITE_NEWS_SOURCE_ENDPOINT` for your own feed. Operator script: `python scraping/news_rss.py`.

**Inspired integrations (patterns, not full forks):**

| Project | Role in Colingual |
| --- | --- |
| [ClassroomIO](https://github.com/classroomio/classroomio) | Course units & lessons in **İlerleme** (`src/config/classroomCourses.ts`) |
| [ScholarShelf](https://github.com/AminaAsif9/ScholarShelf) | Personal story shelf + coach context (`src/lib/scholarShelf.ts`, `#library`) |
| [CEFR-SP](https://github.com/yukiar/CEFR-SP) | Sentence-difficulty heuristic for level hints (`src/lib/cefrAssess.ts`) |
| [CEFR Classifier French](https://github.com/JonathanStefanov/CEFR_Classifier_French) | Dev assess API `/api/cefr/assess` (heuristic; swap for a trained model later) |
| [language-lesson-chat](https://github.com/brylie/language-lesson-chat) | Scenario lessons in **Pratik** (`#scenarios`) — coach stays in context |
| [AI Study Material Generator](https://github.com/Adiaparmar/AI-Study-Material-Generator) | Gemini study sheets (`#study-material`, `src/lib/aiEducation.ts`) |
| [Automated Course Content Generator](https://github.com/pramodkoujalagi/Automated-Course-Content-Generator) | AI course outline + quiz in **İlerleme** (`#course-ai`) |
| [language-learning-apps](https://github.com/bj36272/language-learning-apps) · [ai-education](https://github.com/topics/ai-education) | Ecosystem positioning panel (`#ecosystem`) |

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
# Chat coach: uses Google Gemini **gemini-2.5-flash** by default.
# Local dev proxy/server key; do not prefix secrets with VITE_:
AI_ASSISTANT_API_KEY=
# Optional override of model id (default: gemini-2.5-flash)
VITE_GEMINI_MODEL=
# Production: your backend POST endpoint; request body includes `model`, `systemInstruction`, `contents`
VITE_AI_ASSISTANT_ENDPOINT=
VITE_TTS_ENDPOINT=
SUPABASE_SERVICE_ROLE_KEY=
NEWS_SOURCE_API_KEY=
TTS_API_KEY=
```

Only variables prefixed with `VITE_` are exposed to browser code. Call Gemini from a server or edge function and point `VITE_AI_ASSISTANT_ENDPOINT` at it; keep API keys out of the client bundle.
