import { Activity, LayoutGrid, GitFork, Database, TableProperties, ShieldCheck, LogOut, LogIn, Sun, Moon } from 'lucide-react';
import type { View } from '../types';
import styles from './Header.module.css';

interface Props {
  view: View;
  setView: (v: View) => void;
  count: number;
  lastUpdated: Date | null;
  isAdmin: boolean;
  loggedInAs: string | null;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({ view, setView, count, lastUpdated, isAdmin, loggedInAs, onLogout, theme, onToggleTheme }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Activity size={16} className={styles.pulse} />
        <span className={styles.title}>Stockout Tracker</span>
        <span className={styles.badge}>{count} items</span>
        {lastUpdated && (
          <span className={styles.updated}>
            Updated {lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <nav className={styles.nav}>
        <button className={view === 'cards' ? styles.active : ''} onClick={() => setView('cards')}>
          <LayoutGrid size={14} /><span className={styles.label}>Cards</span>
        </button>
        <button className={view === 'graph' ? styles.active : ''} onClick={() => setView('graph')}>
          <GitFork size={14} /><span className={styles.label}>Graph</span>
        </button>
        <button onClick={() => window.open('/schema', '_blank')}>
          <Database size={14} /><span className={styles.label}>Schema</span>
        </button>
        <button onClick={() => window.open('/table', '_blank')}>
          <TableProperties size={14} /><span className={styles.label}>Table</span>
        </button>

        <div className={styles.divider} />

        {isAdmin ? (
          <>
            <button className={view === 'admin' ? styles.active : ''} onClick={() => setView('admin')}>
              <ShieldCheck size={14} /><span className={styles.label}>Admin</span>
            </button>
            <button className={styles.logoutBtn} onClick={onLogout} title={`Sign out (${loggedInAs})`}>
              <LogOut size={14} /><span className={styles.label}>Sign out</span>
            </button>
          </>
        ) : (
          <button className={view === 'login' ? styles.active : ''} onClick={() => setView('login')}>
            <LogIn size={14} /><span className={styles.label}>Admin</span>
          </button>
        )}

        <div className={styles.divider} />

        <button className={styles.themeBtn} onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </nav>
    </header>
  );
}
