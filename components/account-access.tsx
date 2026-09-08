import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { groups, type GroupCode } from '@/lib/course-catalog';

type Mode = 'login' | 'register' | 'recover' | 'password';
const redirectTo = 'https://profesantiagomtz.github.io/1-2627/';

export default function AccountAccess({ session }: { session: Session | null }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fullName, setFullName] = useState('');
  const [groupCode, setGroupCode] = useState<GroupCode | ''>('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('password');
        setMessage('Elige tu nueva contraseña.');
      }
      if (event === 'SIGNED_OUT') {
        setMode('login');
        setPassword('');
        setConfirmation('');
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setMessage('');
    setPassword('');
    setConfirmation('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const address = email.trim().toLowerCase();
    if (mode !== 'password' && !/^[^\s@]+@tam\.conalep\.edu\.mx$/.test(address)) {
      setMessage('Utiliza el correo autorizado para tu grupo. Consulta al profesor si necesitas ayuda.');
      return;
    }
    if ((mode === 'register' || mode === 'password') && (password.length < 8 || password !== confirmation)) {
      setMessage('Usa al menos 8 caracteres y repite la misma contraseña.');
      return;
    }
    const cleanName = fullName.trim().replace(/\s+/g, ' ');
    if (mode === 'register' && (cleanName.length < 3 || !groupCode)) {
      setMessage('Escribe tu nombre y selecciona tu grupo.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password });
        if (error) throw error;
        setPassword('');
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email: address, password, options: { emailRedirectTo: redirectTo, data: { full_name: cleanName, group_code: groupCode } } });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        setMessage('Cuenta creada. Ya puedes comenzar.');
      } else if (mode === 'recover') {
        const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo });
        if (error) throw error;
        setMessage('Si el correo corresponde a una cuenta, recibirás un enlace para establecer una contraseña. Revisa también correo no deseado.');
      } else {
        if (!session) throw new Error('session_missing');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        setMessage('Contraseña guardada. La próxima vez podrás entrar con tu correo y contraseña.');
      }
    } catch (error) {
      const code = (error as { code?: string }).code;
      setMessage(code === 'invalid_credentials' ? 'Correo o contraseña incorrectos. Si antes entrabas por enlace, usa Recuperar contraseña.' : code === 'email_not_confirmed' ? 'Primero confirma tu correo mediante el mensaje de registro.' : code === 'weak_password' ? 'La contraseña no cumple los requisitos de seguridad. Elige una más larga y diferente.' : 'No se pudo completar la solicitud. Revisa tu conexión o solicita un nuevo enlace de recuperación e inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  if (session && mode !== 'password') return <section className="access-card" id="acceso"><div><h2>Tu cuenta del aula</h2><p>Administra tu contraseña sin crear otra cuenta.</p></div><button className="profile" onClick={() => changeMode('password')}>Establecer o cambiar contraseña</button></section>;

  return <section className="access-card" id="acceso">
    <div><p className="eyebrow light">TU ESPACIO DE APRENDIZAJE</p><h2>{mode === 'login' ? 'Inicia sesión' : mode === 'register' ? 'Crea tu cuenta' : mode === 'recover' ? 'Recupera tu acceso' : 'Establece tu contraseña'}</h2><p>{mode === 'register' ? 'Escribe tu correo y crea una contraseña. Entrarás de inmediato.' : mode === 'recover' ? 'Recibe un enlace para crear una contraseña nueva.' : 'Utiliza tu correo autorizado y una contraseña personal. No la compartas.'}</p></div>
    <form className="password-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        {mode === 'register' && <><label htmlFor="account-name">Nombre completo</label><input id="account-name" autoComplete="name" required maxLength={80} value={fullName} onChange={e => setFullName(e.target.value)} /><label htmlFor="account-group">Grupo</label><select id="account-group" required value={groupCode} onChange={e => setGroupCode(e.target.value as GroupCode | '')}><option value="">Selecciona tu grupo</option>{groups.map(group => <option key={group} value={group}>{group}</option>)}</select></>}
        {mode !== 'password' && <><label htmlFor="account-email">Correo electrónico</label><input id="account-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></>}
        {mode !== 'recover' && <><label htmlFor="account-password">{mode === 'login' ? 'Contraseña' : 'Nueva contraseña (mínimo 8 caracteres)'}</label><input id="account-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 8} value={password} onChange={e => setPassword(e.target.value)} /></>}
        {(mode === 'register' || mode === 'password') && <><label htmlFor="account-confirm">Repite la contraseña</label><input id="account-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></>}
        <button type="submit">{busy ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Registrarme' : mode === 'recover' ? 'Enviar recuperación' : 'Guardar contraseña'}</button>
      </fieldset>
      {message && <p role="status" aria-live="polite">{message}</p>}
      <nav className="account-options" aria-label="Opciones de acceso">{!session && <><button disabled={busy} type="button" onClick={() => changeMode('login')}>Iniciar sesión</button><button disabled={busy} type="button" onClick={() => changeMode('register')}>Crear cuenta</button><button disabled={busy} type="button" onClick={() => changeMode('recover')}>Recuperar contraseña</button></>}{session && <button disabled={busy} type="button" onClick={() => changeMode('login')}>Volver a mi cuenta</button>}</nav>
    </form>
  </section>;
}
