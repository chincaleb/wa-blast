import React, { useState, useEffect } from 'react';
import { api } from '../../api';

export default function SetupTab({ user, toast }) {
  const [tab, setTab] = useState('import');

  return (
    <div style={{ padding: '12px 12px 80px' }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Setup</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['import', 'export', ...(user?.role === 'admin' ? ['users'] : [])].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: tab === t ? 600 : 400,
              border: `1px solid ${tab === t ? 'var(--green)' : 'var(--border)'}`,
              color: tab === t ? 'var(--green)' : 'var(--text-dim)',
              background: tab === t ? '#14532d22' : 'transparent',
              textTransform: 'capitalize'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'import' && <ImportSection toast={toast} />}
      {tab === 'export' && <ExportSection toast={toast} />}
      {tab === 'users' && user?.role === 'admin' && <UsersSection toast={toast} />}
    </div>
  );
}

function ImportSection({ toast }) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [paste, setPaste] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singlePhone, setSinglePhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function importSheet() {
    if (!sheetUrl.trim()) return toast('Enter a Google Sheets URL', 'warn');
    setLoading(true);
    try {
      const r = await api.importSheet(sheetUrl.trim());
      toast(`Imported ${r.added} contacts (${r.skipped} duplicates skipped)`);
      setSheetUrl('');
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }

  async function importPaste() {
    const lines = paste.trim().split('\n').filter(Boolean);
    if (!lines.length) return toast('Paste some contacts first', 'warn');
    const contacts = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return { name: parts[0], phone: parts[1] };
    }).filter((c) => c.name && c.phone);

    if (!contacts.length) return toast('No valid rows found. Format: Name, Phone', 'warn');

    setLoading(true);
    try {
      const r = await api.bulkContacts(contacts);
      toast(`Added ${r.added} contacts (${r.skipped} duplicates skipped)`);
      setPaste('');
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }

  async function addSingle() {
    if (!singleName.trim() || !singlePhone.trim()) return toast('Name and phone required', 'warn');
    setLoading(true);
    try {
      await api.addContact({ name: singleName.trim(), phone: singlePhone.trim() });
      toast('Contact added');
      setSingleName(''); setSinglePhone('');
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }

  async function clearAll() {
    if (!confirm('Clear ALL contacts? This cannot be undone.')) return;
    try { await api.deleteAllContacts(); toast('Contacts cleared — ready for next blast'); }
    catch (e) { toast(e.message, 'error'); }
  }

  async function clearTemplates() {
    if (!confirm('Clear ALL templates? This cannot be undone.')) return;
    try { await api.deleteAllTemplates(); toast('Templates cleared — ready for next blast'); }
    catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="From Google Sheets">
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
          Sheet must be public (File → Share → Anyone with link). Column A: Name, Column B: Phone.
        </div>
        <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/…" />
        <Btn onClick={importSheet} loading={loading} extraStyle={{ marginTop: 10 }}>Import from Sheet</Btn>
      </Card>

      <Card title="Bulk Paste">
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
          One contact per line: <code style={{ color: 'var(--green)', fontSize: 12 }}>Ahmad Bin Ali, 60123456789</code>
        </div>
        <textarea rows={6} value={paste} onChange={(e) => setPaste(e.target.value)}
          placeholder={"Ahmad Bin Ali, 60123456789\nSiti Rahimah, 60198765432"} />
        <Btn onClick={importPaste} loading={loading} extraStyle={{ marginTop: 10 }}>Import Paste</Btn>
      </Card>

      <Card title="Add Single Contact">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={singleName} onChange={(e) => setSingleName(e.target.value)} placeholder="Full name" />
          <input value={singlePhone} onChange={(e) => setSinglePhone(e.target.value)} placeholder="60123456789" />
          <Btn onClick={addSingle} loading={loading}>Add Contact</Btn>
        </div>
      </Card>

      <Card title="Danger Zone">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={clearAll}
            style={dangerBtn}
          >
            Clear All Contacts
          </button>
          <button
            onClick={clearTemplates}
            style={dangerBtn}
          >
            Clear All Templates
          </button>
        </div>
      </Card>
    </div>
  );
}

function ExportSection({ toast }) {
  async function run(fn) {
    try { await fn(); } catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Card title="Export Contacts">
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => run(() => api.exportContacts('csv'))}>CSV</Btn>
          <Btn onClick={() => run(() => api.exportContacts('json'))}>JSON</Btn>
        </div>
      </Card>
      <Card title="Export Send Log">
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => run(() => api.exportSends('csv'))}>CSV</Btn>
          <Btn onClick={() => run(() => api.exportSends('json'))}>JSON</Btn>
        </div>
      </Card>
    </div>
  );
}

function UsersSection({ toast }) {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  async function load() {
    try { setUsers(await api.getUsers()); } catch (e) { toast(e.message, 'error'); }
  }

  useEffect(() => { load(); }, []);

  function openEdit(u) {
    setForm({ expires_at: u.expires_at ? u.expires_at.slice(0, 10) : '', password: '' });
    setEditing(u);
  }

  async function save() {
    setSaving(true);
    try {
      const body = {};
      if (form.expires_at) body.expires_at = form.expires_at;
      if (form.password.trim()) body.password = form.password;
      await api.updateUser(editing.id, body);
      await load();
      setEditing(null);
      toast('User updated');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  }

  async function toggleActive(u) {
    try {
      await api.updateUser(u.id, { is_active: u.is_active ? 0 : 1 });
      await load();
    } catch (e) { toast(e.message, 'error'); }
  }

  const juniors = users.filter((u) => u.role !== 'admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!juniors.length && (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 30 }}>No junior accounts found.</div>
      )}
      {juniors.map((u) => (
        <div key={u.id} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{u.username}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                {u.is_active ? (
                  u.expires_at ? `Expires ${new Date(u.expires_at).toLocaleDateString()}` : 'Active'
                ) : (
                  <span style={{ color: 'var(--red)' }}>Disabled</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => toggleActive(u)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${u.is_active ? 'var(--amber)' : 'var(--green)'}`,
                  color: u.is_active ? 'var(--amber)' : 'var(--green)', background: 'transparent'
                }}
              >
                {u.is_active ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => openEdit(u)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--border)', color: 'var(--text)', background: 'transparent'
                }}
              >
                Edit
              </button>
            </div>
          </div>

          {editing?.id === u.id && (
            <div style={{
              marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14,
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div>
                <label style={lbl}>Expiry Date</label>
                <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>New Password (leave blank to keep current)</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={save} loading={saving}>Save</Btn>
                <button
                  onClick={() => setEditing(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'transparent', fontSize: 14 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Btn({ onClick, loading, children, extraStyle }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        flex: 1, background: 'var(--green)', color: '#000', fontWeight: 700,
        padding: '10px', borderRadius: 8, fontSize: 14,
        opacity: loading ? 0.6 : 1, ...extraStyle
      }}
    >
      {loading ? '…' : children}
    </button>
  );
}

const lbl = { fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 };
const dangerBtn = {
  width: '100%', padding: '10px', borderRadius: 8, fontSize: 13,
  border: '1px solid var(--red)', color: 'var(--red)', background: 'transparent', fontWeight: 600, cursor: 'pointer'
};
