import { strFromU8, unzipSync } from 'fflate';

export const exerciseOneTargets = [
  { shape: 'Elipse 44', label: 'Cinta de opciones', answer: '1' },
  { shape: 'Elipse 16', label: 'Barra de menús', answer: '2' },
  { shape: 'Elipse 39', label: 'Barra de título', answer: '3' },
  { shape: 'Elipse 13', label: 'Barra de accesos directos', answer: '4' },
  { shape: 'Elipse 43', label: 'Botones de presentación', answer: '5' },
  { shape: 'Elipse 15', label: 'Barra de desplazamiento', answer: '6' },
  { shape: 'Elipse 40', label: 'Zoom', answer: '7' },
  { shape: 'Elipse 41', label: 'Vistas del documento', answer: '8' },
  { shape: 'Elipse 42', label: 'Barra de estado', answer: '9' },
  { shape: 'Elipse 14', label: 'Área de trabajo', answer: '10' },
] as const;

function decodeXml(value: string) {
  return value.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
export function extractExerciseOneAnswers(xml: string) {
  const found: Record<string, string> = {};
  const anchors = xml.match(/<wp:anchor\b[\s\S]*?<\/wp:anchor>/g) ?? [];
  for (const anchor of anchors) {
    const name = anchor.match(/<wp:docPr\b[^>]*\bname="([^"]+)"/)?.[1];
    if (!name || !exerciseOneTargets.some(target => target.shape === decodeXml(name))) continue;
    const texts = [...anchor.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(match => decodeXml(match[1])).join('');
    found[decodeXml(name)] = texts.trim();
  }
  if (exerciseOneTargets.some(target => !(target.shape in found))) throw new Error('Este archivo no corresponde al Ejercicio 1 original.');
  return found;
}
export function readExerciseOne(fileData: Uint8Array) {
  let documentXml: Uint8Array | undefined;
  try {
    const files = unzipSync(fileData, { filter: file => {
      if (file.name === 'word/document.xml' && file.originalSize > 2_000_000) throw new Error('El documento es demasiado grande.');
      return file.name === 'word/document.xml';
    }});
    documentXml = files['word/document.xml'];
  } catch (error) { throw error instanceof Error ? error : new Error('No se pudo leer el archivo.'); }
  if (!documentXml) throw new Error('El archivo no es un documento de Word válido.');
  return extractExerciseOneAnswers(strFromU8(documentXml));
}
export function gradeExerciseOne(answers: Record<string, string>) {
  const items = exerciseOneTargets.map(target => ({ ...target, value: answers[target.shape] ?? '', passed: (answers[target.shape] ?? '').trim() === target.answer }));
  return { items, score: items.filter(item => item.passed).length * 10 };
}
