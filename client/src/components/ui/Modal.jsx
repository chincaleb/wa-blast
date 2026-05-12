import React from 'react';

export default function Modal({ title, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#192019', border: '1px solid #1e2e1e',
          borderRadius: 12, padding: 20, width: '100%', maxWidth: 480,
          maxHeight: '90vh', overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ color: '#9ca39c', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
