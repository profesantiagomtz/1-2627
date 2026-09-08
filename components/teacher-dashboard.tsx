import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type StudentOverview = {
  student_id: string;
  email: string;
  full_name: string;
  group_code: string;
  attempt_count: number;
  best_score: number | null;
  last_activity: string | null;
};

export default function TeacherDashboard() {
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [group, setGroup] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    const { data, error: requestError } = await supabase.rpc('teacher_student_overview');
    if (requestError) setError('No se pudo cargar el avance. Inténtalo otra vez.');
    else setStudents((data ?? []) as StudentOverview[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);
  const groups = useMemo(() => ['Todos', ...Array.from(new Set(students.map(student => student.group_code))).sort()], [students]);
  const visible = group === 'Todos' ? students : students.filter(student => student.group_code === group);
  const withActivity = students.filter(student => student.attempt_count > 0);
  const graded = students.filter(student => student.best_score !== null);
  const average = graded.length ? Math.round(graded.reduce((sum, student) => sum + (student.best_score ?? 0), 0) / graded.length) : null;

  return <section className="teacher-dashboard">
    <header className="teacher-welcome"><div><p>PANEL DOCENTE</p><h1>Buen día, Profe. Santiago</h1><span>Aquí tiene una vista clara del avance de sus alumnos.</span></div><button type="button" onClick={load} disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar'}</button></header>
    {error && <p className="focused-error" role="alert">{error}</p>}
    <div className="teacher-stats" aria-label="Resumen del grupo"><article><span>Alumnos</span><strong>{students.length}</strong><small>cuentas registradas</small></article><article><span>Con actividad</span><strong>{withActivity.length}</strong><small>han realizado entregas</small></article><article><span>Entregas</span><strong>{students.reduce((sum, student) => sum + Number(student.attempt_count), 0)}</strong><small>intentos guardados</small></article><article><span>Promedio</span><strong>{average ?? '—'}</strong><small>mejor nota por alumno</small></article></div>
    <div className="teacher-list-heading"><div><p>SEGUIMIENTO</p><h2>Avance por alumno</h2></div><label>Grupo<select value={group} onChange={event => setGroup(event.target.value)}>{groups.map(item => <option key={item}>{item}</option>)}</select></label></div>
    {loading ? <p className="teacher-empty" role="status">Cargando alumnos…</p> : !visible.length ? <p className="teacher-empty">Aún no hay alumnos en este grupo.</p> : <div className="teacher-table-wrap"><table><thead><tr><th>Alumno</th><th>Grupo</th><th>Entregas</th><th>Mejor nota</th><th>Última actividad</th></tr></thead><tbody>{visible.map(student => <tr key={student.student_id}><td><strong>{student.full_name}</strong><small>{student.email}</small></td><td><span className="group-chip">{student.group_code}</span></td><td>{student.attempt_count}</td><td><span className={`grade-chip ${student.best_score !== null && student.best_score >= 70 ? 'passed' : ''}`}>{student.best_score === null ? 'Sin entrega' : `${student.best_score}/100`}</span></td><td>{student.last_activity ? new Date(student.last_activity).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}) : 'Sin actividad'}</td></tr>)}</tbody></table></div>}
  </section>;
}
