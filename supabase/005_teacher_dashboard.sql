begin;

create or replace function public.teacher_student_overview()
returns table(
  student_id uuid,
  email text,
  full_name text,
  group_code text,
  attempt_count bigint,
  best_score integer,
  last_activity timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or lower(coalesce(auth.jwt()->>'email','')) <> 'santiago.gonzalez@tam.conalep.edu.mx' then
    raise exception 'Acceso exclusivo del docente' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),'Sin nombre')::text,
    coalesce(nullif(btrim(u.raw_user_meta_data->>'group_code'),''),'Sin grupo')::text,
    count(a.id)::bigint,
    max(a.score)::integer,
    max(a.created_at)
  from auth.users u
  left join public.word_file_attempts a on a.student_id = u.id
  where lower(coalesce(u.email,'')) <> 'santiago.gonzalez@tam.conalep.edu.mx'
  group by u.id,u.email,u.raw_user_meta_data
  order by coalesce(nullif(btrim(u.raw_user_meta_data->>'group_code'),''),'Sin grupo'),
           coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),u.email);
end;
$$;

revoke all on function public.teacher_student_overview() from public, anon;
grant execute on function public.teacher_student_overview() to authenticated;

commit;
