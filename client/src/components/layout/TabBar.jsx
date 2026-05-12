import React from 'react';

const TABS = [
  { id: 'send', label: 'Send', icon: '💬' },
  { id: 'templates', label: 'Templates', icon: '📝' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'setup', label: 'Setup', icon: '⚙️' },
];

export default function TabBar({ active, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--bg2)', borderTop: '1px solid var(--border)',
      display: 'flex', height: 60
    }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            color: active === t.id ? 'var(--green)' : 'var(--text-dim)',
            fontSize: 10, fontWeight: active === t.id ? 600 : 400,
            transition: 'color 0.15s',
            borderTop: active === t.id ? '2px solid var(--green)' : '2px solid transparent'
          }}
        >
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
