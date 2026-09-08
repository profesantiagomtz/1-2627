import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { gradeExerciseOne, readExerciseOne } from '@/lib/exercise-one';
import '@/app/file-exercise.css';

type Result = ReturnType<typeof gradeExerciseOne>;
type SavedAttempt = { id: string; score: number; created_at: string; file_name: string };
const downloadUrl = '/1-2627/ejercicio-1-identificacion-word.docx';
export default function FileExerciseOne({ userId }: { userId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState('');
  const [reading, setReading] = useState(false);
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [attemptId, setAttemptId] = useState(() => crypto.randomUUID());
  const [attempts, setAttempts] = useState<SavedAttempt[]>([]);
  const uploaded = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    if (!userId) { setAttempts([]); return; }
    void supabase.from('word_file_attempts').select('id,score,created_at,file_name').eq('student_id', userId).eq('exercise_id','exercise-1').order('created_at',{ascending:false}).limit(10).then(({data}) => { if (!cancelled) setAttempts(data ?? []); });
    return () => { cancelled = true; };
  }, [userId]);
  async function choose(next: File | null) {
    setFile(null); setResult(null); setMessage(''); setSaveState('idle'); uploaded.current = false; setAttemptId(crypto.randomUUID());
    if (!next) return;
    if (!next.name.toLocaleLowerCase('es').endsWith('.docx')) { setMessage('Selecciona un archivo de Word con terminación .docx.'); return; }
    if (next.size > 8 * 1024 * 1024) { setMessage('El archivo pesa más de 8 MB. Abre el original, guarda los cambios y vuelve a seleccionarlo.'); return; }
    setReading(true);
    try {
      const answers = readExerciseOne(new Uint8Array(await next.arrayBuffer()));
      if (!alive.current) return;
      setFile(next); setResult(gradeExerciseOne(answers));
    } catch (error) { if (alive.current) setMessage(error instanceof Error ? error.message : 'No se pudo revisar el archivo.'); }
    finally { if (alive.current) setReading(false); }
  }
  async function save() {
    if (!userId || !file || !result || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving'); setMessage('');
    const path = `${userId}/${attemptId}.docx`;
    try {
      if (!uploaded.current) {
        const upload = await supabase.storage.from('word-exercise-submissions').upload(path, file, { contentType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', upsert:false });
        if (upload.error) throw upload.error;
        uploaded.current = true;
      }
      const answers = Object.fromEntries(result.items.map(item => [item.shape, item.value]));
      const { data, error } = await supabase.rpc('submit_word_file_exercise', { p_id:attemptId, p_exercise:'exercise-1', p_file_path:path, p_file_name:file.name.slice(0,180), p_answers:answers });
      if (error || !data) throw error ?? new Error('No se pudo guardar.');
      if (!alive.current) return;
      const saved = data as SavedAttempt;
      setSaveState('saved'); setAttempts(current => [saved, ...current.filter(item => item.id !== saved.id)].slice(0,10));
    } catch { if (alive.current) { setSaveState('error'); setMessage('No se guardó la entrega. Conserva esta pantalla y pulsa Reintentar.'); } }
  }
  return <section className="file-exercise" id="ejercicio-1">
    <header><div><p className="lesson-kicker">EJERCICIO 1</p><h2>Identifica las partes de Word</h2></div><span className="course-badge">10 PUNTOS POR RESPUESTA</span></header>
    <div className="file-steps">
      <div><span>1</span><strong>Descarga</strong><p>Abre el archivo en Word.</p><a className="solid-button" href={downloadUrl} download>Descargar ejercicio</a></div>
      <div><span>2</span><strong>Resuelve</strong><p>Escribe el número correcto en cada círculo. Guarda el archivo.</p></div>
      <div><span>3</span><strong>Entrega</strong><p>Selecciona el archivo que guardaste.</p><label className="upload-button">Seleccionar archivo<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => { const next=event.target.files?.[0] ?? null; event.target.value=''; void choose(next); }}/></label></div>
    </div>
    {reading && <p role="status" className="file-notice">Revisando archivo…</p>}
    {message && <p role="alert" className="file-notice error">{message}</p>}
    {result && <div className="file-result" aria-live="polite"><div className="file-result-score"><span>Resultado</span><strong>{result.score}<small>/100</small></strong><p>{file?.name}</p></div><div><h3>{result.score >= 70 ? 'Actividad superada' : 'Corrige y vuelve a intentarlo'}</h3><p>{result.items.filter(item => item.passed).length} de 10 respuestas correctas.</p><ul>{result.items.map(item => <li key={item.shape} className={item.passed ? 'right' : 'wrong'}><span>{item.passed ? '✓' : '×'}</span><strong>{item.label}</strong><small>{item.passed ? 'Correcta' : item.value ? `Escribiste: ${item.value}` : 'Sin respuesta'}</small></li>)}</ul>
      {userId ? <div className="file-save"><button className="solid-button" disabled={saveState === 'saving' || saveState === 'saved'} onClick={save}>{saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? '✓ Entrega guardada' : saveState === 'error' ? 'Reintentar' : 'Guardar entrega'}</button><p>{saveState === 'saved' ? 'Listo. El archivo y la calificación quedaron guardados.' : 'Tu entrega no se guarda hasta pulsar este botón.'}</p></div> : <p className="file-login"><a href="#acceso">Inicia sesión</a> para guardar tu archivo y calificación.</p>}
    </div></div>}
    <div className="file-history"><h3>Entregas guardadas</h3>{!userId ? <p>Inicia sesión para verlas.</p> : !attempts.length ? <p>Aún no tienes entregas.</p> : <ol>{attempts.map(a => <li key={a.id}><strong>{a.score}/100</strong><span>{new Date(a.created_at).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'})}</span></li>)}</ol>}</div>
  </section>;
}
