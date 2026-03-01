# Task Hub

Role-based task management: users create tasks, admins manage all tasks. Built with Next.js (App Router), MongoDB (Mongoose), JWT in HTTP-only cookies, and Tailwind CSS.

## Features

- **Auth:** Sign up, login, logout; JWT in HTTP-only cookies; sessions persist on refresh
- **Roles:** `user` and `admin`; admin sees "Submitted by" and can manage any task
- **Tasks:** Create (title, description, due date, priority); Complete / Reject (with reason) / Edit (Pending only) / Delete
- **Grouping:** Pending (by priority: Urgent → High → Medium → Low), Completed / Rejected (newest first)
- **Dashboard:** Summary cards, filters (status or priority, one at a time), Manage modal for Pending tasks
- **Manage Tasks:** Full list with same grouping and actions
- **Notifications:** Bell icon; opening the dropdown marks visible notifications as read
- **PWA:** manifest + service worker + install prompt
- **Calendar:** Monthly view of tasks by due date
- **Email:** Welcome email on signup via Gmail SMTP (optional)

## Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set:
     - `MONGODB_URI` – your **MongoDB Atlas** connection string (see below)
     - `JWT_SECRET` – long random string for production
     - `NEXT_PUBLIC_APP_URL` – e.g. `http://localhost:3000`
   - For welcome emails (Gmail SMTP):
     - `SMTP_HOST=smtp.gmail.com`
     - `SMTP_PORT=587`
     - `SMTP_USER` – your Gmail
     - `SMTP_PASS` – [App Password](https://myaccount.google.com/apppasswords) (not your normal password)

   **MongoDB Atlas**
   - In [Atlas](https://cloud.mongodb.com): create a cluster (or use an existing one).
   - **Connect** → **Drivers** → copy the connection string.
   - Replace `<password>` with your database user password. If the password contains `@`, `#`, `:`, etc., [URL-encode](https://www.w3schools.com/tags/ref_urlencode.asp) them (e.g. `@` → `%40`).
   - Replace `<dbname>` with `taskhub` (or leave and add `/taskhub` before `?`).
   - Under **Network Access**, add your IP (or `0.0.0.0/0` for development only).
   - Put the full string in `.env` as `MONGODB_URI=...`.

3. **Create an admin (optional)**  
   In MongoDB (Compass or shell), set `role: "admin"` for one user:
   ```js
   db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
   ```

4. **PWA icons (optional)**  
   Add to `public/icons/`:
   - `icon-192.png` (192×192)
   - `icon-512.png` (512×512)  
   If missing, the app still runs; install may use a default icon.

5. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` – Landing (welcome + Login if not logged in; redirect to `/dashboard` if logged in)
- `/login`, `/register` – Auth
- `/dashboard` – Summary cards, filters, grouped tasks, Manage modal
- `/manage` – All tasks; admin sees "Submitted by"; edit via `?edit=<taskId>`
- `/add-task` – Create task form
- `/calendar` – Monthly calendar by due date

## API

- `POST /api/auth/register` – body: `{ name, email, password }`
- `POST /api/auth/login` – body: `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me` – current user
- `GET /api/tasks` – list (optional query: `status`, `priority`)
- `POST /api/tasks` – create
- `GET/PATCH/DELETE /api/tasks/[id]`
- `POST /api/tasks/[id]/complete`
- `POST /api/tasks/[id]/reject` – body: `{ rejectionReason }`
- `GET /api/notifications`
- `POST /api/notifications/read` – body: `{ ids: string[] }`

## Optional: Google Calendar

To add Google Calendar OAuth and create events when creating tasks, set in `.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (e.g. `http://localhost:3000/api/auth/google/callback`)

Then implement the OAuth flow and event creation in your API (not included in this base).
