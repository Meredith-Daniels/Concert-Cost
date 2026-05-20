alter table public.concerts
  add column if not exists venue_latitude numeric(10, 7),
  add column if not exists venue_longitude numeric(10, 7);

create index if not exists concerts_concert_date_idx on public.concerts (concert_date);
