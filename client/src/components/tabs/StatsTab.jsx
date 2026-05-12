import React, { useState, useEffect } from 'react';
import { api } from '../../api';

export default function StatsTab({ toast }) {
  const [stats, setStats] = useState(null);

  async function load() {
    try { setStats(await api.getStats()); } catch (e) { toast(e.message, 'error'); }
  }

  useEffect(() => { load(); }, []);

  if (!stats) return <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Loading…</div>;

  const { totalContacts, sentToday, responseCount, responseRate, pipeline, templates } = stats;

  return (
    <div style={{ padding: '12px 12px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Stats</div>
        <button
          onClick={load}
          style={{
            fontSize: 12, color: 'var(--text-dim)', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 14 }}>
        <KpiCard label="Total Contacts" value={totalContacts} color="var(--text)" />
        <KpiCard label="Sent Today" value={sentToday} color="var(--green)" />
        <KpiCard label="Responses" value={responseCount} color="var(--amber)" />
        <KpiCard label="Response Rate" value={`${responseRate}%`} color="var(--blue)" />
      </div>

      {/* Pipeline */}
      <Section title="Pipeline">
        {[
          { key: 'pending',    label: 'Pending',    color: 'var(--text-dim)' },
          { key: 'sent',       label: 'Sent',       color: 'var(--green)' },
          { key: 'interested', label: 'Interested', color: 'var(--amber)' },
          { key: 'callback',   label: 'Callback',   color: 'var(--blue)' },
          { key: 'no_answer',  label: 'No Answer',  color: 'var(--grey)' },
          { key: 'dnc',        label: 'DNC',        color: 'var(--red)' },
        ].map(({ key, label, color }) => (
          <PipelineRow key={key} label={label} value={pipeline[key] || 0} total={totalContacts} color={color} />
        ))}
      </Section>

      {/* Templates */}
      <Section title="Template Performance">
        {templates.map((t) => (
          <div key={t.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 6, background: t.is_active ? 'var(--green-dark)' : 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: t.is_active ? 'var(--green)' : 'var(--text-dim)'
              }}>
                {t.label}
              </div>
              <span style={{ fontSize: 13, color: t.is_active ? 'var(--text)' : 'var(--text-dim)' }}>
                {t.sends_count} sends
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
              {t.response_rate}%
            </span>
          </div>
        ))}
        {!templates.length && <Empty />}
      </Section>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px', textAlign: 'center'
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px', marginBottom: 12
    }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PipelineRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color }}>{label}</span>
        <span>{value} <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, opacity: 0.7 }} />
      </div>
    </div>
  );
}

function Empty() {
  return <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: '10px 0' }}>None yet</div>;
}
