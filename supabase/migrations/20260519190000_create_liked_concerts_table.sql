create table public.liked_concerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_event_id text not null,
  source text not null default 'songkick',
  name text not null,
  artist text,
  venue text not null,
  city text not null default '',
  state text not null default '',
  event_date date not null,
  event_time text,
  distance_miles numeric(8, 2),
  ticket_url text,
  image_url text,
  created_at timestamptz not null default now(),
  unique (user_id, external_event_id)
);

create index liked_concerts_user_id_idx on public.liked_concerts (user_id);
create index liked_concerts_event_date_idx on public.liked_concerts (event_date asc);

alter table public.liked_concerts enable row level security;

create policy "Users can insert own liked concerts"
  on public.liked_concerts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own liked concerts"
  on public.liked_concerts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own liked concerts"
  on public.liked_concerts
  for delete
  to authenticated
  using (auth.uid() = user_id);
