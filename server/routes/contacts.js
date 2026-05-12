const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { loadContactsFromSheet } = require('../services/sheets');

const router = express.Router();

// GET contacts (juniors see own; admin sees all or can filter by user_id)
router.get('/', requireAuth, (req, res) => {
  const { status, user_id } = req.query;
  let userId = req.user.role === 'admin' && user_id ? Number(user_id) : null;
  if (req.user.role !== 'admin') userId = req.user.id;

  let query = 'SELECT * FROM contacts WHERE 1=1';
  const params = [];

  if (userId) { query += ' AND user_id = ?'; params.push(userId); }
  if (status && status !== 'all') { query += ' AND status = ?'; params.push(status); }

  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// POST single contact
router.post('/', requireAuth, (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

  const clean = phone.replace(/\s+/g, '').replace(/^0/, '60').replace(/[^\d+]/g, '');
  const exists = db.prepare(
    'SELECT id FROM contacts WHERE phone = ? AND user_id = ?'
  ).get(clean, req.user.id);
  if (exists) return res.status(409).json({ error: 'Duplicate phone number' });

  const result = db.prepare(
    "INSERT INTO contacts (user_id, name, phone, status) VALUES (?, ?, ?, 'pending')"
  ).run(req.user.id, name.trim(), clean);

  res.status(201).json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid));
});

// POST bulk paste: array of {name, phone}
router.post('/bulk', requireAuth, (req, res) => {
  const contacts = req.body.contacts;
  if (!Array.isArray(contacts) || !contacts.length) {
    return res.status(400).json({ error: 'contacts array required' });
  }

  const insert = db.prepare(
    "INSERT OR IGNORE INTO contacts (user_id, name, phone, status) VALUES (?, ?, ?, 'pending')"
  );

  let added = 0;
  let skipped = 0;

  const run = db.transaction(() => {
    for (const c of contacts) {
      if (!c.name || !c.phone) { skipped++; continue; }
      const clean = c.phone.replace(/\s+/g, '').replace(/^0/, '60').replace(/[^\d+]/g, '');
      const exists = db.prepare(
        'SELECT id FROM contacts WHERE phone = ? AND user_id = ?'
      ).get(clean, req.user.id);
      if (exists) { skipped++; continue; }
      insert.run(req.user.id, c.name.trim(), clean);
      added++;
    }
  });
  run();

  res.json({ added, skipped });
});

// POST import from Google Sheets URL
router.post('/import-sheet', requireAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  let contacts;
  try {
    contacts = await loadContactsFromSheet(url);
  } catch (err) {
    return res.status(400).json({ error: `Could not load sheet: ${err.message}` });
  }

  const insert = db.prepare(
    "INSERT OR IGNORE INTO contacts (user_id, name, phone, status) VALUES (?, ?, ?, 'pending')"
  );

  let added = 0;
  let skipped = 0;

  const run = db.transaction(() => {
    for (const c of contacts) {
      const exists = db.prepare(
        'SELECT id FROM contacts WHERE phone = ? AND user_id = ?'
      ).get(c.phone, req.user.id);
      if (exists) { skipped++; continue; }
      insert.run(req.user.id, c.name, c.phone);
      added++;
    }
  });
  run();

  res.json({ added, skipped, total: contacts.length });
});

// PATCH status
router.patch('/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'sent', 'interested', 'callback', 'no_answer', 'dnc'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && contact.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.prepare(
    "UPDATE contacts SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, req.params.id);

  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id));
});

// DELETE contact
router.delete('/:id', requireAuth, (req, res) => {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && contact.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// DELETE all contacts for current user
router.delete('/', requireAuth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
