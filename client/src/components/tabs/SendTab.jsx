import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#9ca39c', bg: '#1a1a1a' },
  sent:      { label: 'Sent',      color: '#22c55e', bg: '#14532d22' },
  interested:{ label: 'Interested',color: '#f59e0b', bg: '#78350f22' },
  callback:  { label: 'Callback',  color: '#3b82f6', bg: '#1e3a5f22' },
  no_answer: { label: 'No Answer', color: '#6b7280', bg: '#1a1a1a' },
  dnc:       { label: 'DNC',       color: '#ef4444', bg: '#7f1d1d22' },
};

const STATUS_BUTTONS = [
  { key: 'sent',       icon: '✓',  label: 'Sent',      color: '#22c55e' },
  { key: 'interested', icon: '🔥', label: 'Interested', color: '#f59e0b' },
  { key: 'callback',   icon: '📞', label: 'Callback',   color: '#3b82f6' },
  { key: 'no_answer',  icon: '—',  label: 'No Answer',  color: '#6b7280' },
  { key: 'dnc',        icon: '✗',  label: 'DNC',        color: '#ef4444' },
];

function buildWaUrl(phone, message, app) {
  const p = phone.replace(/^\+/, '');
  const text = encodeURIComponent(message);
  if (app === 'business') {
    const fallback = encodeURIComponent(`https://play.google.com/store/apps/details?id=com.whatsapp.w4b`);
    return `intent://send?phone=${p}&text=${text}#Intent;action=android.intent.action.VIEW;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${fallback};end`;
  }
  return `https://wa.me/${p}?text=${text}`;
}

export default function SendTab({ toast }) {
  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [sending, setSending] = useState(null);
  const [waApp, setWaApp] = useState(() => localStorage.getItem('waApp') || 'regular');

  function switchApp(app) {
    setWaApp(app);
    localStorage.setItem('waApp', app);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ctcts, nextData] = await Promise.all([
        api.getContacts(filter === 'all' ? {} : { status: filter }),
        api.getNext().catch(() => null)
      ]);
      setContacts(ctcts);
      setNext(nextData);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleSend(contact) {
    if (!next) return toast('No active template or account available', 'error');

    const message = next.template.body.replace(/\[name\]|\(name\)/gi, contact.name);
    const url = buildWaUrl(contact.phone, message, waApp);

    setSending(contact.id);
    try {
      await api.logSend(contact.id);
      await load();
      if (waApp === 'business') {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
      toast(`Opening WA for ${contact.name}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSending(null);
    }
  }

  async function handleStatus(contact, status) {
    try {
      await api.updateStatus(contact.id, status);
      if (status === 'interested' || status === 'callback') {
        await api.logResponse(contact.id);
      }
      setContacts((cs) => cs.map((c) => c.id === contact.id ? { ...c, status } : c));
      toast(`Marked as ${STATUS_CONFIG[status].label}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const filtered = filter === 'all' ? contacts : contacts.filter((c) => c.status === filter);
  const counts = {};
  for (const c of contacts) counts[c.status] = (counts[c.status] || 0) + 1;

  return (
    <div style={{ padding: '12px 12px 80px' }}>
      {/* WA app selector */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 12,
        background: 'var(--bg3)', borderRadius: 8, padding: 4
      }}>
        {[
          { key: 'regular',  label: 'WhatsApp' },
          { key: 'business', label: 'WA Business' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => switchApp(opt.key)}
            style={{
              flex: 1, padding: '7px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: waApp === opt.key ? 'var(--green)' : 'transparent',
              color: waApp === opt.key ? '#000' : 'var(--text-dim)',
              transition: 'all 0.15s'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Next template info */}
      {next ? (
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 14px', marginBottom: 12,
          fontSize: 12, color: 'var(--text-dim)'
        }}>
          Next template: <span style={{ color: 'var(--green)', fontWeight: 600 }}>{next.template?.label}</span>
        </div>
      ) : (
        <div style={{
          background: '#1f0d0d', border: '1px solid #7f1d1d',
          borderRadius: 8, padding: '10px 14px', marginBottom: 12,
          fontSize: 13, color: '#fca5a5'
        }}>
          ⚠ No active templates. Go to Templates tab to add one.
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
        {['all', ...Object.keys(STATUS_CONFIG)].map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = s === 'all' ? contacts.length : (counts[s] || 0);
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12,
                border: `1px solid ${filter === s ? (cfg?.color || 'var(--green)') : 'var(--border)'}`,
                background: filter === s ? (cfg?.bg || 'var(--bg3)') : 'transparent',
                color: filter === s ? (cfg?.color || 'var(--green)') : 'var(--text-dim)',
                fontWeight: filter === s ? 600 : 400
              }}
            >
              {s === 'all' ? 'All' : cfg.label} {count}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Loading…</div>
      ) : !filtered.length ? (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>
          No contacts here. Go to Setup to import.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              next={next}
              waApp={waApp}
              expanded={expandedId === c.id}
              onToggleExpand={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onSend={() => handleSend(c)}
              onStatus={(s) => handleStatus(c, s)}
              sending={sending === c.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact, next, waApp, expanded, onToggleExpand, onSend, onStatus, sending }) {
  const cfg = STATUS_CONFIG[contact.status];
  const message = next?.template?.body?.replace(/\[name\]|\(name\)/gi, contact.name) || '';

  return (
    <div style={{
      background: 'var(--bg2)', border: `1px solid ${expanded ? 'var(--green-dim)' : 'var(--border)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s'
    }}>
      {/* Main row */}
      <div
        onClick={onToggleExpand}
        style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{contact.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{contact.phone}</div>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 20,
          background: cfg.bg, color: cfg.color, fontWeight: 600, flexShrink: 0
        }}>
          {cfg.label}
        </span>
        <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Message preview */}
          {message && (
            <div style={{
              background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
              fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, whiteSpace: 'pre-wrap'
            }}>
              <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 6, fontWeight: 600 }}>
                {next?.template?.label}
              </div>
              {message}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={sending || !next}
            style={{
              background: 'var(--green)', color: '#000', fontWeight: 700,
              padding: '12px', borderRadius: 8, fontSize: 15,
              opacity: (sending || !next) ? 0.5 : 1, width: '100%'
            }}
          >
            {sending ? 'Opening…' : `💬 Send via ${waApp === 'business' ? 'WA Business' : 'WhatsApp'}`}
          </button>

          {/* Status buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_BUTTONS.map((sb) => (
              <button
                key={sb.key}
                onClick={() => onStatus(sb.key)}
                style={{
                  flex: '1 0 auto', minWidth: 60, padding: '8px 4px',
                  borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center',
                  border: `1px solid ${contact.status === sb.key ? sb.color : 'var(--border)'}`,
                  background: contact.status === sb.key ? sb.color + '22' : 'var(--bg3)',
                  color: contact.status === sb.key ? sb.color : 'var(--text-dim)'
                }}
              >
                <div style={{ fontSize: 16 }}>{sb.icon}</div>
                <div style={{ fontSize: 10, marginTop: 2 }}>{sb.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
