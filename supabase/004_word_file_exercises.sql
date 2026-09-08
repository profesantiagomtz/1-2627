begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('word-exercise-submissions','word-exercise-submissions',false,8388608,array['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;

create table public.word_file_attempts(
  id uuid primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id text not null check(exercise_id='exercise-1'),
  file_path text not null unique,
  file_name text not null check(length(file_name) between 1 and 180),
  answers jsonb not null,
  score integer not null check(score between 0 and 100),
  created_at timestamptz not null default now()
);
create index word_file_attempts_student_idx on public.word_file_attempts(student_id,exercise_id,created_at desc);
alter table public.word_file_attempts enable row level security;
revoke all on public.word_file_attempts from public,anon,authenticated;
grant select on public.word_file_attempts to authenticated;
create policy word_file_attempts_read_own on public.word_file_attempts for select to authenticated using(student_id=auth.uid());

create policy word_submission_upload_own on storage.objects for insert to authenticated
with check(bucket_id='word-exercise-submissions' and (storage.foldername(name))[1]=auth.uid()::text);
create policy word_submission_read_own on storage.objects for select to authenticated
using(bucket_id='word-exercise-submissions' and (storage.foldername(name))[1]=auth.uid()::text);

create function public.submit_word_file_exercise(p_id uuid,p_exercise text,p_file_path text,p_file_name text,p_answers jsonb)
returns public.word_file_attempts language plpgsql security definer set search_path='' as $$
declare
  v_user uuid:=auth.uid(); v_result public.word_file_attempts; v_score integer:=0; i integer;
  v_shapes text[]:=array['Elipse 44','Elipse 16','Elipse 39','Elipse 13','Elipse 43','Elipse 15','Elipse 40','Elipse 41','Elipse 42','Elipse 14'];
  v_answers text[]:=array['1','2','3','4','5','6','7','8','9','10'];
begin
  if v_user is null then raise exception 'Debes iniciar sesión'; end if;
  select * into v_result from public.word_file_attempts where id=p_id and student_id=v_user;
  if found then return v_result; end if;
  if p_exercise<>'exercise-1' or p_id is null then raise exception 'Ejercicio no válido'; end if;
  if p_file_path<>v_user::text||'/'||p_id::text||'.docx' then raise exception 'Ruta de archivo no válida'; end if;
  if p_file_name is null or length(p_file_name) not between 1 and 180 then raise exception 'Nombre de archivo no válido'; end if;
  if p_answers is null or jsonb_typeof(p_answers)<>'object' or (select count(*) from jsonb_object_keys(p_answers))<>10 or octet_length(p_answers::text)>1000 then raise exception 'Respuestas no válidas'; end if;
  for i in 1..10 loop
    if jsonb_typeof(p_answers->v_shapes[i])<>'string' then raise exception 'Respuesta no válida'; end if;
    if btrim(p_answers->>v_shapes[i])=v_answers[i] then v_score:=v_score+10; end if;
  end loop;
  if not exists(select 1 from storage.objects where bucket_id='word-exercise-submissions' and name=p_file_path and owner_id=v_user::text) then raise exception 'Primero carga el archivo'; end if;
  insert into public.word_file_attempts(id,student_id,exercise_id,file_path,file_name,answers,score)
  values(p_id,v_user,p_exercise,p_file_path,p_file_name,p_answers,v_score) returning * into v_result;
  return v_result;
end; $$;
revoke all on function public.submit_word_file_exercise(uuid,text,text,text,jsonb) from public,anon;
grant execute on function public.submit_word_file_exercise(uuid,text,text,text,jsonb) to authenticated;
commit;
