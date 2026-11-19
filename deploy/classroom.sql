begin;

create table public.classroom_members (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'guardian')),
  nickname text not null check (char_length(nickname) between 1 and 32),
  ai_allowed boolean not null default false,
  unique (id, role)
);

create table public.classroom_links (
  guardian_id uuid not null,
  student_id uuid not null,
  guardian_role text generated always as ('guardian'::text) stored,
  student_role text generated always as ('student'::text) stored,
  primary key (guardian_id, student_id),
  foreign key (guardian_id, guardian_role) references public.classroom_members(id, role) on delete cascade,
  foreign key (student_id, student_role) references public.classroom_members(id, role) on delete cascade
);
create index classroom_links_student_idx on public.classroom_links(student_id);

create table public.classroom_events (
  id uuid primary key,
  student_id uuid not null references public.classroom_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('attempt', 'assessment', 'resume', 'diagnostic')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 1500)
);
create index classroom_events_student_date_idx on public.classroom_events(student_id, created_at, id);

alter table public.classroom_members enable row level security;
alter table public.classroom_links enable row level security;
alter table public.classroom_events enable row level security;
revoke all on public.classroom_members, public.classroom_links, public.classroom_events from anon, authenticated;
grant select on public.classroom_members, public.classroom_links, public.classroom_events to authenticated;
grant insert (id, student_id, kind, payload) on public.classroom_events to authenticated;

create policy "guardians read their own links" on public.classroom_links
  for select to authenticated using (guardian_id = (select auth.uid()));
create policy "members read self or linked student" on public.classroom_members
  for select to authenticated using (
    id = (select auth.uid()) or exists (
      select 1 from public.classroom_links where student_id = classroom_members.id
    )
  );
create policy "students and linked guardians read events" on public.classroom_events
  for select to authenticated using (
    student_id = (select auth.uid()) or exists (
      select 1 from public.classroom_links where student_id = classroom_events.student_id
    )
  );
create policy "students append their own events" on public.classroom_events
  for insert to authenticated with check (
    student_id = (select auth.uid()) and exists (
      select 1 from public.classroom_members where id = (select auth.uid()) and role = 'student'
    )
  );

create table public.classroom_ai_usage (
  student_id uuid not null references public.classroom_members(id) on delete cascade,
  usage_day date not null,
  requests int not null default 1,
  primary key (student_id, usage_day)
);
alter table public.classroom_ai_usage enable row level security;
revoke all on public.classroom_ai_usage from anon, authenticated;
grant select, insert, update on public.classroom_ai_usage to service_role;
grant select on public.classroom_members to service_role;

create function public.claim_classroom_ai_request(student uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with claimed as (
    insert into public.classroom_ai_usage (student_id, usage_day)
    select id, (now() at time zone 'UTC')::date from public.classroom_members
    where id = student and role = 'student' and ai_allowed
    on conflict (student_id, usage_day) do update
      set requests = classroom_ai_usage.requests + 1
      where classroom_ai_usage.requests < 20
    returning 1
  )
  select exists(select 1 from claimed)
$$;
revoke all on function public.claim_classroom_ai_request(uuid) from public, anon, authenticated;
grant execute on function public.claim_classroom_ai_request(uuid) to service_role;

commit;
