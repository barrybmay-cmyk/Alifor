# Alifor Command Center

A physician-controlled strategy, RACI, and task management platform — built on React + Supabase, deployable to Vercel or Netlify in minutes.

---

## Stack

- **Frontend**: React 18 + Vite
- **Auth & Database**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel or Netlify (free tier)

---

## Setup Guide

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project** → name it `alifor` → choose a region → set a database password → **Create**
3. Wait ~2 minutes for it to provision

### Step 2 — Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` and paste it in
4. Click **Run** (▶)
5. You should see "Success" — this creates all tables, RLS policies, and seed data

### Step 3 — Get Your API Keys

1. In Supabase, go to **Settings → API**
2. Copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon / public key** (the long `eyJ...` string)

### Step 4 — Configure Environment Variables

1. Copy `.env.example` to a new file called `.env.local`:
   ```
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in your values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 5 — Create Your First Admin User

1. In Supabase, go to **Authentication → Users**
2. Click **Add User** → enter your email and a password → **Create User**
3. Go to **Table Editor → profiles** → find your new user row
4. Click the row and set `role` to `admin` and `active` to `true`
5. That's your admin account!

### Step 6 — Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` — sign in with the admin credentials you just created.

---

## Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy** — you'll get a live URL like `https://alifor.vercel.app`

## Deploy to Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add New Site → Import from Git**
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `dist`
5. Under **Environment Variables**, add both Supabase keys
6. Click **Deploy**

---

## User Management

Once deployed, admins can:
- **Create users** via Supabase Dashboard → Authentication → Add User
- **Set roles** via the in-app Admin Console (🛡 in sidebar)
- **Deactivate users** without deleting them
- **View the activity log** for a full audit trail

### Roles

| Role   | Permissions |
|--------|-------------|
| Admin  | Full access + Admin Console + user management |
| Editor | Create/edit goals, tactics, tasks, RACI |
| Viewer | Read-only |

---

## Inviting New Users

Since this app uses Supabase Auth:

1. Go to **Supabase → Authentication → Users → Invite**
2. Enter their email — they'll receive a magic link
3. Once they sign up, go to **Admin Console** in the app and set their role

---

## Security Notes

- All data is protected by **Row Level Security (RLS)** — users can only access what their role permits, enforced at the database level
- Passwords are managed by Supabase Auth (bcrypt hashed, never stored in plain text)
- The anon key is safe to expose in the frontend — RLS prevents unauthorized access
- For production, ensure your Supabase project has email confirmations enabled

---

## Project Structure

```
alifor/
├── src/
│   ├── lib/
│   │   ├── supabase.js        # Supabase client
│   │   └── AuthContext.jsx    # Auth provider & hooks
│   ├── components/
│   │   └── UI.jsx             # Shared components
│   ├── pages/
│   │   ├── LoginPage.jsx      # Auth screen
│   │   ├── DashboardPage.jsx  # Main app
│   │   └── AdminConsole.jsx   # User management
│   ├── App.jsx                # Root with auth routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── supabase-schema.sql        # Run this in Supabase SQL Editor
├── .env.example               # Copy to .env.local
├── vite.config.js
└── package.json
```
