import { useState } from 'react';
import PracticeIcon from './practice-icon';

const wordIcon = '/1-2627/desktop/word.svg';
export default function WindowsDesktop({ step, guided = false, correct = false, onChoose }: { step?: number; guided?: boolean; correct?: boolean; onChoose?: (answer: string) => void }) {
  const [selected, setSelected] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const free = step === undefined;
  const opened = shortcutOpen || (step === 2 && correct && !dismissed);
  const menu = !opened && step !== undefined && (step > 0 || correct);
  function openShortcut() { setShortcutOpen(true); setNotice(''); }
  const focusClass = (target: number) => guided && !correct && step === target ? ' win-target' : '';
  return <div className="windows-practice">
    {free && <p className="desktop-instruction"><strong>Primero, prueba el acceso directo:</strong> haz doble clic en Word. Con teclado, selecciónalo y pulsa Enter; en pantalla táctil, selecciónalo y usa Abrir.</p>}
    <div className="windows-desktop" aria-label="Escritorio simulado de Windows 11">
      <div className="win-icons">
        <div className="win-shortcut win-decoration" aria-hidden="true"><span className="win-bin">♲</span><span>Papelera de reciclaje</span></div>
        <button className={`win-shortcut ${selected ? 'is-selected' : ''}`} aria-label="Word, acceso directo. Doble clic o Enter para abrir" onClick={event => { setSelected(true); if (event.detail === 0) openShortcut(); }} onDoubleClick={openShortcut}>
          <span className="win-shortcut-image"><img src={wordIcon} alt="" draggable={false}/><span className="shortcut-arrow" aria-hidden="true">↗</span></span><span>Word</span>
        </button>
        {selected && !opened && <button className="win-open-selected" onClick={openShortcut}>Abrir Word</button>}
      </div>
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
        <div className="win-app-title"><img src={wordIcon} alt=""/><span>Word</span><button aria-label="Cerrar Word simulado" onClick={() => { setShortcutOpen(false); setSelected(false); setDismissed(true); if (step === 2 && correct) setNotice('Completaste la apertura. Pulsa Terminar debajo del escritorio.'); }}>×</button></div>
        <div className="win-app-body"><aside>Word<br/><small>Inicio<br/>Nuevo<br/>Abrir</small></aside><div><h3>Buenas tardes</h3><p>Nuevo</p><div className="win-blank-paper" aria-hidden="true"></div><strong>Documento en blanco</strong><p className="win-open-success">✓ Has abierto Word{shortcutOpen ? ' desde el acceso directo' : ''}.</p><p>Esta es una vista de práctica. Aprenderás a crear documentos en la siguiente lección.</p>{shortcutOpen && <button className="solid-button" onClick={() => { setShortcutOpen(false); setSelected(false); }}>Volver al escritorio</button>}</div></div>
      </div>}
      <div className="win-taskbar">
        <button className={`win-start-button${focusClass(0)}`} aria-label="Inicio" title="Inicio" disabled={!free && correct} onClick={() => { if (free) setNotice('Para practicar Inicio y búsqueda, pulsa Comenzar práctica guiada debajo del escritorio.'); else onChoose?.('start'); }}><PracticeIcon name="start"/></button>
        <span className="win-task-search" aria-hidden="true"><PracticeIcon name="search-word"/> Buscar</span>
        <span className="win-pinned" aria-hidden="true"><PracticeIcon name="documents"/></span><span className="win-pinned" aria-hidden="true"><img src={wordIcon} alt=""/></span>
        <div className="win-tray" aria-hidden="true"><span>⌃ &nbsp; ESP &nbsp; ◖))</span><span>09:41<br/>03/09/2026</span></div>
      </div>
    </div>
    <p className="win-desktop-caption" aria-live="polite">{notice || (shortcutOpen && !free ? 'Esta es otra forma válida de abrir Word; no suma puntos al reto de Inicio y búsqueda. Cierra esta ventana para continuar.' : free ? 'Exploración sin calificación · Windows 11 · Icono de Word 2019–2025' : 'Ruta de esta actividad: Inicio → buscar Word → abrir el resultado. El acceso directo es una ruta alternativa.')}</p>
  </div>;
}
