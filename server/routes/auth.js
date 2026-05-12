const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.is_active) return res.status(403).json({ error: 'Account disabled' });

  if (user.role !== 'admin' && user.expires_at) {
    if (new Date(user.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Account expired' });
    }
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, expires_at: user.expires_at }
  });
});

// Admin: list all users
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = db.prepare(
    'SELECT id, username, role, is_active, expires_at, created_at FROM users ORDER BY id'
  ).all();
  res.json(users);
});

// Admin: update a junior account
router.patch('/users/:id', requireAuth, requireAdmin, (req, res) => {
  const { is_active, password, expires_at } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot modify admin via this endpoint' });

  const updates = [];
  const params = [];

  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
  if (expires_at !== undefined) { updates.push('expires_at = ?'); params.push(expires_at); }
  if (password) {
    updates.push('password_hash = ?');
    params.push(bcrypt.hashSync(password, 10));
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare(
    'SELECT id, username, role, is_active, expires_at FROM users WHERE id = ?'
  ).get(req.params.id);
  res.json(updated);
});

module.exports = router;
