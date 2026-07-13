import { useState, useEffect, useCallback } from 'react';
import type { Admin } from '../types';

export function useAuth() {
  const [loggedInAs, setLoggedInAs]     = useState<string | null>(null);
  const [admins, setAdmins]             = useState<Admin[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((data: { username: string | null }) => {
        if (data.username) setLoggedInAs(data.username);
      })
      .catch(console.error)
      .finally(() => setSessionLoading(false));
  }, []);

  // Load admin list whenever we become authenticated
  useEffect(() => {
    if (!loggedInAs) { setAdmins([]); return; }
    fetch('/api/admins')
      .then(r => r.json())
      .then((data: Admin[]) => setAdmins(data))
      .catch(console.error);
  }, [loggedInAs]);

  const login = useCallback(async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setLoggedInAs(data.username as string);
      return { ok: true };
    }
    return { ok: false, error: data.error as string };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setLoggedInAs(null);
  }, []);

  const createAdmin = useCallback(async (
    username: string, password: string,
    firstName: string, lastName: string, email: string,
  ): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> => {
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, firstName, lastName, email }),
    });
    const data = await res.json();
    if (res.ok) {
      // Refresh list
      const list: Admin[] = await fetch('/api/admins').then(r => r.json());
      setAdmins(list);
      return { ok: true, emailSent: data.emailSent as boolean };
    }
    return { ok: false, error: data.error as string };
  }, []);

  const deleteAdmin = useCallback(async (username: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/admins/${encodeURIComponent(username)}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      setAdmins(prev => prev.filter(a => a.username !== username));
      return { ok: true };
    }
    return { ok: false, error: data.error as string };
  }, []);

  const changePassword = useCallback(async (
    username: string, oldPassword: string, newPassword: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/admins/${encodeURIComponent(username)}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    return res.ok ? { ok: true } : { ok: false, error: data.error as string };
  }, []);

  return {
    loggedInAs,
    isAdmin: !!loggedInAs,
    admins,
    sessionLoading,
    login,
    logout,
    createAdmin,
    deleteAdmin,
    changePassword,
  };
}
