-- =====================================================================
-- Denisegram – Datenbank-Schema für Supabase (einmal im SQL-Editor ausführen)
-- Kann gefahrlos mehrfach ausgeführt werden.
-- Begriffe: Raum (space) = ein Inner Circle · Person (people) = ein Mitglied (max. 10 aktiv)
--           Gerät (members) = ein angemeldetes Handy/Browser einer Person
--           In den Inhaltstabellen steht in "role"/"author"/"to_pid" immer die Personen-ID.
-- =====================================================================
create extension if not exists pgcrypto;

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Denisegram',
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.people (
  id text primary key default encode(gen_random_bytes(6), 'hex'),
  space_id uuid not null references public.spaces(id) on delete cascade,
  is_owner boolean not null default false,
  restore_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  removed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.members (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null,
  pid text not null references public.people(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);
create table if not exists public.invites (
  token text primary key default encode(gen_random_bytes(12), 'hex'),
  space_id uuid not null references public.spaces(id) on delete cascade,
  kind text not null default 'member' check (kind in ('owner','member')),
  label text,
  created_by text,
  created_at timestamptz not null default now(),
  used_at timestamptz, used_by text,
  revoked_at timestamptz
);
create index if not exists people_space_idx on public.people(space_id);
create index if not exists invites_space_idx on public.invites(space_id);

-- ---------- Hilfsfunktionen ----------
create or replace function public.my_pid(s uuid) returns text
language sql security definer stable set search_path = public as $$
  select m.pid from public.members m join public.people p on p.id = m.pid
  where m.space_id = s and m.user_id = auth.uid() and p.removed_at is null limit 1;
$$;
create or replace function public.is_member(s uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select public.my_pid(s) is not null;
$$;
create or replace function public.is_owner(s uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.people p where p.id = public.my_pid(s) and p.is_owner);
$$;
create or replace function public.own_key(k text, s uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select k is not null and public.my_pid(s) is not null and (k = public.my_pid(s) or k like public.my_pid(s) || ':%');
$$;
create or replace function public.active_count(s uuid) returns int
language sql security definer stable set search_path = public as $$
  select count(*)::int from public.people where space_id = s and removed_at is null;
$$;

-- ---------- Einladungen ----------
-- Status eines Links prüfen, OHNE ihn einzulösen (für die Startseite)
create or replace function public.invite_info(p_token text) returns json
language plpgsql security definer stable set search_path = public as $$
declare inv public.invites; sp public.spaces;
begin
  select * into inv from public.invites where token = lower(trim(p_token));
  if not found then return json_build_object('status','invalid'); end if;
  select * into sp from public.spaces where id = inv.space_id;
  if inv.revoked_at is not null then return json_build_object('status','revoked'); end if;
  if inv.used_at is not null then return json_build_object('status','used', 'kind', inv.kind); end if;
  if public.active_count(inv.space_id) >= 10 then return json_build_object('status','full', 'kind', inv.kind); end if;
  return json_build_object('status','ok', 'kind', inv.kind, 'label', inv.label, 'name', sp.name, 'count', public.active_count(inv.space_id));
end $$;

-- Link einlösen = Einrichtung abschließen. Erzwingt max. 10 aktive Personen.
create or replace function public.redeem_invite(p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare inv public.invites; pe public.people; cur text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into inv from public.invites where token = lower(trim(p_token)) for update;
  if not found then raise exception 'Dieser Link ist ungültig.'; end if;
  perform 1 from public.spaces where id = inv.space_id for update;  -- gegen gleichzeitiges Beitreten
  cur := public.my_pid(inv.space_id);
  if cur is not null then   -- dieses Gerät ist schon drin: nichts verbrauchen
    select * into pe from public.people where id = cur;
    return json_build_object('space_id', pe.space_id, 'pid', pe.id, 'is_owner', pe.is_owner, 'restore', pe.restore_token);
  end if;
  if inv.revoked_at is not null then raise exception 'Diese Einladung wurde zurückgezogen.'; end if;
  if inv.used_at is not null then raise exception 'Bereits eingelöst – nutze deinen Wiederherstellen-Link.'; end if;
  if public.active_count(inv.space_id) >= 10 then raise exception 'Der Inner Circle ist voll (10/10).'; end if;
  insert into public.people (space_id, is_owner) values (inv.space_id, inv.kind = 'owner') returning * into pe;
  insert into public.members (space_id, user_id, pid) values (inv.space_id, auth.uid(), pe.id)
    on conflict (space_id, user_id) do update set pid = excluded.pid, created_at = now();
  update public.invites set used_at = now(), used_by = pe.id where token = inv.token;
  return json_build_object('space_id', pe.space_id, 'pid', pe.id, 'is_owner', pe.is_owner, 'restore', pe.restore_token);
end $$;

-- Neues Gerät / App neu installiert: mit dem persönlichen Wiederherstellen-Link zurück
create or replace function public.restore_device(p_restore text) returns json
language plpgsql security definer set search_path = public as $$
declare pe public.people;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into pe from public.people where restore_token = lower(trim(p_restore));
  if not found then raise exception 'Dieser Wiederherstellen-Link ist ungültig.'; end if;
  if pe.removed_at is not null then raise exception 'Du bist nicht mehr im Inner Circle.'; end if;
  insert into public.members (space_id, user_id, pid) values (pe.space_id, auth.uid(), pe.id)
    on conflict (space_id, user_id) do update set pid = excluded.pid, created_at = now();
  return json_build_object('space_id', pe.space_id, 'pid', pe.id, 'is_owner', pe.is_owner, 'restore', pe.restore_token);
end $$;

create or replace function public.my_space() returns json
language sql security definer stable set search_path = public as $$
  select json_build_object('space_id', p.space_id, 'pid', p.id, 'is_owner', p.is_owner, 'restore', p.restore_token)
  from public.members m join public.people p on p.id = m.pid
  where m.user_id = auth.uid() and p.removed_at is null order by m.created_at desc limit 1;
$$;

-- Nur Besitzerin: einladen, widerrufen, entfernen
create or replace function public.create_invite(p_space uuid, p_label text) returns json
language plpgsql security definer set search_path = public as $$
declare inv public.invites; act int; open_n int;
begin
  if not public.is_owner(p_space) then raise exception 'Nur die Besitzerin kann einladen.'; end if;
  perform 1 from public.spaces where id = p_space for update;
  act := public.active_count(p_space);
  select count(*) into open_n from public.invites where space_id = p_space and used_at is null and revoked_at is null;
  if act >= 10 then raise exception 'Dein Inner Circle ist voll (10/10).'; end if;
  if act + open_n >= 10 then raise exception 'Alle 10 Plätze sind belegt oder schon als Einladung unterwegs. Zieh eine offene Einladung zurück.'; end if;
  insert into public.invites (space_id, kind, label, created_by)
    values (p_space, 'member', nullif(left(trim(coalesce(p_label,'')), 40), ''), public.my_pid(p_space)) returning * into inv;
  return json_build_object('token', inv.token, 'label', inv.label);
end $$;
create or replace function public.revoke_invite(p_token text) returns boolean
language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites where token = p_token;
  if not found or not public.is_owner(inv.space_id) or inv.kind <> 'member' then raise exception 'Nicht erlaubt.'; end if;
  update public.invites set revoked_at = now() where token = p_token and used_at is null;
  return true;
end $$;
create or replace function public.remove_person(p_space uuid, p_pid text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(p_space) then raise exception 'Nur die Besitzerin kann entfernen.'; end if;
  if p_pid = public.my_pid(p_space) then raise exception 'Dich selbst kannst du nicht entfernen.'; end if;
  update public.people set removed_at = now() where id = p_pid and space_id = p_space and removed_at is null;
  delete from public.members where pid = p_pid;
  delete from public.push_subs where space_id = p_space and role = p_pid;
  return true;
end $$;

-- ---------- Inhalte ----------
create table if not exists public.profiles (
  space_id uuid not null references public.spaces(id) on delete cascade,
  role text not null,
  nick text, username text, emoji text, avatar_path text, bio text, link text, pronouns text, color text,
  updated_at bigint,
  primary key (space_id, role)
);
create table if not exists public.posts (
  id text primary key,
  space_id uuid not null references public.spaces(id) on delete cascade,
  author text not null, created_at bigint not null,
  text text, media_path text, media_type text, w int, h int, d real, bg text,
  deleted boolean not null default false
);
create table if not exists public.reactions (
  post_id text not null,
  space_id uuid not null references public.spaces(id) on delete cascade,
  role text not null, at bigint, "on" boolean not null default true,
  primary key (post_id, role)
);
create table if not exists public.comments (
  id text primary key,
  space_id uuid not null references public.spaces(id) on delete cascade,
  post_id text not null, author text not null, text text, created_at bigint not null,
  deleted boolean not null default false
);
create table if not exists public.stories (
  id text primary key,
  space_id uuid not null references public.spaces(id) on delete cascade,
  author text not null, created_at bigint not null,
  text text, media_path text, media_type text, w int, h int, d real, bg text,
  deleted boolean not null default false
);
create table if not exists public.story_views (
  story_id text not null,
  space_id uuid not null references public.spaces(id) on delete cascade,
  role text not null, at bigint,
  primary key (story_id, role)
);
-- Direktnachrichten 1:1 (kein Gruppenchat): nur Absender und Empfänger sehen sie
create table if not exists public.messages (
  id text primary key,
  space_id uuid not null references public.spaces(id) on delete cascade,
  author text not null, to_pid text not null, text text, created_at bigint not null, read_at bigint,
  deleted boolean not null default false
);
create table if not exists public.push_subs (
  endpoint text primary key,
  space_id uuid not null references public.spaces(id) on delete cascade,
  role text not null, sub jsonb not null,
  user_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);
-- Nur für die Edge Function (Service-Rolle), keine Policies = für Apps unsichtbar
create table if not exists public.app_keys (
  id text primary key, public_key text, private_key text, created_at timestamptz default now()
);

create index if not exists posts_space_idx on public.posts(space_id, created_at);
create index if not exists comments_post_idx on public.comments(post_id);
create index if not exists stories_space_idx on public.stories(space_id, created_at);
create index if not exists messages_space_idx on public.messages(space_id, created_at);

-- ---------- Row Level Security ----------
alter table public.spaces enable row level security;
alter table public.members enable row level security;
alter table public.people enable row level security;
alter table public.invites enable row level security;
alter table public.app_keys enable row level security;

drop policy if exists "people read" on public.people;
create policy "people read" on public.people for select to authenticated using (public.is_member(space_id));
drop policy if exists "invites owner read" on public.invites;
create policy "invites owner read" on public.invites for select to authenticated using (public.is_owner(space_id));
drop policy if exists "members read own" on public.members;
create policy "members read own" on public.members for select to authenticated using (user_id = auth.uid());

do $$
declare t text; k text;
begin
  foreach t in array array['profiles','posts','reactions','comments','stories','story_views','messages','push_subs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I replica identity full', t);
    foreach k in array array['space members','dg read','dg insert','dg update'] loop
      execute format('drop policy if exists %I on public.%I', k, t);
    end loop;
    k := case t when 'posts' then 'author' when 'comments' then 'author' when 'stories' then 'author'
                when 'messages' then 'author' else 'role' end;
    if t = 'messages' then
      execute 'create policy "dg read" on public.messages for select to authenticated using (public.is_member(space_id) and (author = public.my_pid(space_id) or to_pid = public.my_pid(space_id)))';
      execute 'create policy "dg insert" on public.messages for insert to authenticated with check (public.is_member(space_id) and author = public.my_pid(space_id))';
      execute 'create policy "dg update" on public.messages for update to authenticated using (public.is_member(space_id) and (author = public.my_pid(space_id) or to_pid = public.my_pid(space_id))) with check (public.is_member(space_id) and (author = public.my_pid(space_id) or to_pid = public.my_pid(space_id)))';
    else
      execute format('create policy "dg read" on public.%I for select to authenticated using (public.is_member(space_id))', t);
      execute format('create policy "dg insert" on public.%I for insert to authenticated with check (public.own_key(%I, space_id))', t, k);
      execute format('create policy "dg update" on public.%I for update to authenticated using (public.own_key(%I, space_id)) with check (public.own_key(%I, space_id))', t, k, k);
    end if;
  end loop;
end $$;
alter table public.people replica identity full;

-- Live-Abgleich (Realtime)
do $$
declare t text;
begin
  foreach t in array array['profiles','posts','reactions','comments','stories','story_views','messages','people'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Fotos & Videos (privater Speicher, max. 50 MB je Datei)
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "dg media read" on storage.objects;
drop policy if exists "dg media insert" on storage.objects;
drop policy if exists "dg media update" on storage.objects;
drop policy if exists "dg media delete" on storage.objects;
create policy "dg media read" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "dg media insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "dg media update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "dg media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles, public.posts, public.reactions, public.comments, public.stories, public.story_views, public.messages, public.push_subs to authenticated;
grant delete on public.push_subs to authenticated;
grant select on public.members, public.people, public.invites to authenticated;
revoke all on public.app_keys from anon, authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.invite_info(text) to anon, authenticated;
grant execute on function public.redeem_invite(text), public.restore_device(text), public.my_space(),
  public.create_invite(uuid, text), public.revoke_invite(text), public.remove_person(uuid, text),
  public.my_pid(uuid), public.is_member(uuid), public.is_owner(uuid), public.own_key(text, uuid), public.active_count(uuid)
  to authenticated;

-- =====================================================================
-- NUR FÜR JÖRG (SQL-Editor) – für die Apps gesperrt
-- =====================================================================
-- Neuen Raum + einmaligen Besitzer-Link anlegen:   select public.admin_new_space('Denisegram', false);
create or replace function public.admin_new_space(p_name text, p_test boolean) returns json
language plpgsql security definer set search_path = public as $$
declare sp public.spaces; inv public.invites;
begin
  insert into public.spaces (name, is_test) values (coalesce(p_name, 'Denisegram'), coalesce(p_test, false)) returning * into sp;
  insert into public.invites (space_id, kind, label) values (sp.id, 'owner', 'Besitzerin') returning * into inv;
  return json_build_object('space_id', sp.id, 'owner_token', inv.token);
end $$;
-- Neuer Besitzer-Link für einen Raum (alter, unbenutzter wird zurückgezogen):  select public.admin_new_owner_link('<space_id>');
create or replace function public.admin_new_owner_link(p_space uuid) returns text
language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  if exists (select 1 from public.people where space_id = p_space and is_owner and removed_at is null) then
    raise exception 'Raum hat schon eine Besitzerin – nutze admin_owner_restore.';
  end if;
  update public.invites set revoked_at = now() where space_id = p_space and kind = 'owner' and used_at is null and revoked_at is null;
  insert into public.invites (space_id, kind, label) values (p_space, 'owner', 'Besitzerin') returning * into inv;
  return inv.token;
end $$;
-- Wiederherstellen-Token der Besitzerin (falls Denise ihren Link verloren hat):  select public.admin_owner_restore('<space_id>');
create or replace function public.admin_owner_restore(p_space uuid) returns text
language sql security definer stable set search_path = public as $$
  select restore_token from public.people where space_id = p_space and is_owner and removed_at is null limit 1;
$$;
revoke execute on function public.admin_new_space(text, boolean), public.admin_new_owner_link(uuid), public.admin_owner_restore(uuid) from public, anon, authenticated;

select 'Denisegram: Schema fertig ✔' as status;
