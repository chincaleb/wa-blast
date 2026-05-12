import React, { useState } from 'react';

export default function LoginPage({ onLogin, loading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function submit(e) {
    e.preventDefault();
    onLogin(username.trim(), password);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📱</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>WA Blast</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>Property Outreach Manager</p>
        </div>

        <form onSubmit={submit} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14
        }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              Username
            </label>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / junior1" autoFocus required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" required
            />
          </div>

          {error && (
            <div style={{
              background: '#7f1d1d33', border: '1px solid #7f1d1d',
              color: '#fca5a5', borderRadius: 6, padding: '8px 12px', fontSize: 13
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--green)', color: '#000', fontWeight: 700,
              padding: '12px', borderRadius: 8, fontSize: 15,
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s'
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
