# ACEout — Virtual Lab System

A virtual science lab where **teachers unlock experiments as the syllabus progresses** and
**students run them on an interactive bench**. Work is auto-scored on submission and surfaced
back to the teacher as a ranked list, with a full drill-down into any individual student.

## The flow

1. A **teacher** owns one or more classes. Students join with a class code.
2. The teacher **unlocks labs one at a time**, each with a due date. Locked labs are invisible
   and unreachable to students — enforced server-side, not just hidden in the UI.
3. A **student** opens an unlocked lab, takes readings on the virtual bench, and answers the
   lab quiz. The quiz is graded on the server; the answer key never reaches the browser.
4. On submission the attempt is **auto-scored out of 100**.
5. The teacher sees a **ranked leaderboard** (overall, or per lab), and can open any student to
   read their actual readings and quiz answers, then **override the mark** with a remark.

## Scoring

| Component    | Weight | Basis                                            |
| ------------ | -----: | ------------------------------------------------ |
| Quiz         |     50 | fraction of quiz questions correct               |
| Observations |     30 | readings logged vs. the lab's required count     |
| Completion   |     20 | awarded once the attempt is submitted            |
| Late penalty |    −10 | submitted after the due date                     |

A teacher override replaces the auto-score entirely; the original stays visible for reference.
Ties in the ranking break on labs completed, then on who submitted earlier.

## Stack

- **apps/client** — React 19 + Vite. One app, role-routed: teachers get the teacher portal,
  students get the lab app.
- **apps/backend** — Express + Prisma 6 + PostgreSQL. JWT auth with bcrypt-hashed passwords.

## Setup

Requires Node 20+ and a running PostgreSQL.

```bash
npm install
```

Create the database and point the backend at it:

```bash
createdb aceout_lab
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and set `DATABASE_URL`. On a local
Postgres using peer auth over the unix socket, this works as-is:

```
DATABASE_URL="postgresql://YOUR_USER@localhost/aceout_lab?host=/var/run/postgresql&schema=public"
```

Run the migration and seed the demo data:

```bash
npm run db:migrate --workspace backend
```

```bash
npm run db:seed --workspace backend
```

Start both apps:

```bash
npm run dev
```

Client on http://localhost:5173, API on http://localhost:5000.

## Demo accounts

| Role    | Email                  | Password     |
| ------- | ---------------------- | ------------ |
| Teacher | `teacher@aceout.dev`   | `teacher123` |
| Student | `student1@aceout.dev`  | `student123` |

`student1` … `student8` all exist with the same password, with deliberately varied performance
so the rankings are populated on first load. Join codes: `PHY10A`, `PHY10B`.

The seed unlocks 3 of 6 labs for Class 10-A — two past their due date (ready to review) and one
still open — leaving 3 locked so you can demo unlocking live.

To reset back to that state at any point:

```bash
npm run db:reset --workspace backend
```

## Data model

`User` (role: STUDENT/TEACHER/ADMIN) · `Class` · `Enrollment` · `Lab` · `QuizQuestion` ·
`LabUnlock` (class × lab, with `dueAt`) · `LabAttempt` (student × lab × class, holds the scores) ·
`Observation` · `QuizResponse`.

Locking a lab sets `closedAt` rather than deleting the row, so submitted work and unlock history
survive a re-lock.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` · `/api/auth/login` | Auth, returns JWT |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/teacher/classes` | List / create classes |
| GET | `/api/teacher/classes/:id/labs` | All labs + unlock state + progress |
| POST/DELETE | `/api/teacher/classes/:id/labs/:labId/unlock` | Unlock / lock a lab |
| GET | `/api/teacher/classes/:id/rankings?labId=` | Ranked list, overall or per lab |
| GET | `/api/teacher/classes/:id/students/:studentId` | Full student report |
| PATCH | `/api/teacher/attempts/:id/grade` | Override score + remark |
| GET | `/api/student/labs` | **Only** labs unlocked for the student's class |
| POST | `/api/student/labs/:labId/start` · `/observations` · `/quiz` · `/submit` | Attempt lifecycle |
| GET | `/api/student/results` | The student's own marks and remarks |

Teacher routes require the `TEACHER` role; student routes require `STUDENT`. A student calling a
teacher route gets 403, and a locked lab returns 403 on every student endpoint.
