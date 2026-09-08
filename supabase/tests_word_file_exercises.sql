begin;
do $test$
declare u uuid:=gen_random_uuid(); aid uuid:=gen_random_uuid(); r public.word_file_attempts; rejected boolean:=false;
ans jsonb:='{"Elipse 44":"1","Elipse 16":"2","Elipse 39":"3","Elipse 13":"4","Elipse 43":"5","Elipse 15":"6","Elipse 40":"7","Elipse 41":"8","Elipse 42":"9","Elipse 14":"10"}';
begin
  if has_table_privilege('authenticated','public.word_file_attempts','INSERT') or has_function_privilege('anon','public.submit_word_file_exercise(uuid,text,text,text,jsonb)','EXECUTE') then raise exception 'FAIL permisos'; end if;
  insert into auth.users(id,email,raw_user_meta_data) values(u,'file-test-'||u::text||'@tam.conalep.edu.mx','{}');
  perform set_config('request.jwt.claim.sub',u::text,true);
  begin perform public.submit_word_file_exercise(aid,'exercise-1',u::text||'/'||aid::text||'.docx','practica.docx',ans); exception when others then rejected:=true; end;
  if not rejected then raise exception 'FAIL exige archivo'; end if;
  insert into storage.objects(bucket_id,name,owner_id,metadata) values('word-exercise-submissions',u::text||'/'||aid::text||'.docx',u::text,'{"mimetype":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","size":1000}');
  r:=public.submit_word_file_exercise(aid,'exercise-1',u::text||'/'||aid::text||'.docx','practica.docx',ans); if r.score<>100 then raise exception 'FAIL score100'; end if;
  r:=public.submit_word_file_exercise(aid,'exercise-1',u::text||'/'||aid::text||'.docx','otro.docx','{}'); if r.score<>100 then raise exception 'FAIL idempotencia'; end if;
  aid:=gen_random_uuid(); insert into storage.objects(bucket_id,name,owner_id,metadata) values('word-exercise-submissions',u::text||'/'||aid::text||'.docx',u::text,'{"mimetype":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","size":1000}');
  r:=public.submit_word_file_exercise(aid,'exercise-1',u::text||'/'||aid::text||'.docx','parcial.docx',jsonb_set(ans,'{"Elipse 14"}','"9"')); if r.score<>90 then raise exception 'FAIL score90'; end if;
end; $test$;
set local role authenticated;
do $rls$ begin
  if(select count(*) from public.word_file_attempts)<>2 or (select count(*) from storage.objects where bucket_id='word-exercise-submissions')<>2 then raise exception 'FAIL lectura propia'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if exists(select 1 from public.word_file_attempts) or exists(select 1 from storage.objects where bucket_id='word-exercise-submissions') then raise exception 'FAIL aislamiento'; end if;
end $rls$;
reset role;
select 'PASS: archivo obligatorio, puntuación, idempotencia y aislamiento; datos revertidos.' resultado;
rollback;
