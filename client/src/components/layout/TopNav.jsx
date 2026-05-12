import React from 'react';

export default function TopNav({ user, stats, onLogout }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>📱</span>
        <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>WA Blast</span>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
          <StatChip label="Sent" value={stats.sentToday} color="var(--green)" />
          <StatChip label="Replied" value={stats.responseCount} color="var(--amber)" />
          <StatChip label="Total" value={stats.totalContacts} color="var(--text-dim)" />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user?.username}</span>
        <button
          onClick={onLogout}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', padding: '5px 10px', borderRadius: 6, fontSize: 12
          }}
        >
          Out
        </button>
      </div>
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 700, color, fontSize: 14 }}>{value ?? '—'}</div>
      <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>{label}</div>
    </div>
  );
}
