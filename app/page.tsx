'use client';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AccountAccess from '@/components/account-access';
import FileExerciseOne from '@/components/file-exercise-one';
import ProfileSetup from '@/components/profile-setup';
import TeacherDashboard from '@/components/teacher-dashboard';
import { coursesFor, firstName } from '@/lib/course-catalog';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    void supabase.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
      if (sessionError) setError('No pudimos abrir tu sesión. Inicia sesión de nuevo.');
      setSession(sessionData.session);
      setAuthLoading(false);
    }).catch(() => {
      setError('No pudimos abrir tu sesión. Inicia sesión de nuevo.');
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    setError('');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError('No se pudo cerrar la sesión. Inténtalo otra vez.');
  }

  const fullName = String(session?.user.user_metadata.full_name ?? '');
  const groupCode = String(session?.user.user_metadata.group_code ?? '');
  const assignedCourses = coursesFor(groupCode);
  const profileComplete = Boolean(fullName && assignedCourses.length);
  const isTeacher = session?.user.email?.toLowerCase() === 'santiago.gonzalez@tam.conalep.edu.mx';

  return <main className="focused-app">
    <header className="focused-header">
      <a className="focused-brand" href="#contenido" aria-label="Ir al inicio"><span aria-hidden="true">SM</span><span className="brand-copy"><strong>Aula Virtual</strong><small>Profe. Santiago Martínez</small></span></a>
      {session && <button type="button" onClick={signOut}>Cerrar sesión</button>}
    </header>

    <div className="focused-main" id="contenido">
      {authLoading ? <section className="focused-status" role="status"><span className="focused-spinner" aria-hidden="true"/><p>Preparando tu aula…</p></section> : isTeacher ? <TeacherDashboard/> : session && !profileComplete ? <ProfileSetup/> : session ? <>
        <section className="student-welcome">
          <div><p>GRUPO {groupCode} · TU ESPACIO</p><h1>¡Qué gusto verte, {firstName(fullName)}!</h1><span>Todo está preparado. Elige tu módulo y continúa avanzando.</span></div>
          <div className="student-avatar" aria-hidden="true">{fullName.trim().charAt(0).toUpperCase()}</div>
        </section>
        {error && <p className="focused-error" role="alert">{error}</p>}
        <section className="module-section" aria-labelledby="module-heading">
          <div className="module-heading"><div><p>TUS MÓDULOS</p><h2 id="module-heading">Continúa aprendiendo</h2></div><span>{assignedCourses.length} {assignedCourses.length === 1 ? 'módulo' : 'módulos'}</span></div>
          <div className="module-grid">{assignedCourses.map((course, index) => <article className={`module-card ${course.available ? 'available' : ''}`} key={course.code}>
            <div className="module-icon" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div><div><span>{course.code}</span><h3>{course.title}</h3><p>{course.available ? 'Tu primera actividad está lista.' : 'Aquí encontrarás tus próximas actividades.'}</p></div>{course.available ? <a href="#actividad-edoa">Abrir módulo <span aria-hidden="true">→</span></a> : <strong>Próximamente</strong>}
          </article>)}</div>
        </section>
        {assignedCourses.some(course => course.code === 'EDOA-21') && <section className="activity-section" id="actividad-edoa"><div className="activity-heading"><span>01</span><div><p>EDOA · ACTIVIDAD DISPONIBLE</p><h2>Identificación de elementos de Word</h2><small>Descarga, resuelve y entrega. Paso a paso.</small></div></div><FileExerciseOne key={session.user.id} userId={session.user.id}/></section>}
      </> : <>
        <section className="focused-intro focused-welcome"><p>TU AULA, TUS MÓDULOS</p><h1>Bienvenido a tu aula virtual</h1><span>Entra para ver las actividades de tu grupo.</span></section>
        {error && <p className="focused-error" role="alert">{error}</p>}
        <AccountAccess session={null}/>
      </>}
      <footer className="focused-footer">Aula Virtual del Profe. Santiago Martínez · 2026–2027</footer>
    </div>
  </main>;
}
