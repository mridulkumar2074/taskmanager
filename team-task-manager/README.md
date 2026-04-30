# 🧭 TeamTask — Full-Stack Team Task Manager

> A modern, beautifully designed full-stack team & project management app with role-based access, built with **Node.js · Express · React · Prisma · PostgreSQL**.

[Stack]()
[Deployed]()

TeamTask lets teams create projects, invite members, assign tasks with priorities & due dates, and track progress on a clean Kanban board — all wrapped in a polished blue-and-white interface.

---

## ✨ Features

### 🔐 Authentication & Access Control

- Email + password signup / login (bcrypt-hashed passwords, JWT auth)
- **Two role layers**:
  - **Global roles** — `ADMIN` (workspace-wide) / `MEMBER`
  - **Project roles** — `OWNER` / `ADMIN` / `MEMBER`
- The first registered user is automatically promoted to global Admin to bootstrap the system.

### 📁 Projects & Teams

- Create / edit / delete projects (only owners or global admins can delete)
- Add team members by email with project-level roles
- Promote / demote / remove members (project admins only)

### ✅ Tasks

- Full CRUD with **status** (To do / In progress / Done), **priority** (Low / Medium / High), **assignee**, **due date**
- Beautiful Kanban-style board with quick status transitions
- Filters: assignee (mine / unassigned), priority
- Per-task permissions: project admins or task assignees can edit

### 📊 Dashboard

- At-a-glance stats: projects, total tasks, in progress, done, **overdue**
- "My open tasks" panel sorted by due date
- Recent activity feed
- Beautiful gradient stat cards

### 🎨 UI / UX

- Clean **blue & white** theme with subtle gradients
- Responsive layout (mobile, tablet, desktop)
- Custom Tailwind design system (colors, shadows, animations)
- Animated modals, hover states, status pills, avatars
- Toast notifications for every action

---

## 🏗️ Tech Stack


| Layer      | Technology                                                                |
| ---------- | ------------------------------------------------------------------------- |
| Frontend   | React 18 · Vite · React Router 6 · Tailwind CSS · Axios · react-hot-toast |
| Backend    | Node.js · Express 4 · express-validator · Morgan · CORS                   |
| Database   | **PostgreSQL** (SQL) accessed via **Prisma ORM**                          |
| Auth       | JWT (jsonwebtoken) · bcryptjs                                             |
| Deployment | **Railway** (single service, monorepo)                                    |


> Note: The original brief said "MERN stack". We've swapped MongoDB for **PostgreSQL** as requested ("for DB use SQL"). Everything else remains MERN-style: Express + React + Node.

---

## 📂 Project Structure

```
team-task-manager/
├── backend/                  # Express API
│   ├── prisma/
│   │   └── schema.prisma     # Data model (PostgreSQL)
│   ├── src/
│   │   ├── controllers/      # Auth, Project, Task, User, Dashboard
│   │   ├── middleware/       # Auth, validation
│   │   ├── routes/           # REST routes
│   │   ├── utils/            # Prisma client, JWT helpers
│   │   └── server.js         # Express app entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/                 # React SPA
│   ├── public/
│   ├── src/
│   │   ├── api/              # axios client
│   │   ├── components/       # Layout, Modal, StatCard, Badge, Logo
│   │   ├── context/          # AuthContext
│   │   ├── pages/            # Landing, Login, Signup, Dashboard,
│   │   │                     # Projects, ProjectDetail, Profile, AdminUsers
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css         # Tailwind + custom design tokens
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── package.json              # Root scripts (build/start)
├── railway.json              # Railway deploy config
├── nixpacks.toml             # Build config for Railway
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 14+** running locally — or any Postgres connection string (Supabase, Neon, Railway, etc.)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd team-task-manager
npm run install:all
```

### 2. Configure backend env

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/team_task_manager?schema=public"
JWT_SECRET="some-long-random-string-please-change"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

### 3. Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
cd ..
```

This creates all tables and generates the Prisma client.

### 4. Start dev servers (two terminals)

```bash
# Terminal 1 — API on :4000
npm run dev:backend

# Terminal 2 — Vite dev server on :5173 (proxies /api to :4000)
npm run dev:frontend
```

Open **[http://localhost:5173](http://localhost:5173)** 🎉

The first user you sign up will automatically become a global **Admin**.

---

## 🌐 Deploying to Railway

Railway runs the whole stack as **one service** (Node + static React build) backed by a managed Postgres add-on.

### Step-by-step

1. **Push** this repo to GitHub.
2. Sign in at [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. After the first build, click **+ New** → **Database** → **Add PostgreSQL**.
4. Open your **service variables** and confirm `DATABASE_URL` is auto-populated. Add:
  - `JWT_SECRET` — long random string (`openssl rand -base64 48`)
  - `NODE_ENV=production`
  - `CORS_ORIGIN=*` (or your domain)
5. Railway will detect the `nixpacks.toml` / `railway.json` and:
  - Install backend + frontend deps
  - Build the React app
  - Generate the Prisma client
  - **Run `prisma migrate deploy`** to set up tables
  - Start `node src/server.js`
6. The Express server serves both the API at `/api/*` and the React build at `/`.
7. Click **Generate Domain** on the service → your live URL.

> 💡 The build is single-service: no separate front-end host needed. Just visit the Railway-issued URL.

---

## 🧠 Database Schema

```prisma
User { id, name, email (unique), password, role: GlobalRole }
Project { id, name, description, ownerId → User }
ProjectMember { projectId, userId, role: ProjectRole }  // composite unique
Task { id, title, description, status, priority, dueDate,
       projectId, creatorId, assigneeId }
```

- **Cascading deletes**: deleting a project removes its members & tasks.
- **Validations** (Express): email format, password ≥ 6 chars, name length, ISO dates, enum values.
- **Relationships**: 1:N (User → Tasks created), N:M (User ↔ Project via ProjectMember).

---

## 🔌 REST API

All routes prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth


| Method | Path           | Description                               |
| ------ | -------------- | ----------------------------------------- |
| POST   | `/auth/signup` | Create account (first user becomes admin) |
| POST   | `/auth/login`  | Returns `{ token, user }`                 |
| GET    | `/auth/me`     | Current user from token                   |


### Projects


| Method | Path                            | Notes                                    |
| ------ | ------------------------------- | ---------------------------------------- |
| GET    | `/projects`                     | List projects you can see                |
| POST   | `/projects`                     | Create project (you become owner)        |
| GET    | `/projects/:id`                 | Project details + members                |
| PUT    | `/projects/:id`                 | Update name/description (project admin+) |
| DELETE | `/projects/:id`                 | Delete (owner or global admin only)      |
| POST   | `/projects/:id/members`         | Add member by email                      |
| PUT    | `/projects/:id/members/:userId` | Change member role                       |
| DELETE | `/projects/:id/members/:userId` | Remove member                            |


### Tasks


| Method | Path                  | Notes                                      |
| ------ | --------------------- | ------------------------------------------ |
| GET    | `/projects/:id/tasks` | List tasks in project                      |
| POST   | `/projects/:id/tasks` | Create task                                |
| GET    | `/tasks/:id`          | Get task                                   |
| PUT    | `/tasks/:id`          | Update (assignee/creator or project admin) |
| DELETE | `/tasks/:id`          | Delete (creator or project admin)          |


### Users (admin)


| Method | Path              | Notes                                                                                                       |
| ------ | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| GET    | `/users?q=`       | Search users (auth required)                                                                                |
| PUT    | `/users/:id/role` | Promote/demote (global admin only)                                                                          |
| DELETE | `/users/:id`      | Delete user — cascades owned projects, unassigns tasks (global admin only; can't delete self or last admin) |


### Dashboard


| Method | Path         |                                    |
| ------ | ------------ | ---------------------------------- |
| GET    | `/dashboard` | Stats + my tasks + recent activity |


---

## 🛡️ Security Notes

- Passwords hashed with **bcrypt** (10 rounds).
- JWTs signed with `JWT_SECRET`, default 7-day expiry.
- Role checks on every mutating route; unauthorized requests return **401 / 403**.
- Input validation on every endpoint via `express-validator`.
- Cascading FK deletes prevent orphan rows.

---

## 🎬 Demo Video

Record a 2-5 minute walkthrough showing:

1. Sign up (first user becomes admin)
2. Create a project
3. Add a member by email
4. Create / drag tasks across statuses
5. Filter by assignee / priority
6. Show overdue tasks on dashboard
7. Admin user management page

---

## 📦 Submission Checklist

- ✅ Live URL (Railway)
- ✅ GitHub repo
- ✅ README (this file)
- ✅ 2-5 min demo video

---

## 📜 License

MIT — feel free to use this as a starter for your own task-management apps.







