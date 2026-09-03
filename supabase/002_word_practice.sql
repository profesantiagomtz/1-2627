-- Práctica formativa separada de las evidencias oficiales existentes.
begin;
create table if not exists public.word_practice_attempts (
  id uuid primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null check (lesson_id in ('word-start','word-create','word-interface')),
  responses jsonb not null,
  score integer not null check (score between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists word_practice_student_idx on public.word_practice_attempts(student_id,created_at);
alter table public.word_practice_attempts enable row level security;
revoke all on public.word_practice_attempts from anon, authenticated;
grant select on public.word_practice_attempts to authenticated;
create policy "word_practice_read_own" on public.word_practice_attempts for select to authenticated using (student_id = auth.uid());

create or replace function public.submit_word_practice(p_id uuid, p_lesson text, p_responses jsonb)
returns public.word_practice_attempts
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_expected text[];
  v_previous text;
  v_points integer := 0;
  v_result public.word_practice_attempts;
  i integer;
begin
  if v_user is null then raise exception 'Debes iniciar sesión'; end if;
  select * into v_result from public.word_practice_attempts where id = p_id and student_id = v_user;
  if found then return v_result; end if;
  case p_lesson
    when 'word-start' then v_expected := array['start','search-word','word'];
    when 'word-create' then v_expected := array['blank','template','open','file-practica']; v_previous := 'word-start';
    when 'word-interface' then v_expected := array['title','tabs','ribbon','page','status','zoom']; v_previous := 'word-create';
    else raise exception 'Lección no válida';
  end case;
  if v_previous is not null and not exists(select 1 from public.word_practice_attempts where student_id = v_user and lesson_id = v_previous and score >= 70) then
    raise exception 'Completa primero la lección anterior con al menos 70 puntos';
  end if;
  if p_responses is null or jsonb_typeof(p_responses) <> 'array' then raise exception 'Respuestas no válidas'; end if;
  if jsonb_array_length(p_responses) <> array_length(v_expected,1) or octet_length(p_responses::text) > 2000 then raise exception 'Reto incompleto'; end if;
  for i in 1..array_length(v_expected,1) loop
    if jsonb_typeof(p_responses->(i-1)) <> 'string' then raise exception 'Respuesta no válida'; end if;
    if p_responses->>(i-1) = v_expected[i] then v_points := v_points + 1; end if;
  end loop;
  insert into public.word_practice_attempts(id,student_id,lesson_id,responses,score)
  values(p_id,v_user,p_lesson,p_responses,round(100.0*v_points/array_length(v_expected,1)))
  on conflict(id) do nothing returning * into v_result;
  if v_result.id is null then
    select * into v_result from public.word_practice_attempts where id=p_id and student_id=v_user;
    if not found then raise exception 'Identificador de intento no válido'; end if;
  end if;
  return v_result;
end;
$$;
revoke all on function public.submit_word_practice(uuid,text,jsonb) from public, anon;
grant execute on function public.submit_word_practice(uuid,text,jsonb) to authenticated;
commit;
