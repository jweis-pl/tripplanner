create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "Profiles are visible to trip members" on public.profiles;
create policy "Profiles are visible to trip members"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.trip_members tm_self
      join public.trip_members tm_other on tm_self.trip_id = tm_other.trip_id
      where tm_self.user_id = auth.uid()
        and tm_other.user_id = profiles.id
    )
  );
