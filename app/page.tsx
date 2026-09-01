'use client';

import { useEffect, useMemo, useState } from 'react';

const units = [
  { number: '01', title: 'Procesador de texto', hours: 44, color: '#0f766e', outcomes: ['Formato y estilos', 'Inserción de objetos', 'Correspondencia y colaboración'] },
  { number: '02', title: 'Presentaciones electrónicas', hours: 25, color: '#d97706', outcomes: ['Diseño y plantillas', 'Objetos, animación y transición'] },
  { number: '03', title: 'Hoja de cálculo', hours: 55, color: '#2563eb', outcomes: ['Formato de libros', 'Fórmulas y funciones', 'Gráficas y macros', 'Tablas dinámicas y protección'] },
  { number: '04', title: 'Internet y comunicación', hours: 20, color: '#7c3aed', outcomes: ['Navegación segura', 'Configuración de correo', 'Comunicación en línea'] },
];

const evidence = [
  { id: 'e1', code: '1.1.1', title: 'Documento con formato establecido', weight: '5%', status: 'En curso' },
  { id: 'e2', code: '1.2.1', title: 'Documento con tablas, imágenes y referencias', weight: '10%', status: 'Próxima' },
  { id: 'e3', code: '1.3.1', title: 'Combinación de correspondencia', weight: '10%', status: 'Después' },
];

export default function Home() {
  const [done, setDone] = useState<string[]>([]);
  const [activeUnit, setActiveUnit] = useState(0);
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('edoa311-evidencias');
    if (saved) setDone(JSON.parse(saved));
  }, []);

  const toggle = (id: string) => {
    setDone((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem('edoa311-evidencias', JSON.stringify(next));
      return next;
    });
  };

  const progress = useMemo(() => Math.round((done.length / evidence.length) * 25), [done]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Ir al inicio"><span className="brand-mark">E</span><span><strong>EDOA</strong><small>Grupo 311</small></span></a>
        <nav aria-label="Navegación principal"><a href="#ruta">Ruta</a><a href="#evidencias">Evidencias</a><a href="#asesoria">Asesoría</a></nav>
        <button className="profile" onClick={() => setNotice(!notice)} aria-expanded={notice}>311 <span>⌄</span></button>
        {notice && <div className="profile-menu">Semestre 1 · Ciclo 2026–2027</div>}
      </header>

      <section className="dashboard" id="inicio">
        <div className="welcome"><p className="eyebrow">MARTES · 1 DE SEPTIEMBRE</p><h1>Qué gusto verte, grupo 311.</h1><p>Todo lo necesario para aprender, entregar y avanzar en EDOA está aquí.</p></div>
        <aside className="course-progress" aria-label="Progreso del curso"><div><span>Avance del módulo</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{done.length} de {evidence.length} evidencias iniciales completadas</small></aside>
      </section>

      <section className="focus-grid">
        <article className="focus-card">
          <div className="focus-copy"><p className="eyebrow light">ESTÁS TRABAJANDO EN</p><span className="unit-label">Unidad 1 · 44 horas</span><h2>Manejo de procesador de texto</h2><p>Da formato profesional a documentos usando estilos, plantillas y herramientas avanzadas.</p><a href="#evidencias" className="primary-button">Continuar mi actividad <span>→</span></a></div>
          <div className="document-art" aria-hidden="true"><span className="sheet back"/><span className="sheet front"><i/><i/><i/><b/><i/></span></div>
        </article>
        <aside className="next-card"><p className="eyebrow">PRÓXIMA EVIDENCIA</p><div className="date-chip"><strong>08</strong><span>SEP</span></div><h3>Documento con formato establecido</h3><p>Actividad 1.1.1 · Valor 5%</p><div className="tip"><span>✓</span> Revisa encabezado, pie de página y estilos antes de entregar.</div></aside>
      </section>

      <section className="section" id="ruta">
        <div className="section-heading"><div><p className="eyebrow">PROGRAMA EDOA-20</p><h2>Tu ruta de aprendizaje</h2></div><span>144 horas · 4 unidades</span></div>
        <div className="unit-tabs" role="tablist" aria-label="Unidades del módulo">{units.map((unit, index) => <button key={unit.number} className={activeUnit === index ? 'active' : ''} onClick={() => setActiveUnit(index)} role="tab" aria-selected={activeUnit === index}><span style={{ background: unit.color }}>{unit.number}</span><div><strong>{unit.title}</strong><small>{unit.hours} horas</small></div></button>)}</div>
        <div className="unit-detail" style={{ '--unit-color': units[activeUnit].color } as React.CSSProperties}><div><p>UNIDAD {units[activeUnit].number}</p><h3>{units[activeUnit].title}</h3><span>{units[activeUnit].hours} horas para desarrollar estas habilidades</span></div><ol>{units[activeUnit].outcomes.map((outcome, index) => <li key={outcome}><span>{activeUnit + 1}.{index + 1}</span>{outcome}</li>)}</ol></div>
      </section>

      <section className="section evidence-section" id="evidencias">
        <div className="section-heading"><div><p className="eyebrow">UNIDAD 1</p><h2>Evidencias y seguimiento</h2></div><span>Marca lo que ya entregaste</span></div>
        <div className="evidence-list">{evidence.map((item) => <label key={item.id} className={done.includes(item.id) ? 'evidence done' : 'evidence'}><input type="checkbox" checked={done.includes(item.id)} onChange={() => toggle(item.id)} /><span className="custom-check">✓</span><span className="code">{item.code}</span><span className="evidence-title"><strong>{item.title}</strong><small>{item.status}</small></span><b>{item.weight}</b></label>)}</div>
      </section>

      <section className="advisor" id="asesoria"><div><p className="eyebrow light">TU GRUPO, TU ACOMPAÑAMIENTO</p><h2>No caminas solo en este semestre.</h2><p>Además de ser tu profesor de EDOA, soy el asesor del grupo 311. Si algo académico o personal está frenando tu avance, podemos revisarlo a tiempo.</p></div><div className="advisor-actions"><a href="#inicio" className="light-button">Solicitar asesoría <span>→</span></a><small>Acércate también al terminar la clase</small></div></section>

      <footer><strong>EDOA · Grupo 311</strong><span>Elaboración de documentos digitales avanzados</span><small>CONALEP · Semestre 1 · 2026–2027</small></footer>
    </main>
  );
}
