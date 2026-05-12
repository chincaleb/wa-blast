import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { api } from './api';

import LoginPage from './components/layout/LoginPage';
import TopNav from './components/layout/TopNav';
import TabBar from './components/layout/TabBar';
import ToastContainer from './components/ui/Toast';

import SendTab from './components/tabs/SendTab';
import TemplatesTab from './components/tabs/TemplatesTab';
import StatsTab from './components/tabs/StatsTab';
import SetupTab from './components/tabs/SetupTab';

export default function App() {
  const { user, login, logout, loading: authLoading, error: authError } = useAuth();
  const { toasts, toast } = useToast();
  const [tab, setTab] = useState('send');
  const [stats, setStats] = useState(null);

  // Refresh top-nav stats periodically
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function refresh() {
      try {
        const s = await api.getStats();
        if (mounted) setStats(s);
      } catch {}
    }
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [user, tab]);

  if (!user) {
    return (
      <>
        <LoginPage onLogin={login} loading={authLoading} error={authError} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNav user={user} stats={stats} onLogout={logout} />

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'send'      && <SendTab      toast={toast} />}
        {tab === 'templates' && <TemplatesTab toast={toast} />}
        {tab === 'stats'     && <StatsTab     toast={toast} />}
        {tab === 'setup'     && <SetupTab     user={user} toast={toast} />}
      </main>

      <TabBar active={tab} onChange={setTab} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
