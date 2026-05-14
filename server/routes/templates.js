const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM templates ORDER BY rotation_order, id').all());
});

router.post('/', requireAuth, (req, res) => {
  const { label, body } = req.body;
  if (!label || !body) return res.status(400).json({ error: 'label and body required' });

  const count = db.prepare('SELECT COUNT(*) as n FROM templates').get().n;
  if (count >= 6) return res.status(400).json({ error: 'Maximum 6 templates' });

  const result = db.prepare(
    'INSERT INTO templates (label, body, is_active, rotation_order) VALUES (?, ?, 1, ?)'
  ).run(label.trim(), body.trim(), count);

  res.status(201).json(db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', requireAuth, (req, res) => {
  const { label, body, is_active } = req.body;
  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });

  const updates = [];
  const params = [];
  if (label !== undefined) { updates.push('label = ?'); params.push(label.trim()); }
  if (body !== undefined) { updates.push('body = ?'); params.push(body.trim()); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  params.push(req.params.id);
  db.prepare(`UPDATE templates SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const t = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.delete('/', requireAuth, (req, res) => {
  db.prepare('DELETE FROM templates').run();
  db.prepare("UPDATE app_state SET value = '0' WHERE key = 'next_template_index'").run();
  res.json({ ok: true });
});

module.exports = router;
