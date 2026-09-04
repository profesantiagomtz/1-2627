import { useEffect, useRef, useState } from 'react';
import { blankDocument, formatSelection, paragraphText, type PracticeDocument, type Paragraph, type Run } from '@/lib/document-practice';

const labels = ['Título', 'Nombre', 'Grupo'];
export default function DocumentEditor({ onChange, locked }: { onChange: (doc: PracticeDocument) => void; locked: boolean }) {
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const model = useRef(blankDocument());
  const selection = useRef({ line: 0, start: 0, end: 0 });
  const history = useRef<PracticeDocument[]>([]);
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState('Haz clic en el primer párrafo y escribe el título.');
  const [version, setVersion] = useState(0);

  function capture() {
    const s = window.getSelection();
    if (!s?.rangeCount) return;
    const r = s.getRangeAt(0);
    const line = nodes.current.findIndex(el => el?.contains(r.startContainer) && el.contains(r.endContainer));
    if (line < 0) return;
    const prefix = r.cloneRange(); prefix.selectNodeContents(nodes.current[line]!); prefix.setEnd(r.startContainer, r.startOffset);
    selection.current = { line, start: prefix.toString().length, end: prefix.toString().length + r.toString().length };
    setActive(line);
  }
  useEffect(() => { document.addEventListener('selectionchange', capture); return () => document.removeEventListener('selectionchange', capture); }, []);
  function renderParagraph(line: number, p: Paragraph) {
    const el = nodes.current[line]!;
    el.replaceChildren(...p.runs.map(run => { const node = document.createElement(run.bold ? 'strong' : 'span'); node.textContent = run.text; return node; }));
    el.style.textAlign = p.align;
  }
  function restore(line: number, start: number, end: number) {
    const el = nodes.current[line]!; el.focus();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(true);
    let node: Node | null; let offset = 0; let found = false;
    while ((node = walker.nextNode())) {
      const length = node.textContent?.length ?? 0;
      if (!found && start <= offset + length) { r.setStart(node, Math.max(0, start - offset)); found = true; }
      if (found && end <= offset + length) { r.setEnd(node, Math.max(0, end - offset)); break; }
      offset += length;
    }
    window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(r);
    selection.current = { line, start, end }; setActive(line);
  }
  function commit(next: PracticeDocument, redraw = false) {
    if (JSON.stringify(next) === JSON.stringify(model.current)) return;
    history.current.push(model.current); if (history.current.length > 80) history.current.shift();
    model.current = next;
    if (redraw) next.forEach((p, i) => renderParagraph(i, p));
    setVersion(v => v + 1); onChange(next);
  }
  function read(line: number) {
    const el = nodes.current[line]!; const runs: Run[] = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n: Node | null;
    while ((n = walk.nextNode())) runs.push({ text: (n.textContent ?? '').replace(/\s/g, ' '), bold: !!n.parentElement?.closest('strong, b') });
    let next: Paragraph = { ...model.current[line], runs };
    if (paragraphText(next).length > 300) {
      next = { ...next, runs: [{ text: paragraphText(next).slice(0, 300), bold: false }] };
      renderParagraph(line, next); setNotice('Cada párrafo admite 300 caracteres. Se conservó el texto hasta ese límite, sin formato.');
    }
    commit(model.current.map((p, i) => i === line ? next : p)); capture();
  }
  function bold() {
    if (locked) return;
    const { line, start, end } = selection.current;
    if (start === end) { setNotice('Primero selecciona texto: arrastra sobre las palabras o pulsa Seleccionar párrafo.'); return; }
    commit(model.current.map((p, i) => i === line ? formatSelection(p, start, end) : p), true);
    restore(line, start, end); setNotice('Formato actualizado en el texto seleccionado. Negrita permite aplicarlo o quitarlo.');
  }
  function align(value: 'left' | 'center') {
    if (locked) return;
    const { line, start, end } = selection.current;
    commit(model.current.map((p, i) => i === line ? { ...p, align: value } : p), true);
    restore(line, start, end); setNotice(`${labels[line]}: ${value === 'center' ? 'centrado' : 'alineado a la izquierda'}.`);
  }
  function undo() {
    if (locked) return;
    const previous = history.current.pop(); if (!previous) return;
    model.current = previous; previous.forEach((p, i) => renderParagraph(i, p)); onChange(previous); setVersion(v => v + 1);
    restore(active, 0, 0); setNotice('Se deshizo el último cambio.');
  }
  const words = model.current.map(paragraphText).join(' ').trim().split(/\s+/).filter(Boolean).length;
  return <div className="editable-word" data-version={version}>
    <div className="editable-title"><img src="/1-2627/desktop/word.svg" alt=""/>Documento de práctica — Word simulado</div>
    <div className="editable-tab">Inicio <span>Herramientas de esta práctica</span></div>
    <div className="editable-toolbar" aria-label="Herramientas del documento">
      <button disabled={locked} onMouseDown={e => e.preventDefault()} onClick={bold}><b>N</b><span>Negrita</span></button>
      <button disabled={locked} aria-pressed={model.current[active].align === 'left'} onMouseDown={e => e.preventDefault()} onClick={() => align('left')}>Izquierda</button>
      <button disabled={locked} aria-pressed={model.current[active].align === 'center'} onMouseDown={e => e.preventDefault()} onClick={() => align('center')}>Centrar</button>
      <button disabled={locked || !paragraphText(model.current[active])} onMouseDown={e => e.preventDefault()} onClick={() => { restore(active, 0, paragraphText(model.current[active]).length); setNotice(`Texto de ${labels[active]} seleccionado. Ahora puedes aplicar Negrita.`); }}>Seleccionar párrafo</button>
      <button disabled={locked || !history.current.length} onMouseDown={e => e.preventDefault()} onClick={undo}>Deshacer</button>
    </div>
    <p className="editor-message" aria-live="polite">{locked ? 'Documento entregado. Inicia otro intento para volver a editar.' : notice}</p>
    <div className="editable-canvas"><div className="editable-sheet">
      {labels.map((label, i) => <div className={`editable-line ${active === i ? 'active' : ''}`} key={label}>
        <label id={`paragraph-label-${i}`}>{i + 1}. {label}</label>
        <div ref={el => { nodes.current[i] = el; }} contentEditable={!locked} suppressContentEditableWarning role="textbox" aria-multiline="false" aria-labelledby={`paragraph-label-${i}`} aria-describedby="editor-help" tabIndex={0} spellCheck onFocus={() => { setActive(i); selection.current = { line: i, start: 0, end: 0 }; }} onInput={() => read(i)} onMouseUp={capture} onKeyUp={capture}
          onDrop={e => e.preventDefault()}
          onBeforeInput={e => { const input = e.nativeEvent as InputEvent; if (input.inputType === 'insertParagraph' || input.inputType === 'insertLineBreak') { e.preventDefault(); nodes.current[Math.min(i + 1, 2)]?.focus(); } }}
          onPaste={e => { e.preventDefault(); if (locked) return; capture(); const s = window.getSelection(); if (!s?.rangeCount) return; const r = s.getRangeAt(0); if (!nodes.current[i]?.contains(r.commonAncestorContainer)) return; r.deleteContents(); const n = document.createTextNode(e.clipboardData.getData('text/plain').replace(/\s+/g, ' ').slice(0, 300)); r.insertNode(n); r.setStartAfter(n); r.collapse(true); s.removeAllRanges(); s.addRange(r); read(i); }}
          onKeyDown={e => {
            if (locked || e.nativeEvent.isComposing) return;
            if ((e.ctrlKey || e.metaKey) && ['b', 'n', 'e', 'z'].includes(e.key.toLowerCase())) { e.preventDefault(); capture(); if (['b','n'].includes(e.key.toLowerCase())) bold(); else if (e.key.toLowerCase() === 'e') align('center'); else undo(); }
            if (e.key === 'Enter') { e.preventDefault(); nodes.current[Math.min(i + 1, 2)]?.focus(); }
          }}/>
      </div>)}
    </div></div>
    <div className="editable-status"><span>{words} palabras · Párrafo activo: {labels[active]}</span><span>Vista de práctica</span></div>
    <p id="editor-help" className="note">Tres párrafos preparados para este ejercicio. Haz clic para escribir; Enter pasa al siguiente. Las etiquetas Título, Nombre y Grupo no son parte del documento. No se crea un archivo de Word en tu equipo.</p>
  </div>;
}
