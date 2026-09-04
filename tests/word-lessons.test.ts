import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessons, scoreResponses, summarize } from '../lib/word-lessons.ts';
import { practiceGuidance } from '../lib/practice-guidance.ts';
import { beginnerSteps, lessonPreparation } from '../lib/beginner-guidance.ts';
import { factsForLesson, wordFacts } from '../lib/word-facts.ts';
import { blankDocument, documentScore, evaluateDocument, formatSelection, paragraphText, type PracticeDocument } from '../lib/document-practice.ts';

const completedDocument = (): PracticeDocument => [
  { runs: [{ text: 'Mi perfil de estudiante', bold: true }], align: 'center' },
  { runs: [{ text: 'Nombre: Ana López', bold: false }], align: 'left' },
  { runs: [{ text: 'Grupo: 311', bold: false }], align: 'left' },
];
test('documento vacío no da puntos, ni siquiera por formato vacío', () => {
  assert.equal(documentScore(blankDocument()), 0);
});
test('documento completo: cinco criterios y 100 puntos', () => {
  assert.equal(documentScore(completedDocument()), 100);
  assert.equal(evaluateDocument(completedDocument()).filter(c => c.passed).length, 5);
});
test('cada criterio descuenta únicamente su peso', () => {
  const doc = completedDocument(); doc[0].align = 'left'; assert.equal(documentScore(doc), 85);
  doc[0].runs[0].bold = false; assert.equal(documentScore(doc), 70);
  doc[2].runs[0].text = 'Grupo: 312'; assert.equal(documentScore(doc), 50);
  doc[1].runs[0].text = 'Nombre:'; assert.equal(documentScore(doc), 25);
});
test('se evalúa todo el título, no solo una palabra en negrita', () => {
  const doc = completedDocument(); doc[0].runs = [{text:'Mi perfil ',bold:true},{text:'de estudiante',bold:false}];
  assert.equal(documentScore(doc),85);
});
test('título incorrecto no gana puntos por estar centrado o en negrita', () => {
  const doc = completedDocument(); doc[0].runs[0].text = 'Otro título'; assert.equal(documentScore(doc),45);
});
test('práctica y reto tienen títulos diferentes; espacios y mayúsculas no penalizan', () => {
  const doc = completedDocument(); doc[0].runs[0].text = ' MI  PERFIL DE ESTUDIANTE ';
  assert.equal(documentScore(doc),100); assert.equal(documentScore(doc,true),45);
  doc[0].runs[0].text = 'Mi presentación'; assert.equal(documentScore(doc,true),100);
});
test('formato afecta solo la selección y se puede quitar sin alterar el texto', () => {
  const p = {runs:[{text:'Hola mundo',bold:false}],align:'left' as const};
  const formatted = formatSelection(p,0,4);
  assert.deepEqual(formatted.runs,[{text:'Hola',bold:true},{text:' mundo',bold:false}]);
  assert.deepEqual(formatSelection(formatted,0,4),p);
  assert.equal(paragraphText(formatted),'Hola mundo');
  assert.deepEqual(formatSelection(p,0,0),p);
});
test('cualquier orden de edición produce la misma nota final', () => {
  const first = completedDocument(); first[0].runs[0].bold = false;
  first[0] = formatSelection(first[0],0,paragraphText(first[0]).length);
  assert.equal(documentScore(first),documentScore(completedDocument()));
});

test('las notas tienen ejemplos, fuentes oficiales y correspondencia con las lecciones', () => {
  assert.equal(new Set(wordFacts.map(fact => fact.id)).size, wordFacts.length);
  for (const fact of wordFacts) {
    assert.ok(lessons.some(lesson => lesson.id === fact.lessonId));
    assert.ok(fact.fact.length && fact.example.length && fact.sourceTitle.length);
    assert.equal(new URL(fact.sourceUrl).hostname, 'support.microsoft.com');
  }
  for (const lesson of lessons) assert.ok(factsForLesson(lesson.id, 'read').length);
});
test('las notas no interrumpen las prácticas ni revelan información durante el reto', () => {
  for (const phase of ['guided', 'ready', 'challenge', 'result']) for (const lesson of lessons) assert.deepEqual(factsForLesson(lesson.id, phase), []);
  assert.deepEqual(factsForLesson('unknown', 'read'), []);
});

test('todas las lecciones explican el contexto y cada acción tiene ubicación, pasos y resultado', () => {
  for (const lesson of lessons) {
    assert.ok(lessonPreparation[lesson.id].length > 100);
    for (const step of lesson.steps) {
      const guide = beginnerSteps[step.target];
      assert.ok(guide.where.length > 30, step.target);
      assert.ok(guide.actions.length >= 2, step.target);
      assert.match(guide.expected, /[Pp]ulsa/, step.target);
    }
  }
});
import { isWordRunCommand, wordLaunchLabels } from '../lib/word-launch.ts';

test('Ejecutar reconoce WINWORD sin importar mayúsculas y espacios exteriores', () => {
  for (const command of ['WINWORD', 'winword', ' WinWord ', 'WINWORD.EXE']) assert.equal(isWordRunCommand(command), true);
});
test('Ejecutar rechaza comandos vacíos, incorrectos y órdenes adicionales', () => {
  for (const command of ['', ' ', 'word', 'excel', 'WIN WORD', 'WINWORD & calc', 'winword.exe /q']) assert.equal(isWordRunCommand(command), false);
});
test('las tres rutas alternativas identifican cómo se abrió Word', () => {
  assert.match(wordLaunchLabels.run, /WINWORD/);
  assert.match(wordLaunchLabels.taskbar, /barra de tareas/);
  assert.match(wordLaunchLabels.shortcut, /escritorio/);
});

test('cada paso tiene una indicación visual explícita sin cambiar su respuesta', () => {
  for (const lesson of lessons) for (const step of lesson.steps) {
    assert.ok(practiceGuidance[step.target]?.label);
    assert.match(practiceGuidance[step.target].instruction, /clic/);
  }
});

test('cada lección asigna 100 puntos a las acciones correctas', () => {
  for (const lesson of lessons) assert.equal(scoreResponses(lesson, lesson.steps.map(step => step.target)), 100);
});
test('la primera elección equivocada reduce la nota, aunque después se corrija', () => {
  assert.equal(scoreResponses(lessons[0], ['start', 'search-other', 'word']), 67);
  assert.equal(scoreResponses(lessons[1], ['wrong', 'template', 'open', 'file-practica']), 75);
  assert.equal(scoreResponses(lessons[2], ['wrong','tabs','ribbon','page','status','zoom']), 83);
});
test('un reto incompleto no genera calificación', () => {
  assert.throws(() => scoreResponses(lessons[0], ['start']));
});
test('sin intentos: cero avance y ninguna calificación', () => {
  assert.deepEqual(summarize([]), { best: {}, completed: 0, progress: 0, grade: null });
});
test('conserva el mejor resultado y no duplica el avance al repetir', () => {
  const scores = [100, 33, 67].map((score,index) => ({id:String(index),lesson_id:'word-start',score,created_at:'2026-09-03'}));
  const result = summarize(scores);
  assert.equal(result.best['word-start'], 100);
  assert.equal(result.completed, 1);
  assert.equal(result.progress, 33);
  assert.equal(result.grade, 100);
});
test('nota y avance son independientes y el umbral es 70', () => {
  const result = summarize(lessons.map((lesson,index) => ({id:String(index),lesson_id:lesson.id,score:[67,75,100][index],created_at:'2026-09-03'})));
  assert.equal(result.progress, 67);
  assert.equal(result.grade, 81);
});
