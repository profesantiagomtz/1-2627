import { factsForLesson } from '@/lib/word-facts';

export default function WordFacts({ lessonId, phase }: { lessonId: string; phase: string }) {
  const facts = factsForLesson(lessonId, phase);
  if (!facts.length) return null;
  return <aside className="word-facts" aria-label="Notas interesantes de Word">
    <p className="fact-heading">¿Sabías que…?</p>
    <p className="fact-context">Para conocer Word mejor · Lectura complementaria, sin calificación.</p>
    {facts.map(fact => <article key={fact.id}><h3>{fact.title}</h3><p>{fact.fact}</p><p className="fact-example"><strong>Por ejemplo:</strong> {fact.example}</p><a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">{fact.sourceTitle} <span>(abre otra pestaña)</span></a></article>)}
    <p className="fact-context">Estas notas describen Word real. No necesitas realizar estas acciones ahora; algunas todavía no están disponibles en el simulador.</p>
  </aside>;
}
