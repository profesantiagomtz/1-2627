'use client';

import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AccountAccess from '@/components/account-access';

type Activity = { id: number; code: string; unit: number; title: string; weight: number; sort_order: number };

const units = [
  { number: '01', title: 'Procesador de texto', hours: 44, color: '#0f766e', outcomes: ['Formato y estilos', 'Inserción de objetos', 'Correspondencia y colaboración'] },
  { number: '02', title: 'Presentaciones electrónicas', hours: 25, color: '#d97706', outcomes: ['Diseño y plantillas', 'Objetos, animación y transición'] },
  { number: '03', title: 'Hoja de cálculo', hours: 55, color: '#2563eb', outcomes: ['Formato de libros', 'Fórmulas y funciones', 'Gráficas y macros', 'Tablas dinámicas y protección'] },
  { number: '04', title: 'Internet y comunicación', hours: 20, color: '#7c3aed', outcomes: ['Navegación segura', 'Configuración de correo', 'Comunicación en línea'] },
];

const preview: Activity[] = [
  { id: 1, code: '1.1.1', unit: 1, title: 'Documento con formato establecido', weight: 5, sort_order: 1 },
  { id: 2, code: '1.2.1', unit: 1, title: 'Documento con tablas, imágenes y referencias', weight: 10, sort_order: 2 },
  { id: 3, code: '1.3.1', unit: 1, title: 'Combinación de correspondencia y colaboración', weight: 10, sort_order: 3 },
];

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [activities, setActivities] = useState<Activity[]>(preview);
  const [completed, setCompleted] = useState<number[]>([]);
  const [activeUnit, setActiveUnit] = useState(0);
  const [simulator, setSimulator] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setCompleted([]); setActivities(preview); setSimulator(false); return; }
    Promise.all([
      supabase.from('activities').select('id,code,unit,title,weight,sort_order').order('sort_order'),
      supabase.from('submissions').select('activity_id').in('status', ['submitted', 'graded']),
    ]).then(([a, s]) => {
      if (a.data?.length) setActivities(a.data as Activity[]);
      setCompleted((s.data ?? []).map((item) => item.activity_id));
    });
  }, [session]);

  const visible = useMemo(() => activities.filter((item) => item.unit === activeUnit + 1), [activities, activeUnit]);
  const progress = Math.round((completed.length / 12) * 100);


  async function finishSimulator() {
    const key = { orientation: 'vertical', margins: 'normal', header: 'titulo', watermark: 'borrador' };
    const result = Object.entries(key).filter(([field, value]) => answers[field] === value).length * 25;
    setScore(result);
    if (!session || !activities[0]) return;
    const { data: attempt } = await supabase.from('attempts').insert({ activity_id: activities[0].id, student_id: session.user.id, attempt_number: Date.now() % 30000, answers, score: result, feedback: [result === 100 ? 'Configuración correcta' : 'Revisa las opciones'], completed_at: new Date().toISOString() }).select('id').single();
    await supabase.from('submissions').upsert({ activity_id: activities[0].id, student_id: session.user.id, best_attempt_id: attempt?.id, status: 'submitted', score: result, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'activity_id,student_id' });
    setCompleted((current) => current.includes(activities[0].id) ? current : [...current, activities[0].id]);
  }

  return <main>
    <header className="topbar"><a className="brand" href="#inicio"><span className="brand-mark">E</span><span><strong>EDOA</strong><small>Grupo 311</small></span></a><nav><a href="#ruta">Ruta</a><a href="#actividades">Actividades</a><a href="#asesoria">Asesoría</a></nav>{session ? <button className="profile" onClick={() => supabase.auth.signOut()}>Salir</button> : <a className="profile" href="#acceso">Ingresar</a>}</header>

    <section className="dashboard" id="inicio"><div className="welcome"><p className="eyebrow">EDOA · CICLO 2026–2027</p><h1>{session ? 'Tu espacio de trabajo, grupo 311.' : 'Aprende, practica y avanza.'}</h1><p>{session ? session.user.email : 'Plataforma de Elaboración de documentos digitales avanzados.'}</p></div><aside className="course-progress"><div><span>Avance del módulo</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }}/></div><small>{completed.length} de 12 evidencias registradas</small></aside></section>

    <AccountAccess session={session} />

    <section className="focus-grid"><article className="focus-card"><div className="focus-copy"><p className="eyebrow light">SIMULADOR DISPONIBLE</p><span className="unit-label">Actividad 1.1.1 · Valor 5%</span><h2>Prepara un documento profesional</h2><p>Practica orientación, márgenes, encabezado y marca de agua antes de trabajar en Word.</p><button className="primary-button" onClick={() => session ? setSimulator(true) : document.getElementById('acceso')?.scrollIntoView()}>Abrir simulador <span>→</span></button></div><div className="document-art" aria-hidden="true"><span className="sheet back"/><span className="sheet front"><i/><i/><i/><b/><i/></span></div></article><aside className="next-card"><p className="eyebrow">CÓMO FUNCIONA</p><div className="date-chip"><strong>01</strong><span>PASO</span></div><h3>Practica y recibe retroalimentación</h3><p>Tu mejor resultado queda guardado.</p><div className="tip"><span>✓</span> Puedes repetir el simulador para mejorar tu dominio.</div></aside></section>

    <section className="section" id="ruta"><div className="section-heading"><div><p className="eyebrow">PROGRAMA EDOA-20</p><h2>Ruta de aprendizaje</h2></div><span>144 horas · 4 unidades</span></div><div className="unit-tabs" role="tablist">{units.map((unit, index) => <button key={unit.number} className={activeUnit === index ? 'active' : ''} onClick={() => setActiveUnit(index)} role="tab" aria-selected={activeUnit === index}><span style={{ background: unit.color }}>{unit.number}</span><div><strong>{unit.title}</strong><small>{unit.hours} horas</small></div></button>)}</div><div className="unit-detail" style={{ '--unit-color': units[activeUnit].color } as React.CSSProperties}><div><p>UNIDAD {units[activeUnit].number}</p><h3>{units[activeUnit].title}</h3><span>{units[activeUnit].hours} horas de aprendizaje</span></div><ol>{units[activeUnit].outcomes.map((outcome, index) => <li key={outcome}><span>{activeUnit + 1}.{index + 1}</span>{outcome}</li>)}</ol></div></section>

    <section className="section evidence-section" id="actividades"><div className="section-heading"><div><p className="eyebrow">UNIDAD {activeUnit + 1}</p><h2>Actividades y evidencias</h2></div><span>{session ? 'Tu avance se guarda automáticamente' : 'Ingresa para trabajar'}</span></div><div className="evidence-list">{visible.map((item) => <article key={item.id} className={completed.includes(item.id) ? 'evidence done' : 'evidence'}><span className="custom-check">✓</span><span className="code">{item.code}</span><span className="evidence-title"><strong>{item.title}</strong><small>{completed.includes(item.id) ? 'Entregada' : item.code === '1.1.1' ? 'Simulador disponible' : 'Próximamente'}</small></span><b>{item.weight}%</b></article>)}</div></section>

    <section className="advisor" id="asesoria"><div><p className="eyebrow light">TU GRUPO, TU ACOMPAÑAMIENTO</p><h2>No caminas solo en este semestre.</h2><p>Además de ser tu profesor de EDOA, soy el asesor del grupo 311. Si algo académico o personal está frenando tu avance, podemos revisarlo a tiempo.</p></div><div className="advisor-actions"><a href="#inicio" className="light-button">Volver al inicio <span>↑</span></a><small>Acércate también al terminar la clase</small></div></section>
    <footer><strong>EDOA · Grupo 311</strong><span>Elaboración de documentos digitales avanzados</span><small>CONALEP · 2026–2027</small></footer>

    {simulator && <div className="modal-backdrop" onMouseDown={() => setSimulator(false)}><section className="simulator" role="dialog" aria-modal="true" aria-labelledby="sim-title" onMouseDown={(e) => e.stopPropagation()}><button className="close" onClick={() => setSimulator(false)} aria-label="Cerrar">×</button><p className="eyebrow">SIMULADOR 1.1.1</p><h2 id="sim-title">Configura el documento solicitado</h2><p className="instruction">Carta formal vertical, márgenes normales, título del grupo en el encabezado y marca de agua “Borrador”.</p><div className="sim-grid">{[
      ['orientation','Orientación',[['vertical','Vertical'],['horizontal','Horizontal']]], ['margins','Márgenes',[['normal','Normales'],['estrecho','Estrechos']]], ['header','Encabezado',[['titulo','EDOA · Grupo 311'],['ninguno','Sin encabezado']]], ['watermark','Marca de agua',[['borrador','Borrador'],['confidencial','Confidencial']]],
    ].map(([field,label,options]) => <fieldset key={field as string}><legend>{label as string}</legend>{(options as string[][]).map(([value,text]) => <label key={value}><input type="radio" name={field as string} checked={answers[field as string] === value} onChange={() => setAnswers({...answers,[field as string]:value})}/><span>{text}</span></label>)}</fieldset>)}</div><button className="submit-sim" onClick={finishSimulator}>Calificar y guardar</button>{score !== null && <div className={score === 100 ? 'result success' : 'result'}><strong>Resultado: {score}/100</strong><span>{score === 100 ? '¡Excelente! La configuración es correcta.' : 'Revisa tus elecciones y vuelve a intentarlo.'}</span></div>}</section></div>}
  </main>;
}
