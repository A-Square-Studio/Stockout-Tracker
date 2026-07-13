import { useState } from 'react';
import { Activity, Lock } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import styles from './LoginView.module.css';

interface Props {
  onLogin: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}

export default function LoginView({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await onLogin(username.trim(), password);
    if (!result.ok) setError(result.error ?? 'Invalid username or password.');
    setLoading(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <Activity size={20} className={styles.pulse} />
          <span className={styles.appName}>Stockout Tracker</span>
        </div>

        <div className={styles.lockIcon}>
          <Lock size={22} />
        </div>
        <h1 className={styles.heading}>Admin login</h1>
        <p className={styles.sub}>Sign in to manage data uploads and admin accounts.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <PasswordInput
              className={styles.input}
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={`primary ${styles.submit}`} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
