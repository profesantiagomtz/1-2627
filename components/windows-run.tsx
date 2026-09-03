import { useEffect, useId, useRef, useState } from 'react';
import { isWordRunCommand } from '@/lib/word-launch';

export default function WindowsRun({ onOpenWord, onClose }: { onOpenWord: () => void; onClose: () => void }) {
  const [command, setCommand] = useState('');
  const [error, setError] = useState('');
  const id = useId();
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => { input.current?.focus(); }, []);
  return <dialog open className="win-run-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}>
    <div className="win-run-title"><strong id={`${id}-title`}>Ejecutar</strong><button type="button" aria-label="Cerrar Ejecutar" onClick={onClose}>×</button></div>
    <form onSubmit={event => {
      event.preventDefault();
      if (isWordRunCommand(command)) onOpenWord();
      else { setError('No se encontró el programa. Para abrir Word, escribe WINWORD y vuelve a pulsar Aceptar.'); input.current?.focus(); }
    }}>
      <p id={`${id}-description`}>Escribe el nombre del programa que deseas abrir.</p>
      <label htmlFor={`${id}-command`}>Abrir:</label>
      <input id={`${id}-command`} ref={input} value={command} onChange={event => { setCommand(event.target.value); setError(''); }} autoComplete="off" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}/>
      {error && <p id={`${id}-error`} className="win-run-error" role="alert">{error}</p>}
      <small>Simulación: este cuadro no ejecuta programas en tu equipo.</small>
      <div className="win-run-actions"><button type="submit" disabled={!command.trim()}>Aceptar</button><button type="button" onClick={onClose}>Cancelar</button></div>
    </form>
  </dialog>;
}
