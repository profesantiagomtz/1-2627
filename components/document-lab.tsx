import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { blankDocument, documentScore, evaluateDocument, type PracticeDocument } from '@/lib/document-practice';
import DocumentEditor from './document-editor';
import '@/app/document-lab.css';

type Attempt = { id: string; score: number; created_at: string };
const instructions = [
  ['Escribe tu título', 'Dentro de la página blanca, haz clic en el espacio bajo «1. Título». Escribe Mi presentación, sin comillas. Verás las palabras en la página. Si te equivocas, usa Retroceso para borrar y vuelve a escribir.'],
  ['Agrega tu nombre y grupo', 'Pulsa Enter para pasar al segundo párrafo, o haz clic bajo «2. Nombre». Escribe Nombre: y después tu nombre. Pulsa Enter otra vez y escribe Grupo: 311 en el tercer párrafo. Por ejemplo: Nombre: Ana López.'],
  ['Selecciona el título', 'Vuelve al primer párrafo. Coloca el puntero antes de la M, mantén presionado el botón izquierdo y arrastra hasta el final de presentación. Suelta el botón: el texto seleccionado queda resaltado. También puedes hacer clic en ese párrafo y pulsar Seleccionar párrafo en la barra de herramientas; esta alternativa sirve con teclado o pantalla táctil.'],
  ['Aplica negrita', 'Con todo el título seleccionado, pulsa Negrita (N) en la barra superior del simulador. Las letras se verán más gruesas. Si solo cambia una parte, selecciona el título completo y vuelve a aplicar. Pulsar Negrita con toda la selección ya en negrita quita el formato.'],
  ['Centra y comprueba', 'Haz clic dentro del título y pulsa Centrar en la barra superior. El título se colocará en el centro del ancho de su párrafo. No uses espacios para centrarlo. Pulsa Comprobar mi práctica; revisa las observaciones, corrige y vuelve a comprobar. Deshacer revierte el último cambio.'],
];
export default function DocumentLab({ userId }: { userId?: string }) {
  const [mode, setMode] = useState<'guided' | 'challenge'>('guided');
  const [doc, setDoc] = useState<PracticeDocument>(blankDocument);
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [serverScore, setServerScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reload, setReload] = useState(0);
  const busy = useRef(false);
  const alive = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const guided = mode === 'guided';
  const criteria = evaluateDocument(doc, guided);
  const score = documentScore(doc, guided);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    setAttempts([]); setBest(null); setHistoryError(false);
    if (!userId) return;
    setHistoryLoading(true);
    void Promise.all([
      supabase.from('word_document_attempts').select('id,score,created_at').eq('student_id', userId).order('created_at', { ascending: false }).order('id').limit(10),
      supabase.from('word_document_attempts').select('score').eq('student_id', userId).order('score', { ascending: false }).limit(1),
    ]).then(([recent, highest]) => {
      if (cancelled) return;
      if (recent.error || highest.error) throw new Error('Historial no disponible');
      setAttempts(recent.data ?? []); setBest(highest.data?.[0]?.score ?? null);
    }).catch(() => { if (!cancelled) setHistoryError(true); }).finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [userId, reload]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (doc.some(p => p.runs.length) && saveState !== 'saved') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [doc, saveState]);
  function begin(next: 'guided' | 'challenge') {
    if (busy.current) return;
    if (doc.some(p => p.runs.length) && saveState !== 'saved' && !window.confirm('Se limpiará el documento de esta pantalla para empezar desde cero. ¿Continuar?')) return;
    setMode(next); setDoc(blankDocument()); setChecked(false); setSubmitted(false); setSaveState('idle'); setServerScore(null);
    setRequestId(crypto.randomUUID()); setEditorKey(k => k + 1); heading.current?.focus();
  }
  async function save() {
    if (!userId || !submitted || guided || busy.current || saveState === 'saved') return;
    busy.current = true; setSaveState('saving');
    try {
      const { data, error } = await supabase.rpc('submit_word_document', { p_id: requestId, p_document: doc });
      if (!alive.current) return;
      if (error || !data) throw new Error('No se guardó');
      const attempt = data as Attempt;
      setServerScore(attempt.score); setSaveState('saved');
      setAttempts(items => [attempt, ...items.filter(item => item.id !== attempt.id)].slice(0, 10));
      setBest(previous => Math.max(previous ?? 0, attempt.score));
    } catch { if (alive.current) setSaveState('error'); } finally { busy.current = false; }
  }
  return <section className="document-lab" id="documento-practico" aria-label="Taller de documento editable">
    <header className="document-lab-heading"><div><p className="lesson-kicker">DEL BOTÓN AL RESULTADO · PRÁCTICA 01</p><h2 ref={heading} tabIndex={-1}>Crea tu presentación personal</h2><p>Escribe, selecciona y da formato. Se evalúa tu documento terminado, no tus clics.</p></div><span className="course-badge">15–20 MIN · DESDE CERO</span></header>
    <div className="document-mode"><strong>{guided ? '1. Practica con ayuda' : '2. Demuestra lo aprendido'}</strong><span>{guided ? 'Puedes comprobar y corregir sin calificación.' : 'Sin guía de ubicación · Cada criterio tiene un valor.'}</span></div>
    <div className="document-task-grid"><aside className="document-task">
      <h3>{guided ? 'Tu misión, paso a paso' : 'Tu encargo'}</h3>
      {guided ? <><p>Crea una presentación breve. Trabaja solo dentro del simulador: ya dejamos el documento abierto para concentrarnos en escribir y dar formato.</p><ol className="document-guide">{instructions.map(([title, text]) => <li key={title}><strong>{title}</strong><p>{text}</p></li>)}</ol><details><summary>Ver un ejemplo del resultado</summary><div className="document-example"><strong>Mi presentación</strong><p>Nombre: Ana López</p><p>Grupo: 311</p></div><p>Escribe tu propio nombre en lugar de Ana López. El título va centrado y en negrita.</p></details></> : <><p>Prepara un documento para presentarte ante tu grupo. Debe tener tres párrafos, en este orden:</p><ol><li>Título: <strong>Mi perfil de estudiante</strong>, completo en negrita y centrado.</li><li><strong>Nombre:</strong> seguido de tu nombre.</li><li><strong>Grupo: 311</strong>.</li></ol><p>No escribas comillas ni la palabra «Título:». Los espacios exteriores y las mayúsculas no afectan la nota. El nombre debe tener al menos dos caracteres después de «Nombre: ».</p><p>Puedes corregir libremente antes de entregar. No hay cronómetro ni penalización por explorar. Al entregar se revisa el resultado y el documento queda bloqueado.</p></>}
      <div className="document-rubric"><h4>Qué se comprueba</h4><ul>{criteria.map(c => <li key={c.label}><span>{c.label}</span><b>{c.points} pts</b></li>)}</ul><p>70/100: actividad superada. No sustituye una calificación oficial.</p></div>
    </aside><div className="document-work"><DocumentEditor key={editorKey} locked={submitted} onChange={next => { setDoc(next); setChecked(false); }}/>
      {!submitted && <button className="solid-button document-check" onClick={() => { if (guided) setChecked(true); else if (window.confirm('¿Entregar este documento? Se evaluará tal como está y ya no podrás editar este intento.')) { setChecked(true); setSubmitted(true); } }}>{guided ? 'Comprobar mi práctica' : 'Entregar y ver mi resultado'}</button>}
      {checked && <section className="document-report" aria-live="polite"><p className="lesson-kicker">{guided ? 'REVISIÓN DE PRÁCTICA · NO SE GUARDA' : 'RESULTADO DEL DOCUMENTO'}</p><h3>{guided ? `${criteria.filter(c => c.passed).length} de 5 objetivos logrados` : `${serverScore ?? score}/100 · ${(serverScore ?? score) >= 70 ? 'Actividad superada' : 'Sigue practicando'}`}</h3><ul>{criteria.map(c => <li key={c.label} className={c.passed ? 'met' : 'unmet'}><strong>{c.passed ? '✓ Logrado' : '↻ Por corregir'} · {c.label}</strong>{!c.passed && <p>{c.help}</p>}</li>)}</ul>
        {guided ? <p>{score === 100 ? 'Ya completaste la práctica. El reto comenzará con una página vacía y un título diferente.' : 'Corrige en el documento y vuelve a pulsar Comprobar mi práctica. No se descuenta ningún punto.'}</p> : <><p>{saveState === 'saved' ? '✓ Guardado en tu cuenta. Puedes cerrar esta práctica.' : saveState === 'error' ? 'No pudimos guardar. Mantén esta página abierta y reintenta; no se duplicará el intento.' : 'Este resultado aún no está guardado. Pulsa Guardar mi resultado y espera la confirmación.'}</p>{saveState !== 'saved' && <button className="solid-button" disabled={saveState === 'saving' || !userId} onClick={save}>{saveState === 'saving' ? 'Guardando…' : saveState === 'error' ? 'Reintentar guardado' : 'Guardar mi resultado'}</button>}</>}
      </section>}
      <div className="document-next">{guided ? checked && score === 100 && (userId ? <button className="solid-button" onClick={() => begin('challenge')}>Iniciar reto con documento vacío →</button> : <a href="#acceso">Inicia sesión para realizar y guardar el reto</a>) : <><button className="text-button" disabled={saveState === 'saving'} onClick={() => begin('guided')}>Volver a practicar con ayuda</button>{submitted && <button className="text-button" disabled={saveState === 'saving'} onClick={() => begin('challenge')}>Nuevo intento desde cero</button>}</>}
        <p>El borrador no se guarda automáticamente. Tu resultado y el documento entregado se guardan únicamente al confirmar el guardado del reto.</p></div>
    </div></div>
    <section className="document-history"><h3>Mis resultados de esta actividad</h3><p>Mejor calificación: <strong>{best === null ? 'Sin intentos guardados' : `${best}/100`}</strong>. Este taller tiene su propio historial; no modifica tus notas de las tres lecciones iniciales.</p>{historyLoading && <p role="status">Cargando resultados…</p>}{historyError && <p role="alert">No se pudo cargar el historial. <button className="text-button" onClick={() => setReload(v => v + 1)}>Reintentar</button></p>}{!userId && <p>Inicia sesión para consultar tus resultados.</p>}{attempts.length > 0 && <ol>{attempts.map(a => <li key={a.id}><strong>{a.score}/100</strong><span>{new Date(a.created_at).toLocaleString('es-MX')}</span></li>)}</ol>}</section>
  </section>;
}
