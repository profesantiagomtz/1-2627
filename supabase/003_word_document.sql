-- Nueva práctica por resultado. No modifica las notas ni las tablas anteriores.
begin;
create table public.word_document_attempts (
  id uuid primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  document jsonb not null,
  score integer not null check (score between 0 and 100),
  created_at timestamptz not null default now()
);
create index word_document_student_idx on public.word_document_attempts(student_id, created_at);
alter table public.word_document_attempts enable row level security;
revoke all on public.word_document_attempts from public, anon, authenticated;
grant select on public.word_document_attempts to authenticated;
create policy word_document_read_own on public.word_document_attempts for select to authenticated using (student_id = auth.uid());
create function public.submit_word_document(p_id uuid, p_document jsonb)
returns public.word_document_attempts language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_result public.word_document_attempts;
  v_p jsonb; v_r jsonb; v_text text; v_texts text[] := array[]::text[];
  v_title_bold boolean := true; v_score integer := 0; i integer;
begin
  if v_user is null then raise exception 'Debes iniciar sesión'; end if;
  if p_id is null then raise exception 'Falta el identificador'; end if;
  select * into v_result from public.word_document_attempts where id = p_id and student_id = v_user;
  if found then return v_result; end if;
  if p_document is null or jsonb_typeof(p_document) <> 'array' then raise exception 'Documento inválido'; end if;
  if jsonb_array_length(p_document) <> 3 or octet_length(p_document::text) > 50000 then raise exception 'Se requieren tres párrafos'; end if;
  for i in 0..2 loop
    v_p := p_document->i;
    if jsonb_typeof(v_p) <> 'object' or coalesce(v_p->>'align','') not in ('left','center') or coalesce(jsonb_typeof(v_p->'runs'),'') <> 'array' then raise exception 'Párrafo inválido'; end if;
    if jsonb_array_length(v_p->'runs') > 300 then raise exception 'Demasiados fragmentos'; end if;
    v_text := '';
    for v_r in select value from jsonb_array_elements(v_p->'runs') loop
      if jsonb_typeof(v_r) <> 'object' or coalesce(jsonb_typeof(v_r->'text'),'') <> 'string' or coalesce(jsonb_typeof(v_r->'bold'),'') <> 'boolean' then raise exception 'Texto inválido'; end if;
      v_text := v_text || (v_r->>'text');
      if i = 0 and btrim(regexp_replace(v_r->>'text', '\s+', ' ', 'g')) <> '' and not (v_r->>'bold')::boolean then v_title_bold := false; end if;
    end loop;
    if length(v_text) > 300 then raise exception 'Máximo 300 caracteres por párrafo'; end if;
    v_texts := array_append(v_texts, lower(btrim(regexp_replace(v_text, '\s+', ' ', 'g'))));
  end loop;
  if v_texts[1] = 'mi perfil de estudiante' then
    v_score := v_score + 25;
    if v_title_bold then v_score := v_score + 15; end if;
    if p_document->0->>'align' = 'center' then v_score := v_score + 15; end if;
  end if;
  if v_texts[2] ~ '^nombre: .{2,}$' then v_score := v_score + 25; end if;
  if v_texts[3] = 'grupo: 311' then v_score := v_score + 20; end if;
  insert into public.word_document_attempts(id, student_id, document, score)
    values(p_id, v_user, p_document, v_score) on conflict(id) do nothing returning * into v_result;
  if v_result.id is null then
    select * into v_result from public.word_document_attempts where id = p_id and student_id = v_user;
    if not found then raise exception 'Identificador no válido'; end if;
  end if;
  return v_result;
end;
$$;
revoke all on function public.submit_word_document(uuid,jsonb) from public, anon;
grant execute on function public.submit_word_document(uuid,jsonb) to authenticated;
commit;
