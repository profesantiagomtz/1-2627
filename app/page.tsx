'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AccountAccess from '@/components/account-access';
import WordLab from '@/components/word-lab';
import DocumentLab from '@/components/document-lab';
import { lessons, nextLessons, summarize, type PracticeAttempt } from '@/lib/word-lessons';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const userId = session?.user.id;
  const stats = useMemo(() => summarize(attempts), [attempts]);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAuthLoading(false); });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError('No se pudo restaurar la sesión. Vuelve a iniciar sesión.');
      setSession(data.session); setAuthLoading(false);
    }).catch(() => { setError('No se pudo restaurar la sesión. Vuelve a iniciar sesión.'); setAuthLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAttempts([]); setSelected(0); setError('');
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    async function load() {
      try {
        const rows: PracticeAttempt[] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await supabase.from('word_practice_attempts').select('id,lesson_id,score,created_at').eq('student_id', userId!).order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
          if (error) throw error;
          rows.push(...(data ?? []));
          if (!data || data.length < 500) break;
        }
        if (!cancelled) setAttempts(rows);
      } catch {
        if (!cancelled) setError('No se pudo cargar tu historial. No significa que hayas perdido tu avance. Reintenta antes de comenzar un reto.');
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, refresh]);

  function selectLesson(index: number) {
    if (index === selected) return;
    if (!window.confirm('¿Cambiar de lección? Si tienes un reto en curso, guarda su resultado antes de salir.')) return;
    setSelected(index);
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setError('No se pudo cerrar la sesión. Inténtalo de nuevo antes de dejar el equipo.');
  }
  function saved(attempt: PracticeAttempt) { setAttempts(current => [attempt, ...current.filter(item => item.id !== attempt.id)]); }

  return <main className="learning-app">
    <header className="studio-header"><a className="studio-brand" href="#aprende"><span>PS</span><div><strong>Aula del Profe Santiago</strong><small>Material didáctico · EDOA</small></div></a><nav aria-label="Navegación principal"><a href="#aprende">Mi aula</a><a href="#resultados">Resultados</a><a href="#ruta">Mi ruta</a><a href="#acceso">Mi cuenta</a></nav>{session && <button className="outline-button" onClick={signOut}>Cerrar sesión</button>}</header>
    <div className="studio-content">
      <section className="course-heading" id="aprende"><div><p className="lesson-kicker">TALLER DE DOCUMENTOS · GRUPO 311</p><h1>Mis primeros pasos en Word</h1><p>Explora las herramientas. Practica cada paso. Demuestra lo que aprendiste.</p></div><span className="course-badge">BLOQUE 01 · DESDE CERO</span></section>
      <section className="practice-stats" aria-label="Tus resultados del bloque"><div><span>Avance del bloque</span><strong>{stats.progress}%</strong><progress value={stats.progress} max={100} aria-label="Avance del bloque"/><small>{stats.completed} de {lessons.length} lecciones superadas</small></div><div><span>Calificación de práctica</span><strong>{stats.grade === null ? '—' : stats.grade}<em>/100</em></strong><small>Promedio del mejor resultado de cada lección evaluada</small></div><div><span>Intentos guardados</span><strong>{attempts.length}</strong><small>Repite para mejorar. Tu mejor nota se conserva.</small></div></section>
      {authLoading && <p role="status" className="notice-strip">Comprobando tu sesión…</p>}
      {!session && !authLoading && <p className="notice-strip">Puedes explorar la primera práctica guiada. <a href="#acceso">Inicia sesión</a> para evaluar, guardar y continuar tu ruta.</p>}
      {loading && <p role="status" className="notice-strip">Recuperando tus resultados…</p>}
      <div className="document-entry"><div><strong>Ahora practica creando un documento</strong><p>Escribe tu presentación, dale formato y comprueba el resultado. Si es tu primera vez, comienza por las lecciones de abajo.</p></div><a className="solid-button" href="#documento-practico">Ir al documento editable →</a></div>
      {error && <div role="alert" className="notice-strip warning">{error} <button className="text-button" onClick={() => setRefresh(value => value + 1)}>Reintentar</button></div>}
      <div className="course-grid"><aside className="lesson-sidebar" aria-label="Lecciones"><div className="sidebar-module"><img src="/1-2627/desktop/word.svg" alt=""/><span>Bloque 01</span><strong>Primeros pasos</strong></div><p className="lesson-kicker">TU RUTA, PASO A PASO</p><ol>{lessons.map((lesson, index) => {
        const locked = index > 0 && (stats.best[lessons[index - 1].id] ?? -1) < 70;
        return <li key={lesson.id}><button className={selected === index ? 'selected' : ''} disabled={locked || loading} aria-current={selected === index ? 'step' : undefined} onClick={() => selectLesson(index)}><span className="lesson-number">{(stats.best[lesson.id] ?? -1) >= 70 ? '✓' : `0${index + 1}`}</span><span><strong>{lesson.title}</strong><small>{locked ? 'Supera la anterior con 70/100' : stats.best[lesson.id] !== undefined ? `Mejor resultado: ${stats.best[lesson.id]}/100` : `${lesson.minutes} min · Aprende + practica`}</small></span></button></li>;
      })}</ol><div className="sidebar-note"><strong>¿Cómo avanzo?</strong><p>Completa el reto con 70/100 y guarda el resultado. Se abrirá la siguiente lección.</p><p>La práctica guiada no afecta tu nota.</p></div></aside>
      <WordLab key={`${userId ?? 'guest'}-${selected}`} lesson={lessons[selected]} userId={!loading && !error ? userId : undefined} onSaved={saved}/></div>
      <section className="learning-history" id="resultados"><div className="section-title"><div><p className="lesson-kicker">APRENDER TAMBIÉN ES INTENTAR</p><h2>Mi historial de práctica</h2></div><span>Últimos 10 intentos</span></div>{attempts.length ? <div className="history-table"><table><thead><tr><th>Lección</th><th>Resultado</th><th>Fecha</th></tr></thead><tbody>{attempts.slice(0,10).map(attempt => <tr key={attempt.id}><td>{lessons.find(lesson => lesson.id === attempt.lesson_id)?.title ?? attempt.lesson_id}</td><td><span className={attempt.score >= 70 ? 'score-chip passed' : 'score-chip'}>{attempt.score}/100</span></td><td>{new Date(attempt.created_at).toLocaleString('es-MX', { dateStyle:'medium', timeStyle:'short' })}</td></tr>)}</tbody></table></div> : <p className="empty-history">{session ? 'Cuando guardes tu primer reto aparecerá aquí. Las lecturas y las prácticas guiadas no suman puntos.' : 'Tu historial estará disponible al iniciar sesión.'}</p>}</section>
      <section className="next-route" id="ruta"><p className="lesson-kicker">LO QUE SIGUE EN TU APRENDIZAJE</p><h2>De tus primeras palabras a un documento completo</h2><p>Estas lecciones se incorporarán después. Tu avance actual corresponde únicamente a las tres lecciones del bloque inicial.</p><ol>{nextLessons.map((title,index) => <li key={title}><span>{String(index+4).padStart(2,'0')}</span><strong>{title}</strong><small>En preparación</small></li>)}</ol><details><summary>Ver la ruta completa del módulo EDOA</summary><ul><li>Procesador de texto · 44 horas</li><li>Presentaciones electrónicas · 25 horas</li><li>Hoja de cálculo · 55 horas</li><li>Internet y comunicación · 20 horas</li></ul><p>Las prácticas son preparación para las evidencias. Sus porcentajes no se suman automáticamente a una calificación oficial.</p></details></section>
      <DocumentLab key={`document-${userId ?? 'guest'}`} userId={authLoading ? undefined : userId}/>
      <AccountAccess session={session}/>
      <section className="mentor-note"><h2>Tu aprendizaje tiene acompañamiento.</h2><p>Si una actividad se te dificulta, revisa la explicación y vuelve a practicar. También puedes acercarte al Profe Santiago durante la clase o asesoría del grupo 311.</p></section>
      <footer className="studio-footer"><strong>Aula del Profe Santiago</strong><span>EDOA · Material didáctico personal · 2026–2027</span><small>Simulación educativa independiente. Word es una marca de Microsoft; no existe afiliación con Microsoft.</small></footer>
    </div>
  </main>;
}
