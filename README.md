# Task Management App

A full-stack task manager. The backend is a Node.js + Express + Prisma API backed by Postgres; the frontend is a React + Vite single-page app.

## Live demo

- **App**: https://task-management-app-one-phi.vercel.app
- **API**: https://task-management-api-wif5.onrender.com
- **API docs**: https://task-management-api-wif5.onrender.com/api-docs

The backend runs on Render's free tier, so the first request after ~15 minutes of idle may take ~30 seconds to wake up.

## Features

- Create, edit, and delete tasks
- Toggle completion
- Filter by All / Active / Completed
- Search and sort
- Loading and error states throughout

## Tech stack

- **Frontend**: React 19, Vite, Axios
- **Backend**: Node 22, Express 5, Prisma 6, PostgreSQL
- **Hosting**: Vercel (frontend) and Render (backend + Postgres)

## Run it locally

You need Node 22+ and a local Postgres instance.

### 1. Clone

```bash
git clone https://github.com/Senaye2003/task-management-app.git
cd task-management-app
```

### 2. Backend

```bash
cd task-api-backend
cp .env.example .env
# Edit .env: set DATABASE_URL to your local Postgres connection string
npm install
npx prisma migrate dev
npm run seed       # optional — adds three sample tasks
npm run dev
```

The API runs at http://localhost:3000.

### 3. Frontend (in a separate terminal)

```bash
cd task-api-frontend
cp .env.example .env   # VITE_API_URL defaults to http://localhost:3000
npm install
npm run dev
```

The app opens at http://localhost:5173.

## API endpoints

| Method | Path           | Purpose                               |
| ------ | -------------- | ------------------------------------- |
| GET    | `/tasks`       | List all tasks                        |
| POST   | `/tasks`       | Create a task `{ title, completed? }` |
| GET    | `/tasks/:id`   | Get one task                          |
| PATCH  | `/tasks/:id`   | Update title and/or `completed`       |
| DELETE | `/tasks/:id`   | Delete a task                         |
| GET    | `/health`      | Health check                          |
| GET    | `/api-docs`    | Swagger UI                            |

## Project structure

```
task-management-app/
├── task-api-backend/   Express API + Prisma schema and migrations
├── task-api-frontend/  React SPA (Vite)
├── render.yaml         Render Blueprint (Postgres + web service)
├── DEPLOY.md           Step-by-step deploy guide
└── CODE_REVIEW.md      Code review notes
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the Render + Vercel walkthrough.

## Author

**Senaye Weldeberhan** — [@Senaye2003](https://github.com/Senaye2003)
