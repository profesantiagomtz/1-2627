export type Step = { goal: string; target: string; hint: string; feedback: string };
export type Lesson = { id: string; title: string; minutes: number; concept: string; steps: Step[] };
export const lessons: Lesson[] = [
  { id: 'word-start', title: 'Abre Word', minutes: 5, concept: 'Word es un procesador de textos. En Windows puedes abrir Inicio, buscar Word y seleccionar la aplicación. No necesitas abrir primero un archivo. Aquí practicarás esa ruta en una computadora simulada.', steps: [
    { goal: 'Abre el menú para encontrar las aplicaciones de la computadora.', target: 'start', hint: 'El botón Inicio está en la barra inferior.', feedback: 'Inicio permite encontrar las aplicaciones instaladas.' },
    { goal: 'Busca el procesador de textos que vamos a utilizar.', target: 'search-word', hint: 'Escribe Word en el buscador y pulsa Buscar.', feedback: 'Buscar Word localiza la aplicación; todavía falta abrirla.' },
    { goal: 'Abre el procesador de textos en los resultados.', target: 'word', hint: 'Selecciona Word, no Excel ni el navegador.', feedback: '¡Word está abierto! Ahora puedes elegir cómo empezar un documento.' },
  ] },
  { id: 'word-create', title: 'Elige cómo empezar', minutes: 7, concept: 'Documento en blanco sirve para comenzar desde cero. Una plantilla ofrece una estructura y un diseño iniciales. Abrir recupera un archivo que ya existe: no crea uno nuevo. Practica las tres opciones.', steps: [
    { goal: 'Necesitas escribir una nota desde cero, sin un diseño preparado.', target: 'blank', hint: 'Elige Documento en blanco.', feedback: 'Un documento en blanco no contiene un diseño ni texto preparados.' },
    { goal: 'Ahora necesitas una carta con un diseño inicial que puedas adaptar.', target: 'template', hint: 'Elige la plantilla Carta sencilla.', feedback: 'Una plantilla es un punto de partida: debes adaptar su contenido.' },
    { goal: 'Quieres continuar el archivo que guardaste en una sesión anterior.', target: 'open', hint: 'Utiliza Abrir, en la columna izquierda.', feedback: 'Abrir permite buscar un archivo existente.' },
    { goal: 'Selecciona el documento de Word llamado Mi práctica.docx.', target: 'file-practica', hint: 'Busca Mi práctica.docx, no la hoja de cálculo ni el PDF.', feedback: 'Has recuperado el documento correcto para continuar trabajando.' },
  ] },
  { id: 'word-interface', title: 'Ubícate en la interfaz', minutes: 8, concept: 'La barra de título muestra el nombre del documento. Las pestañas organizan las herramientas; la cinta contiene sus comandos. Escribes en la página. La barra de estado informa sobre páginas y palabras. El zoom cambia la vista, no el tamaño real del texto.', steps: [
    { goal: 'Señala la zona donde consultarías el nombre del documento abierto.', target: 'title', hint: 'Busca la barra azul superior.', feedback: 'La barra de título identifica el documento abierto.' },
    { goal: 'Señala dónde cambiarías entre Inicio, Insertar y Disposición.', target: 'tabs', hint: 'Busca la fila situada debajo de la barra de título.', feedback: 'Las pestañas agrupan las herramientas por su función.' },
    { goal: 'Localiza la zona de comandos para aplicar negrita, fuente y alineación.', target: 'ribbon', hint: 'La cinta de opciones está debajo de las pestañas.', feedback: 'La cinta muestra los comandos de la pestaña seleccionada.' },
    { goal: 'Señala el espacio donde escribirías el contenido de tu documento.', target: 'page', hint: 'Busca la página blanca en el centro.', feedback: 'El área del documento es tu espacio para escribir y editar.' },
    { goal: 'Localiza dónde consultarías el número de páginas y de palabras.', target: 'status', hint: 'Busca la información inferior izquierda.', feedback: 'La barra de estado muestra información sobre el documento.' },
    { goal: 'Señala el control para acercar la vista sin cambiar la fuente del documento.', target: 'zoom', hint: 'Busca el porcentaje en la esquina inferior derecha.', feedback: 'El zoom solo cambia cómo ves el documento en pantalla.' },
  ] },
];
export const nextLessons = ['Escribe y edita', 'Guarda tu trabajo', 'Da formato al texto', 'Configura las páginas', 'Resuelve un reto integral'];
export function scoreResponses(lesson: Lesson, responses: string[]) {
  if (responses.length !== lesson.steps.length) throw new Error('El reto está incompleto.');
  return Math.round(100 * lesson.steps.filter((step, index) => step.target === responses[index]).length / lesson.steps.length);
}
export type PracticeAttempt = { id: string; lesson_id: string; score: number; created_at: string };
export function summarize(attempts: PracticeAttempt[]) {
  const best: Record<string, number> = {};
  for (const attempt of attempts) best[attempt.lesson_id] = Math.max(best[attempt.lesson_id] ?? 0, attempt.score);
  const completed = lessons.filter(lesson => (best[lesson.id] ?? -1) >= 70).length;
  const evaluated = lessons.filter(lesson => best[lesson.id] !== undefined);
  return { best, completed, progress: Math.round(100 * completed / lessons.length), grade: evaluated.length ? Math.round(evaluated.reduce((sum, lesson) => sum + best[lesson.id], 0) / evaluated.length) : null };
}
