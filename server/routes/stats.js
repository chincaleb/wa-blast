const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  // Total contacts for this user (admin = all)
  const totalContacts = isAdmin
    ? db.prepare('SELECT COUNT(*) as n FROM contacts').get().n
    : db.prepare('SELECT COUNT(*) as n FROM contacts WHERE user_id = ?').get(userId).n;

  // Sends today
  const sentToday = isAdmin
    ? db.prepare("SELECT COUNT(*) as n FROM send_logs WHERE timestamp >= ?").get(today + 'T00:00:00').n
    : db.prepare("SELECT COUNT(*) as n FROM send_logs WHERE user_id = ? AND timestamp >= ?").get(userId, today + 'T00:00:00').n;

  // Response count (interested or callback status)
  const responseCount = isAdmin
    ? db.prepare("SELECT COUNT(*) as n FROM contacts WHERE status IN ('interested','callback')").get().n
    : db.prepare("SELECT COUNT(*) as n FROM contacts WHERE user_id = ? AND status IN ('interested','callback')").get(userId).n;

  // Pipeline breakdown
  const statuses = ['pending','sent','interested','callback','no_answer','dnc'];
  const pipeline = {};
  for (const s of statuses) {
    pipeline[s] = isAdmin
      ? db.prepare('SELECT COUNT(*) as n FROM contacts WHERE status = ?').get(s).n
      : db.prepare('SELECT COUNT(*) as n FROM contacts WHERE user_id = ? AND status = ?').get(userId, s).n;
  }

  // Per template performance
  const templates = db.prepare(
    'SELECT id, label, sends_count, responses_count, is_active FROM templates ORDER BY rotation_order, id'
  ).all().map((t) => ({
    ...t,
    response_rate: t.sends_count > 0 ? Math.round((t.responses_count / t.sends_count) * 100) : 0
  }));

  const responseRate = totalContacts > 0
    ? Math.round((responseCount / totalContacts) * 100)
    : 0;

  res.json({
    totalContacts,
    sentToday,
    responseCount,
    responseRate,
    pipeline,
    templates
  });
});

module.exports = router;
