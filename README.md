# InterviewAI — Resume to Mock Interview Platform

A polished Generative AI interview-preparation application. A candidate uploads or pastes a resume and chooses between a **Mock Interview** and a **Question Bank with Answers**.

## Product flow

1. **Dashboard** — the first screen clearly asks what the candidate wants to do.
2. **Resume input** — upload PDF/TXT or paste resume text.
3. **Question generation** — AI creates exactly **20 resume-grounded questions**:
   - 8 Skill-based
   - 7 Project-based
   - 5 HR/behavioral
4. **Mock Interview** — candidate answers questions, receives AI feedback, and can receive contextual follow-ups.
5. **Question Bank** — the same 20 questions are presented with model answers, resume context, category filters, and MCQ answer explanations.
6. **Performance Analysis** — completed mock interviews receive overall, skill, project, and HR scores plus weak-area detection.
7. **History** — past mock interviews are stored and can be opened for detailed review.

Every secondary screen includes a clear back/navigation action.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide
- Backend: Node.js, Express, Prisma, PostgreSQL, Groq SDK
- AI: configurable Groq model

## Project structure

```text
restoint/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.js
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   └── package.json
└── docker-compose.yml
```

## Run with Docker (full frontend + backend + database)

1. Put your real Groq key in `backend/.env`.
2. Run:

```bash
docker compose up --build
```

3. Open `http://localhost:5173`.

The stack starts PostgreSQL, runs Prisma migrations in the backend container, builds the React frontend with Vite, and serves the production frontend through Nginx.

## Run locally

### 1. Configure backend

```bash
cd backend
cp .env.example .env
```

Set these values in `backend/.env`:

```env
GROQ_API_KEY=your_key
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resume_interview?schema=public
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

### 2. Start PostgreSQL

The easiest option is Docker:

```bash
docker compose up -d postgres
```

If you use the included Docker PostgreSQL configuration, use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resume_interview?schema=public
```

### 3. Start backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Backend health check:

```text
GET http://localhost:5000/api/health
```

### 4. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Optional frontend environment variable:

```env
VITE_API_URL=http://localhost:5000/api
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/upload` | Upload or paste resume |
| POST | `/api/generate` | Generate the exact 8/7/5 interview set |
| POST | `/api/generate/feedback` | Evaluate open-ended answer |
| POST | `/api/generate/mcq-answer` | Check MCQ answer |
| POST | `/api/generate/practice` | Generate targeted practice questions |
| GET | `/api/history` | List completed mock interviews |
| GET | `/api/history/:id` | Detailed performance review |

## Important

- Never put `GROQ_API_KEY` in frontend code.
- Do not commit a real `backend/.env` file.
- The included `backend/.env` is intentionally replaced with placeholders in the distributable project.
- The AI generation service validates the exact 20-question structure and retries once if the model returns an invalid structure.
