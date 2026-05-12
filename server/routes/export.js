const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/contacts', requireAuth, (req, res) => {
  const { format = 'json' } = req.query;
  const contacts = req.user.role === 'admin'
    ? db.prepare(`
        SELECT c.*, u.username FROM contacts c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.user_id, c.created_at
      `).all()
    : db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at').all(req.user.id);

  if (format === 'csv') {
    const header = 'name,phone,status,created_at\n';
    const rows = contacts.map((c) => `"${c.name}","${c.phone}",${c.status},${c.created_at}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    return res.send(header + rows);
  }

  res.setHeader('Content-Disposition', 'attachment; filename="contacts.json"');
  res.json(contacts);
});

router.get('/sends', requireAuth, (req, res) => {
  const { format = 'json' } = req.query;
  const logs = req.user.role === 'admin'
    ? db.prepare(`
        SELECT sl.timestamp, u.username, c.name, c.phone, a.name as account, t.label as template
        FROM send_logs sl
        JOIN users u ON sl.user_id = u.id
        JOIN contacts c ON sl.contact_id = c.id
        JOIN wa_accounts a ON sl.account_id = a.id
        JOIN templates t ON sl.template_id = t.id
        ORDER BY sl.timestamp DESC
      `).all()
    : db.prepare(`
        SELECT sl.timestamp, c.name, c.phone, a.name as account, t.label as template
        FROM send_logs sl
        JOIN contacts c ON sl.contact_id = c.id
        JOIN wa_accounts a ON sl.account_id = a.id
        JOIN templates t ON sl.template_id = t.id
        WHERE sl.user_id = ?
        ORDER BY sl.timestamp DESC
      `).all(req.user.id);

  if (format === 'csv') {
    const keys = Object.keys(logs[0] || {});
    const header = keys.join(',') + '\n';
    const rows = logs.map((r) => keys.map((k) => `"${r[k] || ''}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sends.csv"');
    return res.send(logs.length ? header + rows : '');
  }

  res.setHeader('Content-Disposition', 'attachment; filename="sends.json"');
  res.json(logs);
});

module.exports = router;
