import { useState } from 'react';
import { Upload, Users, CheckCircle, AlertCircle, Trash2, Plus, KeyRound, Mail } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import type { StockoutItem, FutureStockoutItem, Admin } from '../types';
import UploadView from './UploadView';
import styles from './AdminView.module.css';

type AdminTab = 'upload' | 'admins';

interface Props {
  onReplace: (items: StockoutItem[]) => Promise<void>;
  onReset: () => Promise<void>;
  parseCSV: (text: string) => StockoutItem[] | null;
  currentCount: number;
  onReplaceFuture: (items: FutureStockoutItem[]) => Promise<void>;
  onResetFuture: () => Promise<void>;
  parseFutureCSV: (text: string) => FutureStockoutItem[] | null;
  futureCount: number;
  loggedInAs: string;
  admins: Admin[];
  onCreateAdmin: (u: string, p: string, fn: string, ln: string, email: string) => Promise<{ ok: boolean; error?: string; emailSent?: boolean }>;
  onDeleteAdmin: (u: string) => Promise<{ ok: boolean; error?: string }>;
  onChangePassword: (u: string, old: string, newP: string) => Promise<{ ok: boolean; error?: string }>;
}

export default function AdminView({
  onReplace, onReset, parseCSV, currentCount,
  onReplaceFuture, onResetFuture, parseFutureCSV, futureCount,
  loggedInAs, admins, onCreateAdmin, onDeleteAdmin, onChangePassword,
}: Props) {
  const [tab, setTab] = useState<AdminTab>('upload');

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'upload' ? styles.active : ''}`} onClick={() => setTab('upload')}>
          <Upload size={14} /> Data upload
        </button>
        <button className={`${styles.tab} ${tab === 'admins' ? styles.active : ''}`} onClick={() => setTab('admins')}>
          <Users size={14} /> Manage admins
        </button>
      </div>

      {tab === 'upload' && (
        <UploadView
          onReplace={onReplace} onReset={onReset} parseCSV={parseCSV} currentCount={currentCount}
          onReplaceFuture={onReplaceFuture} onResetFuture={onResetFuture}
          parseFutureCSV={parseFutureCSV} futureCount={futureCount}
        />
      )}

      {tab === 'admins' && (
        <AdminsTab
          loggedInAs={loggedInAs} admins={admins}
          onCreateAdmin={onCreateAdmin} onDeleteAdmin={onDeleteAdmin} onChangePassword={onChangePassword}
        />
      )}
    </div>
  );
}

/* ── Admins tab ── */
interface AdminsTabProps {
  loggedInAs: string;
  admins: Admin[];
  onCreateAdmin: (u: string, p: string, fn: string, ln: string, email: string) => Promise<{ ok: boolean; error?: string; emailSent?: boolean }>;
  onDeleteAdmin: (u: string) => Promise<{ ok: boolean; error?: string }>;
  onChangePassword: (u: string, old: string, newP: string) => Promise<{ ok: boolean; error?: string }>;
}

function AdminsTab({ loggedInAs, admins, onCreateAdmin, onDeleteAdmin, onChangePassword }: AdminsTabProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [newUser, setNewUser]     = useState('');
  const [newPass, setNewPass]     = useState('');
  const [creating, setCreating]   = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    const result = await onCreateAdmin(newUser, newPass, firstName, lastName, email);
    if (!result.ok) {
      setCreateMsg({ ok: false, text: result.error! });
    } else if (result.emailSent) {
      setCreateMsg({ ok: true, text: `Admin "${newUser}" created — welcome email sent to ${email}.` });
    } else {
      setCreateMsg({ ok: true, text: `Admin "${newUser}" created. (Email not sent — SMTP not configured.)` });
    }
    if (result.ok) { setFirstName(''); setLastName(''); setEmail(''); setNewUser(''); setNewPass(''); }
    setCreating(false);
  }

  async function handleDelete(username: string) {
    setDeletingUser(username);
    setDeleteMsg(null);
    const result = await onDeleteAdmin(username);
    setDeleteMsg(result.ok
      ? { ok: true, text: `"${username}" removed.` }
      : { ok: false, text: result.error! });
    setDeletingUser(null);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg(null);
    const result = await onChangePassword(loggedInAs, pwOld, pwNew);
    setPwMsg(result.ok ? { ok: true, text: 'Password updated.' } : { ok: false, text: result.error! });
    if (result.ok) { setPwOld(''); setPwNew(''); }
    setPwBusy(false);
  }

  return (
    <div className={styles.adminsWrap}>

      {/* Admin list */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Admin accounts</div>
        {deleteMsg && (
          <div className={`${styles.msg} ${deleteMsg.ok ? styles.msgOk : styles.msgErr}`}>
            {deleteMsg.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {deleteMsg.text}
          </div>
        )}
        <div className={styles.adminList}>
          {admins.map(a => (
            <div key={a.username} className={styles.adminRow}>
              <div className={styles.adminInfo}>
                <div className={styles.adminNameLine}>
                  <span className={styles.adminFullName}>
                    {(a.firstName || a.lastName) ? [a.firstName, a.lastName].filter(Boolean).join(' ') : a.username}
                  </span>
                  {a.username === loggedInAs && <span className={styles.youBadge}>you</span>}
                  {a.username === 'admin' && <span className={styles.rootBadge}>root</span>}
                </div>
                <div className={styles.adminMeta}>
                  <span className={styles.adminUsername}>@{a.username}</span>
                  {a.email && (
                    <span className={styles.adminEmail}><Mail size={10} /> {a.email}</span>
                  )}
                  <span className={styles.adminDate}>
                    Added {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              {a.username !== 'admin' && a.username !== loggedInAs && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(a.username)}
                  disabled={deletingUser === a.username}
                  title="Remove admin"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create admin */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}><Plus size={13} /> Add an admin</div>
        {createMsg && (
          <div className={`${styles.msg} ${createMsg.ok ? styles.msgOk : styles.msgErr}`}>
            {createMsg.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {createMsg.text}
          </div>
        )}
        <form className={styles.createForm} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <input className={styles.input} type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <input className={styles.input} type="text" placeholder="Last name"  value={lastName}  onChange={e => setLastName(e.target.value)}  required />
          </div>
          <input className={styles.input} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className={styles.formRow}>
            <input className={styles.input} type="text"     placeholder="Username"           value={newUser} onChange={e => setNewUser(e.target.value)} required />
            <PasswordInput className={styles.input} placeholder="Password (min 6)" value={newPass} onChange={setNewPass} required />
          </div>
          <button className="primary" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create & send credentials'}
          </button>
        </form>
      </div>

      {/* Change own password */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}><KeyRound size={13} /> Change your password</div>
        {pwMsg && (
          <div className={`${styles.msg} ${pwMsg.ok ? styles.msgOk : styles.msgErr}`}>
            {pwMsg.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {pwMsg.text}
          </div>
        )}
        <form className={styles.createForm} onSubmit={handlePasswordChange}>
          <PasswordInput className={styles.input} placeholder="Current password"     value={pwOld} onChange={setPwOld} required />
          <PasswordInput className={styles.input} placeholder="New password (min 6)" value={pwNew} onChange={setPwNew} required />
          <button className="primary" type="submit" disabled={pwBusy}>
            {pwBusy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

    </div>
  );
}
