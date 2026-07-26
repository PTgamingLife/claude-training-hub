alter table public.claude_course_progress
  drop constraint if exists claude_course_progress_course_id_check,
  drop constraint if exists claude_course_completed_units_limit,
  drop constraint if exists claude_course_pass_requires_completion;

alter table public.claude_course_progress
  add constraint claude_course_progress_course_id_check
    check (course_id in ('claude-01', 'claude-code', 'claude-api')),
  add constraint claude_course_completed_units_limit
    check (
      cardinality(completed_unit_ids) <=
      case
        when course_id = 'claude-01' then 6
        when course_id = 'claude-code' then 7
        when course_id = 'claude-api' then 8
      end
    ),
  add constraint claude_course_pass_requires_completion
    check (
      not passed or (
        quiz_score >= 6 and
        cardinality(completed_unit_ids) =
          case
            when course_id = 'claude-01' then 6
            when course_id = 'claude-code' then 7
            when course_id = 'claude-api' then 8
          end and
        completed_at is not null
      )
    );
