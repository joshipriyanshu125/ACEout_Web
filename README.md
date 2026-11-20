# ACEout — Virtual Lab System

Students run NCERT experiments on a phone; the school assigns those labs, follows who has
done what, and runs quizzes from a web admin panel.

```
 MOBILE APP (apps/ACEout/app)                          WEB ADMIN (apps/administrator)
 ├─ Guest mode ── subjects → chapters → labs           ├─ Dashboard
 └─ School/College mode                                ├─ Classes → section → student
     ├─ Dashboard: covered / not covered, marks  ◄──── ├─ Labs → assign · lab report
     ├─ Assigned labs → bench (+ AI assistant)         └─ Quizzes → builder · live host · results
     ├─ Post-lab quiz → submit  ──── lab recorded ───►
     └─ Join live quiz (6-digit code) ◄──── hosted ────
                        both talk to apps/backend (Express + Prisma + PostgreSQL)
```

## Apps

| Path | What | Dev URL |
| --- | --- | --- |
| `apps/backend` | Express + Prisma 6 + PostgreSQL, JWT auth | http://localhost:5000 |
| `apps/administrator` | Admin panel, React 19 + Vite (the "Admin Panel.html" design) | http://localhost:5174 |
| `apps/ACEout/app` | Expo SDK 57 student app (the lab benches) | `npm start` inside it |
| `apps/ACEout/server` | Voice-assistant proxy for the app's "Ask AI" | http://localhost:3000 |

## Setup

Requires Node 20+ and PostgreSQL.

```bash
npm install
createdb aceout_lab
cp apps/backend/.env.example apps/backend/.env      # set DATABASE_URL
npm run db:migrate --workspace backend              # or: npx prisma migrate deploy
npm run db:seed --workspace backend
npm run dev                                         # backend + admin panel
```

The phone app runs separately: `cd apps/ACEout/app && npm start`. Point it at the API with
`EXPO_PUBLIC_LAB_API_URL` in `apps/ACEout/app/.env` (see `.env.example`: `http://10.0.2.2:5000`
on the Android emulator, `http://<your-LAN-IP>:5000` on a real phone). The admin panel reads
`VITE_API_URL` (default `http://localhost:5000/api`).

## Demo accounts (from the seed)

| Who | Login | Password |
| --- | --- | --- |
| School admin | `admin@aceout.dev` | `admin123` |
| Principal (read-only) | `principal@aceout.dev` | `principal123` |
| Teacher (own sections only) | `iyer@aceout.dev` | `teacher123` |
| Student, Class 11 · A (app) | `student@aceout.dev` | `student123` |
| Other students | `s11a02@aceout.dev` … `s12c10@aceout.dev` | `student123` |

Class join codes for new students in the app: `ACE10A` … `ACE12C`.

The seed has 3 grades × 3 sections × 10 students, the six labs that exist in the app
(`incline-work-energy`, `gravity-launch`, `acid-base-indicators`, `ph-determination`,
`plant-physiology`, `eye-defects`), a 5-question post-lab quiz for each, three live quizzes
(one already run), and realistic attempts. Class 10 has nothing assigned so you can demo assigning.

## How the pieces connect

- **Assign** (web): an `Assignment` row per section × lab, with due date, hint level
  (Guided / Standard / Exam — Exam hides the in-lab AI assistant), whether the post-lab quiz is
  attached, and whether offline completion is allowed.
- **Complete** (app): the bench's readings, precision/fault telemetry from `ReadingInput`, and the
  post-lab quiz answers go to `POST /api/student/labs/:labId/complete` in one call. The quiz is
  graded on the server; the key never reaches the phone. Offline, the app queues the submission
  and syncs it later (a retry gets 409 and is treated as done).
- **Review** (web): class/section/student views, the lab report (status, precision, faults,
  "where students slipped"), and per-attempt mark override with a remark the student sees.
- **Live quiz**: the teacher hosts from the web; students join in the app with the code. Both sides
  poll the session; a question auto-reveals when time runs out or everyone has answered.

### Scoring (per lab, out of 100)

| Component | Weight | Basis |
| --- | ---: | --- |
| Post-lab quiz | 50 | fraction correct |
| Observations | 30 | readings logged vs. the lab's required count |
| Completion | 20 | submitted |
| Late penalty | −10 | submitted after the due date |

Without an attached quiz, observations and completion are scaled to 100. A teacher override
replaces the auto mark; the original stays visible.

## Roles

`ADMIN` and `PRINCIPAL` see the whole school (principal is read-only); `TEACHER` sees the sections
they teach; `STUDENT` uses the app only. Staff accounts are created by the school (seed); students
self-register in the app with a class code.

## API

- `/api/auth` — `login`, `register` (students, needs class code), `me`
- `/api/admin` — `dashboard`, `classes`, `classes/:grade`, `sections/:classId`, `students/:id`,
  `attempts/:id/grade`, `labs`, `labs/:labId/report`, `assignments`, `quizzes` (CRUD, `results`,
  `send-reports`, `sessions`), `sessions/:id` (+ `start|reveal|next|end`), `options`
- `/api/student` — `dashboard`, `labs`, `labs/:labId/complete`, `live/join`, `live/:id`, `live/:id/answer`

Route files in `apps/backend/src/routes/` are the reference for request/response shapes.
