create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-Z0-9]{5,8}$'),
  puzzle_date date not null,
  center_letter text not null check (center_letter ~ '^[a-z]$'),
  outer_letters text[] not null check (array_length(outer_letters, 1) = 6),
  dictionary_version text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  role text not null check (role in ('player', 'spectator')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.room_guesses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null check (word ~ '^[a-z]{4,24}$'),
  points int not null check (points >= 0),
  created_at timestamptz not null default now(),
  unique (room_id, user_id, word)
);

create table if not exists public.room_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('reaction', 'milestone')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists rooms_code_idx on public.rooms(code);
create index if not exists rooms_expires_at_idx on public.rooms(expires_at);
create index if not exists room_members_user_idx on public.room_members(user_id);
create index if not exists room_guesses_room_created_idx
  on public.room_guesses(room_id, created_at);
create index if not exists room_events_room_created_idx
  on public.room_events(room_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_guesses enable row level security;
alter table public.room_events enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "rooms_select_active"
  on public.rooms for select
  using (expires_at > now());

create policy "rooms_insert_authenticated"
  on public.rooms for insert
  with check (created_by = auth.uid());

create policy "room_members_select_same_room"
  on public.room_members for select
  using (
    exists (
      select 1
      from public.room_members viewer
      where viewer.room_id = room_members.room_id
        and viewer.user_id = auth.uid()
    )
  );

create policy "room_members_insert_self"
  on public.room_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.rooms
      where rooms.id = room_members.room_id
        and rooms.expires_at > now()
    )
  );

create policy "room_members_update_self"
  on public.room_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "room_guesses_select_room_members"
  on public.room_guesses for select
  using (
    exists (
      select 1
      from public.room_members
      where room_members.room_id = room_guesses.room_id
        and room_members.user_id = auth.uid()
    )
  );

create policy "room_guesses_insert_players"
  on public.room_guesses for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.room_members
      where room_members.room_id = room_guesses.room_id
        and room_members.user_id = auth.uid()
        and room_members.role = 'player'
    )
  );

create policy "room_events_select_room_members"
  on public.room_events for select
  using (
    exists (
      select 1
      from public.room_members
      where room_members.room_id = room_events.room_id
        and room_members.user_id = auth.uid()
    )
  );

create policy "room_events_insert_room_members"
  on public.room_events for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.room_members
      where room_members.room_id = room_events.room_id
        and room_members.user_id = auth.uid()
    )
  );

alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.room_guesses;
alter publication supabase_realtime add table public.room_events;
