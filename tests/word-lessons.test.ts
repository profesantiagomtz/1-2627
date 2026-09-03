import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessons, scoreResponses, summarize } from '../lib/word-lessons.ts';

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
