create table public.spotify_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  spotify_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spotify_connections enable row level security;

create policy "Users can view own spotify connection"
  on public.spotify_connections for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own spotify connection"
  on public.spotify_connections for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own spotify connection"
  on public.spotify_connections for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own spotify connection"
  on public.spotify_connections for delete to authenticated
  using (auth.uid() = user_id);
