const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/next', requireAuth, (req, res) => {
  const template = getNextTemplate();
  if (!template) return res.status(400).json({ error: 'No active templates' });
  res.json({ template });
});

router.post('/', requireAuth, (req, res) => {
  const { contact_id } = req.body;
  if (!contact_id) return res.status(400).json({ error: 'contact_id required' });

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contact_id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  if (req.user.role !== 'admin' && contact.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const template = getNextTemplate();
  if (!template) return res.status(400).json({ error: 'No active templates' });

  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO send_logs (contact_id, user_id, template_id) VALUES (?, ?, ?)'
    ).run(contact_id, req.user.id, template.id);

    db.prepare(
      "UPDATE contacts SET status = 'sent', updated_at = datetime('now') WHERE id = ?"
    ).run(contact_id);

    db.prepare(
      'UPDATE templates SET sends_count = sends_count + 1 WHERE id = ?'
    ).run(template.id);

    advanceTemplateIndex();
  });
  tx();

  res.json({ ok: true, template });
});

router.post('/response', requireAuth, (req, res) => {
  const { contact_id } = req.body;
  if (!contact_id) return res.status(400).json({ error: 'contact_id required' });

  const lastSend = db.prepare(
    'SELECT * FROM send_logs WHERE contact_id = ? ORDER BY timestamp DESC LIMIT 1'
  ).get(contact_id);

  if (lastSend) {
    db.prepare(
      'UPDATE templates SET responses_count = responses_count + 1 WHERE id = ?'
    ).run(lastSend.template_id);
  }

  res.json({ ok: true });
});

function getNextTemplate() {
  const active = db.prepare(
    'SELECT * FROM templates WHERE is_active = 1 ORDER BY rotation_order, id'
  ).all();
  if (!active.length) return null;
  const idx = Number(db.prepare("SELECT value FROM app_state WHERE key = 'next_template_index'").get().value);
  return active[idx % active.length];
}

function advanceTemplateIndex() {
  const active = db.prepare('SELECT id FROM templates WHERE is_active = 1 ORDER BY rotation_order, id').all();
  if (!active.length) return;
  const idx = Number(db.prepare("SELECT value FROM app_state WHERE key = 'next_template_index'").get().value);
  db.prepare("UPDATE app_state SET value = ? WHERE key = 'next_template_index'").run(String((idx + 1) % active.length));
}

module.exports = router;
