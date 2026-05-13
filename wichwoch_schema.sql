-- ─── WICH WOCH — Schema Supabase ───────────────────────────────────────────

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  handle text unique not null,
  name text not null,
  bio text,
  account_type text not null default 'collector', -- collector | brand | repairer
  location text,
  website text,
  avatar_url text,
  followers_count int default 0,
  following_count int default 0,
  verified boolean default false,
  created_at timestamptz default now()
);

-- Watches (catalog)
create table public.watches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.profiles(id),
  model text not null,
  reference text not null,
  year int,
  description text,
  price_reference text,
  created_at timestamptz default now()
);

-- User watch registrations
create table public.watch_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  watch_id uuid references public.watches(id),
  serial_number text,
  purchased_at date,
  purchased_from text,
  notes text,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  watch_id uuid references public.watches(id),
  content text not null,
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

-- Likes
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

-- Comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Follows
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- Brand certifications of repairers
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.profiles(id) on delete cascade,
  repairer_id uuid references public.profiles(id) on delete cascade,
  issued_at timestamptz default now(),
  unique(brand_id, repairer_id)
);

-- Repairer reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  repairer_id uuid references public.profiles(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  content text,
  created_at timestamptz default now(),
  unique(repairer_id, author_id)
);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  location text,
  event_date date,
  event_type text, -- feria | workshop | meetup | evento-marca
  attendees_count int default 0,
  created_at timestamptz default now()
);

-- Event attendance
create table public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  type text not null, -- launch | tip | event | certification
  title text,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.watches enable row level security;
alter table public.watch_registrations enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.certifications enable row level security;
alter table public.reviews enable row level security;
alter table public.events enable row level security;
alter table public.event_attendance enable row level security;
alter table public.notifications enable row level security;

-- Profiles: public read, own write
create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Posts: public read, auth write
create policy "Posts are public" on public.posts for select using (true);
create policy "Auth users can post" on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors can delete posts" on public.posts for delete using (auth.uid() = author_id);

-- Watch registrations: public if public, own if private
create policy "Public registrations visible" on public.watch_registrations for select using (is_public = true or auth.uid() = user_id);
create policy "Own registrations" on public.watch_registrations for insert with check (auth.uid() = user_id);
create policy "Own registrations update" on public.watch_registrations for update using (auth.uid() = user_id);
create policy "Own registrations delete" on public.watch_registrations for delete using (auth.uid() = user_id);

-- Watches: public read, brand write
create policy "Watches are public" on public.watches for select using (true);
create policy "Brands can add watches" on public.watches for insert with check (auth.uid() = brand_id);

-- Likes
create policy "Likes public" on public.likes for select using (true);
create policy "Auth can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Auth can unlike" on public.likes for delete using (auth.uid() = user_id);

-- Comments
create policy "Comments public" on public.comments for select using (true);
create policy "Auth can comment" on public.comments for insert with check (auth.uid() = author_id);
create policy "Authors delete comment" on public.comments for delete using (auth.uid() = author_id);

-- Follows
create policy "Follows public" on public.follows for select using (true);
create policy "Auth can follow" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Auth can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- Events
create policy "Events public" on public.events for select using (true);
create policy "Auth can create events" on public.events for insert with check (auth.uid() = organizer_id);

-- Event attendance
create policy "Attendance public" on public.event_attendance for select using (true);
create policy "Auth can attend" on public.event_attendance for insert with check (auth.uid() = user_id);
create policy "Auth can unattend" on public.event_attendance for delete using (auth.uid() = user_id);

-- Reviews
create policy "Reviews public" on public.reviews for select using (true);
create policy "Auth can review" on public.reviews for insert with check (auth.uid() = author_id);

-- Certifications
create policy "Certifications public" on public.certifications for select using (true);

-- Notifications: only own
create policy "Own notifications" on public.notifications for select using (auth.uid() = recipient_id);
create policy "Own notifications update" on public.notifications for update using (auth.uid() = recipient_id);

-- ─── Trigger: auto-create profile on signup ──────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, handle, name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'account_type', 'collector')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
