-- ============================================================
-- ALIFOR COMMAND CENTER — Full Supabase Schema v2
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  title text,
  role text default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  active boolean default true,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, role, active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'role','viewer'), true)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. GOALS
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  title text not null, description text,
  created_at timestamptz default now()
);

-- 3. TACTICS
create table if not exists public.tactics (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.goals(id) on delete cascade,
  title text not null, created_at timestamptz default now()
);

-- 4. TASKS
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  tactic_id uuid references public.tactics(id) on delete cascade,
  title text not null, status text default 'Not Started',
  priority text default 'Medium', due_date date,
  raci jsonb default '{}', created_at timestamptz default now()
);

-- 5. ACTIVITY LOGS
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  user_name text, user_email text,
  action_type text, description text, ip_address text,
  created_at timestamptz default now()
);

-- 6. APP SETTINGS (stores theme JSON + security config)
create table if not exists public.app_settings (
  id text primary key default 'global',
  theme jsonb default '{}',
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);
insert into public.app_settings (id) values ('global') on conflict do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.tactics enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_logs enable row level security;
alter table public.app_settings enable row level security;

-- Profiles
create policy "profiles_read" on public.profiles for select using (auth.role()='authenticated');
create policy "profiles_update_own" on public.profiles for update using (auth.uid()=id);
create policy "profiles_admin_update" on public.profiles for update using (
  exists(select 1 from public.profiles where id=auth.uid() and role='admin')
);

-- Goals / Tactics / Tasks
create policy "goals_read" on public.goals for select using (auth.role()='authenticated');
create policy "goals_write" on public.goals for all using (
  exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor') and active=true)
);
create policy "tactics_read" on public.tactics for select using (auth.role()='authenticated');
create policy "tactics_write" on public.tactics for all using (
  exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor') and active=true)
);
create policy "tasks_read" on public.tasks for select using (auth.role()='authenticated');
create policy "tasks_write" on public.tasks for all using (
  exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','editor') and active=true)
);

-- Logs
create policy "logs_admin_read" on public.activity_logs for select using (
  exists(select 1 from public.profiles where id=auth.uid() and role='admin')
);
create policy "logs_insert" on public.activity_logs for insert with check (auth.role()='authenticated');

-- App settings: all read, admin write
create policy "settings_read" on public.app_settings for select using (auth.role()='authenticated');
create policy "settings_write" on public.app_settings for update using (
  exists(select 1 from public.profiles where id=auth.uid() and role='admin')
);

-- ============================================================
-- RECOMMENDED AUTH SETTINGS (set in Supabase Dashboard → Auth)
-- ============================================================
-- ✅ Minimum password length: 8
-- ✅ Enable email confirmations
-- ✅ Enable secure email change
-- ✅ JWT expiry: 3600 (1 hour)
-- ✅ Enable refresh token rotation
-- ✅ Disable public signups (Auth → Settings → "Disable signup")

-- ============================================================
-- SEED DATA
-- ============================================================
insert into public.goals (title, description) values
  ('Expand Clinical AI Adoption','Drive uptake of Guideline Clinical Support across physician practices'),
  ('Strengthen Clinical Documentation','Enhance Smart Scribing and SOAP note accuracy aligned with CPSO standards')
on conflict do nothing;
