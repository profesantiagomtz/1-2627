export type Run = { text: string; bold: boolean };
export type Paragraph = { runs: Run[]; align: 'left' | 'center' };
export type PracticeDocument = Paragraph[];
export const blankDocument = (): PracticeDocument => Array.from({ length: 3 }, () => ({ runs: [], align: 'left' }));
export const paragraphText = (p: Paragraph) => p.runs.map(r => r.text).join('');
export const normalizeText = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
export function formatSelection(p: Paragraph, start: number, end: number): Paragraph {
  const chars = p.runs.flatMap(r => r.text.split('').map(text => ({ text, bold: r.bold })));
  if (start < 0 || end > chars.length || start >= end) return p;
  const bold = !chars.slice(start, end).every(r => r.bold);
  const runs: Run[] = [];
  chars.forEach((r, i) => {
    const next = { ...r, bold: i >= start && i < end ? bold : r.bold };
    const last = runs.at(-1);
    if (last && last.bold === next.bold) last.text += next.text; else runs.push(next);
  });
  return { ...p, runs };
}
export function evaluateDocument(doc: PracticeDocument, guided = false) {
  const [title, name, group] = doc;
  const expected = guided ? 'Mi presentación' : 'Mi perfil de estudiante';
  const titleCorrect = normalizeText(paragraphText(title)) === normalizeText(expected);
  return [
    { label: `Título: «${expected}»`, points: 25, passed: titleCorrect, help: 'Corrige el texto del primer párrafo. No agregues comillas.' },
    { label: 'Nombre: seguido de tu nombre', points: 25, passed: /^nombre: .{2,}$/u.test(normalizeText(paragraphText(name))), help: 'En el segundo párrafo escribe Nombre: y después tu nombre (mínimo dos caracteres).' },
    { label: 'Grupo: 311', points: 20, passed: normalizeText(paragraphText(group)) === 'grupo: 311', help: 'En el tercer párrafo escribe Grupo: 311.' },
    { label: 'Título completo en negrita', points: 15, passed: titleCorrect && title.runs.filter(r => r.text.trim()).every(r => r.bold), help: 'Selecciona todas las palabras del título y aplica Negrita. También debe estar escrito correctamente.' },
    { label: 'Título centrado', points: 15, passed: titleCorrect && title.align === 'center', help: 'Activa el primer párrafo y pulsa Centrar. También debe tener el título correcto.' },
  ];
}
export const documentScore = (doc: PracticeDocument, guided = false) => evaluateDocument(doc, guided).reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
