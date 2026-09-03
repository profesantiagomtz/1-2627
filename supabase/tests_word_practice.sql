-- Ejecutar manualmente en SQL Editor. Todo se revierte al terminar.
-- No se envían correos ni se modifican cuentas o notas reales.
begin;
do $test$
declare u uuid:=gen_random_uuid(); r public.word_practice_attempts; first_id uuid:=gen_random_uuid(); rejected boolean:=false;
begin
  if has_table_privilege('anon','public.word_practice_attempts','SELECT') or has_table_privilege('authenticated','public.word_practice_attempts','INSERT') or has_table_privilege('authenticated','public.word_practice_attempts','UPDATE') then raise exception 'FAIL permisos'; end if;
  if has_function_privilege('anon','public.submit_word_practice(uuid,text,jsonb)','EXECUTE') then raise exception 'FAIL anon RPC'; end if;
  insert into auth.users(id,email,raw_user_meta_data) values(u,'practice-test-'||u::text||'@tam.conalep.edu.mx','{}');
  perform set_config('request.jwt.claim.sub',u::text,true);
  begin perform public.submit_word_practice(gen_random_uuid(),'word-create','["blank","template","open","file-practica"]'); exception when others then rejected:=true; end;
  if not rejected then raise exception 'FAIL progresion'; end if;
  r:=public.submit_word_practice(first_id,'word-start','["start","wrong","word"]');
  if r.score<>67 then raise exception 'FAIL score67'; end if;
  r:=public.submit_word_practice(first_id,'word-start','["start","search-word","word"]');
  if r.score<>67 then raise exception 'FAIL idempotencia'; end if;
  r:=public.submit_word_practice(gen_random_uuid(),'word-start','["start","search-word","word"]');
  if r.score<>100 then raise exception 'FAIL score100'; end if;
  r:=public.submit_word_practice(gen_random_uuid(),'word-create','["wrong","template","open","file-practica"]');
  if r.score<>75 then raise exception 'FAIL score75'; end if;
  r:=public.submit_word_practice(gen_random_uuid(),'word-interface','["wrong","tabs","ribbon","page","status","zoom"]');
  if r.score<>83 then raise exception 'FAIL score83'; end if;
  rejected:=false;
  begin perform public.submit_word_practice(gen_random_uuid(),'word-start','[]'); exception when others then rejected:=true; end;
  if not rejected then raise exception 'FAIL incompleto'; end if;
  if (select count(*) from public.word_practice_attempts where student_id=u)<>4 then raise exception 'FAIL historial'; end if;
end; $test$;
set local role authenticated;
do $rls$ begin
  if (select count(*) from public.word_practice_attempts)<>4 then raise exception 'FAIL RLS lectura propia'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if exists(select 1 from public.word_practice_attempts) then raise exception 'FAIL RLS aislamiento'; end if;
end; $rls$;
reset role;
select 'PASS: notas, progresion, idempotencia, historial y aislamiento RLS; pruebas revertidas' as resultado;
rollback;
