// Simple interface pictograms: decorative; the adjacent text supplies the name.
export default function PracticeIcon({ name }: { name: string }) {
  if (name === 'word' || name === 'excel') return <span aria-hidden="true" className={`app-letter ${name}`}>{name === 'word' ? 'W' : 'X'}</span>;
  return <svg aria-hidden="true" focusable="false" className="practice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {name === 'start' ? <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>
    : name === 'search-word' || name === 'zoom' ? <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6"/>{name === 'zoom' && <path d="M10 7v6"/>}</>
    : name === 'documents' || name === 'open' ? <path d="M3 7V4h7l3 3h8v13H3V7Zm0 3h18"/>
    : name === 'browser' ? <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>
    : name === 'click' ? <path d="m5 3 14 10-7 1-3 7L5 3Zm8 12 4 5"/>
    : name === 'tabs' || name === 'ribbon' || name === 'title' || name === 'status' ? <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M7 4v5M13 4v5M6 14h4m4 0h4M6 17h12"/></>
    : name === 'settings' ? <><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></>
    : <><path d="M5 2h9l5 5v15H5V2Zm9 0v6h5"/>{name !== 'blank' && <path d="M8 12h8M8 16h8M8 19h5"/>}</>}
  </svg>;
}
