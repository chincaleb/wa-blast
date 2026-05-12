import React from 'react';

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none'
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#7f1d1d' : t.type === 'warn' ? '#78350f' : '#14532d',
          color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap'
        }}>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}
