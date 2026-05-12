import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import Modal from '../ui/Modal';

const PLACEHOLDER = '(name)';
const PREVIEW_NAME = 'Ahmad';

function applyName(text, name) {
  return text.replace(/\[name\]|\(name\)/gi, name);
}

export default function TemplatesTab({ toast }) {
  const [templates, setTemplates] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | template object
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ label: '', body: '' });
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  async function load() {
    try { setTemplates(await api.getTemplates()); } catch (e) { toast(e.message, 'error'); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    const next = templates.length + 1;
    setForm({ label: `T${next}`, body: '' });
    setModal('add');
  }

  function openEdit(t) {
    setForm({ label: t.label, body: t.body });
    setModal(t);
  }

  function insertNameTag() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newBody = form.body.slice(0, start) + PLACEHOLDER + form.body.slice(end);
    setForm((f) => ({ ...f, body: newBody }));
    // Restore cursor after the inserted tag
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + PLACEHOLDER.length, start + PLACEHOLDER.length);
    }, 0);
  }

  async function save() {
    if (!form.label.trim() || !form.body.trim()) return toast('Label and body required', 'warn');
    setSaving(true);
    try {
      if (modal === 'add') {
        await api.addTemplate(form);
        toast('Template added');
      } else {
        await api.updateTemplate(modal.id, form);
        toast('Template updated');
      }
      await load();
      setModal(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(t) {
    try {
      await api.updateTemplate(t.id, { is_active: !t.is_active });
      await load();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function remove(t) {
    if (!confirm(`Delete template "${t.label}"?`)) return;
    try { await api.deleteTemplate(t.id); await load(); toast('Deleted'); }
    catch (e) { toast(e.message, 'error'); }
  }

  const hasNameTag = (text) => /\[name\]|\(name\)/i.test(text);
  const preview = applyName(form.body, PREVIEW_NAME);

  return (
    <div style={{ padding: '12px 12px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Templates</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {templates.length}/6 · {templates.filter((t) => t.is_active).length} active in rotation
          </div>
        </div>
        {templates.length < 6 && (
          <button
            onClick={openAdd}
            style={{
              background: 'var(--green)', color: '#000', fontWeight: 700,
              padding: '8px 16px', borderRadius: 8, fontSize: 13
            }}
          >
            + Add
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!templates.length && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>
            No templates yet. Add one to start.
          </div>
        )}
        {templates.map((t) => (
          <div
            key={t.id}
            style={{
              background: 'var(--bg2)', border: `1px solid ${expanded === t.id ? 'var(--green-dim)' : 'var(--border)'}`,
              borderRadius: 10, overflow: 'hidden', opacity: t.is_active ? 1 : 0.5
            }}
          >
            <div
              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
                background: t.is_active ? 'var(--green-dark)' : 'var(--bg3)',
                color: t.is_active ? 'var(--green)' : 'var(--text-dim)'
              }}>
                {t.label}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: 'var(--text-dim)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {t.body.slice(0, 60)}{t.body.length > 60 ? '…' : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, display: 'flex', gap: 8 }}>
                  <span>{t.sends_count} sends · {t.sends_count > 0 ? Math.round(t.responses_count / t.sends_count * 100) : 0}% response</span>
                  {hasNameTag(t.body) && (
                    <span style={{ color: 'var(--amber)', fontWeight: 600 }}>✦ personalised</span>
                  )}
                </div>
              </div>
              <span style={{ color: 'var(--text-dim)', fontSize: 14, flexShrink: 0 }}>{expanded === t.id ? '▲' : '▼'}</span>
            </div>

            {expanded === t.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap'
                }}>
                  {t.body}
                </div>
                {hasNameTag(t.body) && (
                  <div style={{
                    background: '#14532d22', border: '1px solid var(--green-dark)',
                    borderRadius: 8, padding: '8px 12px',
                    fontSize: 12, color: 'var(--green)', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11 }}>Preview (name replaced with "{PREVIEW_NAME}")</div>
                    {applyName(t.body, PREVIEW_NAME)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggle(t)}
                    style={outlineBtn(t.is_active ? 'var(--amber)' : 'var(--green)')}
                  >
                    {t.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => openEdit(t)} style={outlineBtn('var(--text-dim)')}>Edit</button>
                  <button onClick={() => remove(t)} style={outlineBtn('var(--red)')}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Template' : 'Edit Template'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Label</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="T1" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Message body</label>
                <button
                  onClick={insertNameTag}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                    background: '#78350f33', border: '1px solid var(--amber)',
                    color: 'var(--amber)', cursor: 'pointer'
                  }}
                >
                  + Insert (name)
                </button>
              </div>
              <textarea
                ref={textareaRef}
                rows={7}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder={"Hi (name), I'm a property agent reaching out about your property…"}
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Type <span style={{ color: 'var(--amber)', fontWeight: 600 }}>(name)</span> anywhere in the message — it will be replaced with the owner's name when sent.
              </div>
            </div>

            {/* Live preview */}
            {form.body.trim() && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600 }}>
                  PREVIEW — name replaced with "{PREVIEW_NAME}"
                </div>
                <div style={{
                  background: '#14532d22', border: '1px solid var(--green-dark)',
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  color: hasNameTag(form.body) ? 'var(--text)' : 'var(--text-dim)'
                }}>
                  {hasNameTag(form.body) ? preview : form.body}
                  {!hasNameTag(form.body) && (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                      No (name) tag — all contacts will receive the same message.
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={save} disabled={saving}
              style={{
                background: 'var(--green)', color: '#000', fontWeight: 700,
                padding: '12px', borderRadius: 8, opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Saving…' : 'Save Template'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 };
const outlineBtn = (color) => ({
  flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  border: `1px solid ${color}`, color, background: 'transparent', cursor: 'pointer'
});
