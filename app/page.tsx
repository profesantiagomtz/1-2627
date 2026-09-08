'use client';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AccountAccess from '@/components/account-access';
import FileExerciseOne from '@/components/file-exercise-one';

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

  return <main className="focused-app">
    <header className="focused-header">
      <a className="focused-brand" href="#contenido" aria-label="Ir al inicio">
        <span aria-hidden="true">PS</span>
        <strong>Aula del Profe Santiago</strong>
      </a>
      {session && <button type="button" onClick={signOut}>Cerrar sesión</button>}
    </header>

    <div className="focused-main" id="contenido">
      {authLoading ? <section className="focused-status" role="status">
        <span className="focused-spinner" aria-hidden="true" />
        <p>Abriendo tu aula…</p>
      </section> : session ? <>
        <section className="focused-intro">
          <p>ACTIVIDADES DE WORD</p>
          <h1>Empieza con el Ejercicio 1</h1>
          <span>Descarga el archivo, resuélvelo en Word y entrégalo aquí.</span>
        </section>
        {error && <p className="focused-error" role="alert">{error}</p>}
        <FileExerciseOne key={session.user.id} userId={session.user.id} />
      </> : <>
        <section className="focused-intro focused-welcome">
          <p>ACTIVIDADES DE WORD</p>
          <h1>Entra para comenzar</h1>
          <span>Usa tu correo y contraseña.</span>
        </section>
        {error && <p className="focused-error" role="alert">{error}</p>}
        <AccountAccess session={null} />
      </>}

      <footer className="focused-footer">Material didáctico del Profe Santiago · EDOA</footer>
    </div>
  </main>;
}
