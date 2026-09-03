import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { scoreResponses, type Lesson, type PracticeAttempt } from '@/lib/word-lessons';
import PracticeIcon from './practice-icon';
import WindowsDesktop from './windows-desktop';
import { practiceGuidance } from '@/lib/practice-guidance';

type Phase = 'read' | 'guided' | 'ready' | 'challenge' | 'result';
export default function WordLab({ lesson, userId, onSaved }: { lesson: Lesson; userId?: string; onSaved: (attempt: PracticeAttempt) => void }) {
  const [phase, setPhase] = useState<Phase>('read');
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [correct, setCorrect] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [requestId, setRequestId] = useState('');
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const busy = useRef(false);
  const mounted = useRef(true);
  const firstChoice = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = lesson.steps[step];
  const guided = phase === 'guided';
  const active = guided || phase === 'challenge';
  const score = phase === 'result' ? scoreResponses(lesson, responses) : 0;

  useEffect(() => { heading.current?.focus(); }, [phase, step]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  function begin(next: 'guided'|'challenge') {
    setStep(0); setResponses([]); setCorrect(false); setFeedback('');
    setSaveState('idle'); setSavedScore(null); firstChoice.current = null;
    setRequestId(crypto.randomUUID()); setPhase(next);
  }
  function choose(target: string) {
    if (!active || correct) return;
    if (firstChoice.current === null) firstChoice.current = target;
    if (target === current.target) {
      setCorrect(true); setFeedback(current.feedback);
    } else {
      setFeedback(`Todavía no. ${current.hint}${guided ? '' : ' Puedes corregir; para la nota cuenta tu primera elección de este paso.'}`);
    }
  }
  function next() {
    const updated = [...responses, firstChoice.current ?? ''];
    setResponses(updated);
    if (step === lesson.steps.length - 1) setPhase(guided ? 'ready' : 'result');
    else setStep(step + 1);
    firstChoice.current = null; setCorrect(false); setFeedback('');
  }
  async function save() {
    if (!userId || busy.current || saveState === 'saved') return;
    busy.current = true; setSaveState('saving');
    try {
      const { data, error } = await supabase.rpc('submit_word_practice', { p_id: requestId, p_lesson: lesson.id, p_responses: responses });
      if (!mounted.current) return;
      if (error || !data) throw error ?? new Error('Sin respuesta');
      const attempt = data as PracticeAttempt;
      setSavedScore(attempt.score); setSaveState('saved'); onSaved(attempt);
    } catch {
      if (!mounted.current) return;
      setSaveState('error');
      setSaveMessage('No se pudo guardar. Conservamos este resultado mientras permanezcas aquí. Comprueba tu conexión y reintenta; no se duplicará el intento.');
    } finally { busy.current = false; }
  }

  function targetClass(target: string) { return guided && !correct && current?.target === target ? 'guided-target' : ''; }
  const cue = (target: string) => guided && !correct && current.target === target ? <span className="click-cue" aria-hidden="true"><PracticeIcon name="click"/>Haz clic aquí ↓</span> : null;
  const action = (target: string, label: string, className = '') => <button disabled={correct} className={`${className} sim-action ${targetClass(target)}`} onClick={() => choose(target)}>{cue(target)}<PracticeIcon name={target}/><span>{label}</span></button>;

  return <section className="lesson-workspace" aria-label={lesson.title}>
    <div className="lesson-topline"><span>WORD / PRIMEROS PASOS</span><span>{phase === 'challenge' ? 'Reto evaluado' : phase === 'guided' ? 'Práctica sin calificación' : 'Aprende a tu ritmo'}</span></div>
    <h2 ref={heading} tabIndex={-1}>{lesson.title}</h2>
    <ol className="phase-track" aria-label="Etapas de la lección">{['Aprende', 'Practica', 'Demuestra'].map((label, index) => <li key={label} className={(phase === 'read' ? 0 : phase === 'guided' || phase === 'ready' ? 1 : 2) === index ? 'current' : ''}><span>{index + 1}</span>{label}</li>)}</ol>

    {phase === 'read' && <div className="lesson-intro"><p className="lesson-kicker">ANTES DE HACERLO</p><p>{lesson.concept}</p><div className="visual-route" aria-label="Los pasos que vas a practicar">{lesson.steps.map((item, index) => <div key={item.target}><span className="route-icon"><PracticeIcon name={item.target}/></span><small>PASO {index + 1}</small><strong>{practiceGuidance[item.target].label}</strong></div>)}</div><p className="note">Simulación educativa simplificada de Word para Windows. Algunas posiciones cambian según la versión. No necesitas tener Word instalado para esta práctica.</p>{lesson.id === 'word-start' && <WindowsDesktop/>}<button className="solid-button" onClick={() => begin('guided')}>Comenzar práctica guiada →</button></div>}

    {active && <><div className="mission"><PracticeIcon name={guided ? current.target : 'click'}/><div><span>{guided ? 'HAZLO AQUÍ · PRÁCTICA CON AYUDA' : 'AHORA TÚ · SIN SEÑALES DE AYUDA'} · {step + 1}/{lesson.steps.length}</span><h3>{correct ? '¡Bien hecho! Continúa con el botón de abajo.' : guided ? practiceGuidance[current.target].instruction : current.goal}</h3><p>{guided ? 'Usa el simulador de esta página, no el menú de tu computadora. Un clic es suficiente.' : 'Haz clic en la zona que resuelve la indicación. Cuenta tu primera elección.'}</p></div></div>
      <div className="simulation-scroll"><div className="simulation-frame">
        <div className="sim-caption"><span><PracticeIcon name="click"/> SIMULADOR INTERACTIVO</span><span>{guided ? 'Sigue la señal naranja' : 'Selecciona tu respuesta'}</span></div>
        {lesson.id === 'word-start' && <WindowsDesktop key={`${phase}-${step}`} step={step} guided={guided} correct={correct} onChoose={choose}/>}
        {lesson.id === 'word-create' && <div className="word-start-screen"><div className="word-side"><strong>Word</strong>{action('home','Inicio')}{action('new','Nuevo')}{action('open','Abrir')}</div><div className="word-templates"><h4>{step === 3 ? 'Abrir un archivo' : 'Elige tu punto de partida'}</h4>{step === 3 ? <div className="file-list">{action('file-pdf','Lectura.pdf')}{action('file-practica','Mi práctica.docx')}{action('file-excel','Presupuesto.xlsx')}</div> : <div className="template-list"><button disabled={correct} className={targetClass('blank')} onClick={() => choose('blank')}>{cue('blank')}<span className="template-symbol"><PracticeIcon name="blank"/></span><strong>Documento en blanco</strong><small>Una página para empezar de cero</small></button><button disabled={correct} className={targetClass('template')} onClick={() => choose('template')}>{cue('template')}<span className="template-symbol"><PracticeIcon name="template"/></span><strong>Carta sencilla</strong><small>Plantilla con estructura inicial</small></button></div>}{correct && <div className="opened-document" role="status">{step === 0 ? 'Documento1 · Página en blanco creada' : step === 1 ? 'Carta sencilla · Plantilla lista para personalizar' : step === 2 ? 'Buscador de archivos abierto' : 'Mi práctica.docx · Documento recuperado'}</div>}</div></div>}
        {lesson.id === 'word-interface' && <div className="word-window">
          {action('title','Mi práctica.docx — Word', 'word-title')}
          {action('tabs','Archivo     Inicio     Insertar     Diseño     Disposición     Revisar     Vista', 'word-tabs')}
          {action('ribbon','Pegar   │   Aptos   12   │   N   K   S   │   Alinear   •   Interlineado   │   Estilos', 'word-ribbon')}
          <div className="document-canvas"><button disabled={correct} className={`word-page ${targetClass('page')}`} onClick={() => choose('page')}>{cue('page')}<span>Mi primer documento</span><p>Estoy aprendiendo a orientarme en Word.</p><p>Aquí escribiré mis ideas y daré forma a mis trabajos.</p><span className="text-caret" aria-hidden="true">|</span></button></div>
          <div className="word-bottom">{action('status','Página 1 de 1 · 23 palabras', 'word-status')}{action('zoom','− ━━━●━━ +   100%', 'word-zoom')}</div>
        </div>}
      </div></div>
      <div className={`lesson-feedback ${correct ? 'correct' : ''}`} aria-live="polite"><span className="feedback-symbol" aria-hidden="true">{correct ? '✓' : '↳'}</span><p>{feedback || (guided ? 'Busca la señal «Haz clic aquí» dentro del simulador.' : 'Realiza la acción. Cuenta la primera elección de cada paso.')}</p>{correct && <button className="solid-button" onClick={next}>{step === lesson.steps.length - 1 ? 'Terminar' : 'Siguiente paso'} →</button>}</div>
    </>}

    {phase === 'ready' && <div className="lesson-intro"><p className="lesson-kicker">YA LO PRACTICASTE</p><h3>Ahora demuéstralo sin las marcas de ayuda.</h3><p>Cada paso vale lo mismo. La primera elección determina los puntos; si te equivocas podrás corregir para aprender. Con 70/100 o más completas la lección. Siempre se conserva tu mejor resultado.</p>{userId ? <button className="solid-button" onClick={() => begin('challenge')}>Iniciar reto evaluado →</button> : <a className="solid-button" href="#acceso">Inicia sesión para guardar tu calificación</a>}<button className="text-button" onClick={() => begin('guided')}>Repetir práctica guiada</button></div>}

    {phase === 'result' && <div className="lesson-result"><p className="lesson-kicker">RETO TERMINADO</p><div className="result-number">{savedScore ?? score}<small>/100</small></div><h3>{(savedScore ?? score) >= 70 ? '¡Lección superada!' : 'Vas aprendiendo. Inténtalo otra vez.'}</h3><p>{responses.filter((answer, index) => answer === lesson.steps[index].target).length} de {lesson.steps.length} pasos correctos a la primera.</p><ul className="result-checks">{lesson.steps.map((item, index) => <li key={item.target}><span>{responses[index] === item.target ? '✓' : '↻'}</span>{item.feedback}</li>)}</ul><p className="note">Resultado formativo. No sustituye la calificación oficial de una evidencia.</p><div aria-live="polite">{saveState === 'saved' ? <p className="saved-confirmation">✓ Guardado en tu cuenta. Tu avance ya está actualizado.</p> : <><p>{saveState === 'error' ? saveMessage : 'Guarda este intento para actualizar tu avance y desbloquear la siguiente lección.'}</p><button className="solid-button" disabled={saveState === 'saving'} onClick={save}>{saveState === 'saving' ? 'Guardando…' : saveState === 'error' ? 'Reintentar guardado' : 'Guardar mi resultado'}</button></>}</div>{saveState === 'saved' && <button className="text-button" onClick={() => begin('challenge')}>Repetir reto para mejorar</button>}<button className="text-button" onClick={() => { if (saveState === 'saved' || window.confirm('Este intento no está guardado. ¿Quieres descartarlo y volver a practicar?')) begin('guided'); }}>Volver a practicar</button></div>}
    <footer className="lesson-source">Material didáctico del Profe Santiago · <a href="https://support.microsoft.com/es-es/word/training/create-a-document-in-word" target="_blank" rel="noreferrer">Referencia: ayuda de Microsoft Word</a></footer>
  </section>;
}
