import { useState } from 'react';
import type { View } from './types';
import { useStockout } from './hooks/useStockout';
import { useFutureStockout } from './hooks/useFutureStockout';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import Header from './components/Header';
import CardsView from './views/CardsView';
import GraphView from './views/GraphView';
import LoginView from './views/LoginView';
import AdminView from './views/AdminView';

export default function App() {
  const [view, setView] = useState<View>('cards');

  const { items, loading: stockoutLoading, replace, reset, parseCSV, lastUpdated } = useStockout();
  const { futureItems, loading: futureLoading, replaceFuture, resetFuture, parseFutureCSV } = useFutureStockout();
  const { loggedInAs, isAdmin, admins, sessionLoading, login, logout, createAdmin, deleteAdmin, changePassword } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  async function handleLogin(username: string, password: string) {
    const result = await login(username, password);
    if (result.ok) setView('admin');
    return result;
  }

  async function handleLogout() {
    await logout();
    setView('cards');
  }

  // Show nothing while the session cookie is being verified (avoids flash)
  if (sessionLoading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        view={view} setView={setView} count={items.length} lastUpdated={lastUpdated}
        isAdmin={isAdmin} loggedInAs={loggedInAs} onLogout={handleLogout}
        theme={theme} onToggleTheme={toggleTheme}
      />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {view === 'cards' && (
          <CardsView
            items={items} futureItems={futureItems}
            loading={stockoutLoading || futureLoading}
          />
        )}
        {view === 'graph' && <GraphView items={items} />}
        {view === 'login' && <LoginView onLogin={handleLogin} />}
        {view === 'admin' && isAdmin && (
          <AdminView
            onReplace={replace} onReset={reset} parseCSV={parseCSV} currentCount={items.length}
            onReplaceFuture={replaceFuture} onResetFuture={resetFuture}
            parseFutureCSV={parseFutureCSV} futureCount={futureItems.length}
            loggedInAs={loggedInAs!} admins={admins}
            onCreateAdmin={createAdmin} onDeleteAdmin={deleteAdmin} onChangePassword={changePassword}
          />
        )}
        {view === 'admin' && !isAdmin && <LoginView onLogin={handleLogin} />}
      </main>
    </div>
  );
}
