import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { groups, type GroupCode } from '@/lib/course-catalog';

export default function ProfileSetup() {
  const [fullName, setFullName] = useState('');
  const [groupCode, setGroupCode] = useState<GroupCode | ''>('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    const cleanName = fullName.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 3 || !groupCode) {
      setMessage('Escribe tu nombre y selecciona tu grupo.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({ data: { full_name: cleanName, group_code: groupCode } });
    if (error) setMessage('No pudimos guardar tus datos. Inténtalo otra vez.');
    setBusy(false);
  }

  return <section className="profile-setup">
    <div><p>UN ÚLTIMO PASO</p><h1>Personaliza tu aula</h1><span>Así podremos mostrarte únicamente tus módulos.</span></div>
    <form onSubmit={save}>
      <fieldset disabled={busy}>
        <label htmlFor="profile-name">Tu nombre completo</label>
        <input id="profile-name" autoComplete="name" required maxLength={80} value={fullName} onChange={event => setFullName(event.target.value)} />
        <label htmlFor="profile-group">Tu grupo</label>
        <select id="profile-group" required value={groupCode} onChange={event => setGroupCode(event.target.value as GroupCode | '')}>
          <option value="">Selecciona tu grupo</option>
          {groups.map(group => <option key={group} value={group}>{group}</option>)}
        </select>
        <button type="submit">{busy ? 'Guardando…' : 'Entrar a mi aula'}</button>
      </fieldset>
      {message && <p role="alert">{message}</p>}
    </form>
  </section>;
}
