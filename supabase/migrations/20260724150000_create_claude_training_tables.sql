create table if not exists public.claude_course_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claude_course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null check (course_id in ('claude-01', 'claude-code')),
  completed_unit_ids text[] not null default '{}',
  quiz_score integer not null default 0 check (quiz_score between 0 and 8),
  passed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id),
  constraint claude_course_completed_units_limit check (
    cardinality(completed_unit_ids) <=
    case when course_id = 'claude-01' then 6 else 7 end
  ),
  constraint claude_course_pass_requires_completion check (
    not passed or (
      quiz_score >= 6 and
      cardinality(completed_unit_ids) =
        case when course_id = 'claude-01' then 6 else 7 end and
      completed_at is not null
    )
  )
);

alter table public.claude_course_profiles enable row level security;
alter table public.claude_course_progress enable row level security;

revoke all on table public.claude_course_profiles from anon, authenticated;
revoke all on table public.claude_course_progress from anon, authenticated;
grant select, insert, update on table public.claude_course_profiles to authenticated;
grant select, insert, update on table public.claude_course_progress to authenticated;

create policy "course_profiles_select_own"
on public.claude_course_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "course_profiles_insert_own"
on public.claude_course_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "course_profiles_update_own"
on public.claude_course_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "course_progress_select_own"
on public.claude_course_progress for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "course_progress_insert_own"
on public.claude_course_progress for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "course_progress_update_own"
on public.claude_course_progress for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.claude_course_honor_roll()
returns table (
  display_name text,
  avatar_url text,
  completed_courses bigint
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    p.display_name,
    p.avatar_url,
    count(*) filter (where g.passed) as completed_courses
  from public.claude_course_profiles p
  join public.claude_course_progress g on g.user_id = p.user_id
  where auth.uid() is not null
  group by p.user_id, p.display_name, p.avatar_url
  having count(*) filter (where g.passed) > 0
  order by completed_courses desc, p.display_name asc
  limit 100;
$$;

revoke all on function public.claude_course_honor_roll() from public, anon;
grant execute on function public.claude_course_honor_roll() to authenticated;
