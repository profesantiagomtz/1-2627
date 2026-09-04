-- Pruebas transaccionales: usuarios ficticios y notas desaparecen con ROLLBACK.
begin;
do $test$
declare
  u uuid := gen_random_uuid(); other_user uuid := gen_random_uuid(); first_id uuid := gen_random_uuid();
  r public.word_document_attempts; rejected boolean;
  d jsonb := '[{"runs":[{"text":"Mi perfil de estudiante","bold":true}],"align":"center"},{"runs":[{"text":"Nombre: Ana Prueba","bold":false}],"align":"left"},{"runs":[{"text":"Grupo: 311","bold":false}],"align":"left"}]';
begin
  if has_table_privilege('anon','public.word_document_attempts','SELECT')
    or has_table_privilege('authenticated','public.word_document_attempts','INSERT')
    or has_table_privilege('authenticated','public.word_document_attempts','UPDATE')
    or has_table_privilege('authenticated','public.word_document_attempts','DELETE')
    or has_function_privilege('anon','public.submit_word_document(uuid,jsonb)','EXECUTE') then raise exception 'FAIL permisos'; end if;
  insert into auth.users(id,email,raw_user_meta_data) values(u,'doc-test-'||u::text||'@tam.conalep.edu.mx','{}'),(other_user,'doc-test-'||other_user::text||'@tam.conalep.edu.mx','{}');
  perform set_config('request.jwt.claim.sub','',true);
  rejected := false;
  begin perform public.submit_word_document(gen_random_uuid(),d); exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL anónimo'; end if;
  perform set_config('request.jwt.claim.sub',u::text,true);
  r := public.submit_word_document(first_id,d); if r.score <> 100 then raise exception 'FAIL score100'; end if;
  r := public.submit_word_document(first_id,'[]'); if r.score <> 100 then raise exception 'FAIL idempotencia'; end if;
  r := public.submit_word_document(gen_random_uuid(),jsonb_set(d,'{0,align}','"left"')); if r.score <> 85 then raise exception 'FAIL score85'; end if;
  r := public.submit_word_document(gen_random_uuid(),jsonb_set(jsonb_set(d,'{0,align}','"left"'),'{0,runs,0,bold}','false')); if r.score <> 70 then raise exception 'FAIL score70'; end if;
  r := public.submit_word_document(gen_random_uuid(),jsonb_set(d,'{0,runs,0,text}','"Otro título"')); if r.score <> 45 then raise exception 'FAIL score45'; end if;
  r := public.submit_word_document(gen_random_uuid(),'[{"runs":[],"align":"center"},{"runs":[],"align":"left"},{"runs":[],"align":"left"}]'); if r.score <> 0 then raise exception 'FAIL score0'; end if;
  r := public.submit_word_document(gen_random_uuid(),jsonb_set(d,'{0,runs}','[{"text":"Mi perfil ","bold":true},{"text":"de estudiante","bold":false}]')); if r.score <> 85 then raise exception 'FAIL negrita parcial'; end if;
  r := public.submit_word_document(gen_random_uuid(),jsonb_set(d,'{0,runs,0,text}','" MI  PERFIL DE ESTUDIANTE "')); if r.score <> 100 then raise exception 'FAIL espacios'; end if;
  rejected := false;
  begin perform public.submit_word_document(gen_random_uuid(),'[]'); exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL forma'; end if;
  rejected := false;
  begin perform public.submit_word_document(gen_random_uuid(),jsonb_set(d,'{0,runs,0,bold}','"true"')); exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL booleano falso'; end if;
  rejected := false;
  begin perform public.submit_word_document(gen_random_uuid(),jsonb_set(d,'{0,runs,0,text}',to_jsonb(repeat('a',301)))); exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL límite'; end if;
  perform set_config('request.jwt.claim.sub',other_user::text,true);
  rejected := false;
  begin perform public.submit_word_document(first_id,d); exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL colisión entre cuentas'; end if;
  perform set_config('request.jwt.claim.sub',u::text,true);
end; $test$;
set local role authenticated;
do $rls$ begin
  if (select count(*) from public.word_document_attempts) <> 7 then raise exception 'FAIL lectura propia'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if exists(select 1 from public.word_document_attempts) then raise exception 'FAIL aislamiento'; end if;
end; $rls$;
reset role;
select 'PASS: puntuación, validación, guardado idempotente y aislamiento. Datos de prueba revertidos.' as resultado;
rollback;
