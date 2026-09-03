import { useRef, useState } from 'react';
import WindowsRun from './windows-run';
import { wordLaunchLabels, type WordLaunchRoute } from '@/lib/word-launch';
import PracticeIcon from './practice-icon';

const wordIcon = '/1-2627/desktop/word.svg';
export default function WindowsDesktop({ step, guided = false, correct = false, onChoose }: { step?: number; guided?: boolean; correct?: boolean; onChoose?: (answer: string) => void }) {
  const [selected, setSelected] = useState(false);
  const [launchRoute, setLaunchRoute] = useState<WordLaunchRoute | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const runButton = useRef<HTMLButtonElement>(null);
  const shortcutOpen = launchRoute !== null;
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const free = step === undefined;
  const opened = shortcutOpen || (step === 2 && correct && !dismissed);
  const menu = !opened && !runOpen && step !== undefined && (step > 0 || correct);
  function launch(route: WordLaunchRoute) { setLaunchRoute(route); setRunOpen(false); setNotice(''); }
  function openShortcut() { launch('shortcut'); }
  function openRun() { setLaunchRoute(null); setDismissed(true); setRunOpen(true); setNotice(''); }
  function closeRun() { setRunOpen(false); runButton.current?.focus(); }
  const focusClass = (target: number) => guided && !correct && step === target ? ' win-target' : '';
  return <div className="windows-practice">
    {free && <div className="desktop-instruction"><strong>Prueba tres formas de abrir Word:</strong><ol><li>Escritorio: doble clic en el acceso directo.</li><li>Ejecutar: abre el cuadro, escribe <b>WINWORD</b> y pulsa Aceptar o Enter.</li><li>Barra de tareas: un clic en el icono de Word anclado abajo.</li></ol><p>Con teclado puedes seleccionar los iconos y pulsar Enter. En pantalla táctil, selecciona el acceso directo y usa Abrir.</p></div>}
    <div className="win-launch-controls"><button ref={runButton} className="outline-button" onClick={openRun}>Abrir Ejecutar <kbd>Win + R</kbd></button><small>Usa este botón para simular el atajo: las teclas físicas pueden abrir Ejecutar en tu equipo.</small></div>
    <div className="windows-desktop" aria-label="Escritorio simulado de Windows 11">
      <div className="win-icons">
        <div className="win-shortcut win-decoration" aria-hidden="true"><span className="win-bin">♲</span><span>Papelera de reciclaje</span></div>
        <button className={`win-shortcut ${selected ? 'is-selected' : ''}`} aria-label="Word, acceso directo. Doble clic o Enter para abrir" onClick={event => { setSelected(true); if (event.detail === 0) openShortcut(); }} onDoubleClick={openShortcut}>
          <span className="win-shortcut-image"><img src={wordIcon} alt="" draggable={false}/><span className="shortcut-arrow" aria-hidden="true">↗</span></span><span>Word</span>
        </button>
        {selected && !opened && <button className="win-open-selected" onClick={openShortcut}>Abrir Word</button>}
      </div>
      {runOpen && <WindowsRun onOpenWord={() => launch('run')} onClose={closeRun}/>}
      {menu && <div className="win-start-menu">
        <form onSubmit={event => { event.preventDefault(); if (step === 1 && !correct) onChoose?.(search.trim().toLowerCase() === 'word' ? 'search-word' : 'search-other'); }}>
          <label htmlFor="windows-search">Buscar aplicaciones</label><div className={`win-search${focusClass(1)}`}><input id="windows-search" value={search} disabled={step !== 1 || correct} onChange={event => setSearch(event.target.value)} placeholder={guided ? 'Escribe Word' : 'Escribe para buscar'}/><button disabled={step !== 1 || correct} aria-label="Buscar"><PracticeIcon name="search-word"/></button></div>
        </form>
        <p>{step === 2 ? 'Mejor coincidencia' : 'Anclado'}</p>
        <button className={`win-search-result${focusClass(2)}`} disabled={correct || step !== 2} onClick={() => onChoose?.('word')}><img src={wordIcon} alt=""/><span><strong>Word</strong><small>Aplicación</small></span></button>
        {step === 2 && <button className="win-search-result" disabled={correct} onClick={() => onChoose?.('excel')}><PracticeIcon name="excel"/><span>Excel</span></button>}
        <div className="win-menu-user">◉ Estudiante <span>⏻</span></div>
      </div>}
      {opened && <div className="win-app-window" aria-label="Word abierto en el simulador">
        <div className="win-app-title"><img src={wordIcon} alt=""/><span>Word</span><button aria-label="Cerrar Word simulado" onClick={() => { setLaunchRoute(null); setSelected(false); setDismissed(true); if (step === 2 && correct) setNotice('Completaste la apertura. Pulsa Terminar debajo del escritorio.'); }}>×</button></div>
        <div className="win-app-body"><aside>Word<br/><small>Inicio<br/>Nuevo<br/>Abrir</small></aside><div><h3>Buenas tardes</h3><p>Nuevo</p><div className="win-blank-paper" aria-hidden="true"></div><strong>Documento en blanco</strong><p className="win-open-success">✓ Has abierto Word{launchRoute ? ` ${wordLaunchLabels[launchRoute]}` : ''}.</p><p>Esta es una vista de práctica. Aprenderás a crear documentos en la siguiente lección.</p>{shortcutOpen && <button className="solid-button" onClick={() => { setLaunchRoute(null); setSelected(false); }}>Volver al escritorio</button>}</div></div>
      </div>}
      <div className="win-taskbar">
        <button className={`win-start-button${focusClass(0)}`} aria-label="Inicio" title="Inicio" disabled={!free && correct} onClick={() => { if (free) setNotice('Para practicar Inicio y búsqueda, pulsa Comenzar práctica guiada debajo del escritorio.'); else onChoose?.('start'); }}><PracticeIcon name="start"/></button>
        <span className="win-task-search" aria-hidden="true"><PracticeIcon name="search-word"/> Buscar</span>
        <span className="win-pinned" aria-hidden="true"><PracticeIcon name="documents"/></span><button className={`win-pinned win-pinned-word ${opened ? 'is-running' : ''}`} aria-label="Abrir Word desde la barra de tareas" title="Word · un clic para abrir" onClick={() => launch('taskbar')}><img src={wordIcon} alt=""/></button>
        <div className="win-tray" aria-hidden="true"><span>⌃ &nbsp; ESP &nbsp; ◖))</span><span>09:41<br/>03/09/2026</span></div>
      </div>
    </div>
    <p className="win-desktop-caption" aria-live="polite">{notice || (shortcutOpen && !free ? 'Esta es otra forma válida de abrir Word; no suma puntos al reto de Inicio y búsqueda. Cierra esta ventana para continuar.' : free ? 'Exploración sin calificación · Windows 11 · Icono de Word 2019–2025' : 'Ruta de esta actividad: Inicio → buscar Word → abrir el resultado. El acceso directo, Ejecutar y el icono anclado son rutas alternativas.')}</p>
  </div>;
}
