const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const userId = Buffer.from(email).toString('base64');
  res.json({
    userId,
    email,
    token: Buffer.from(`${email}:${Date.now()}`).toString('base64')
  });
});

router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const userId = Buffer.from(email).toString('base64');
  res.json({
    userId,
    email,
    token: Buffer.from(`${email}:${Date.now()}`).toString('base64')
  });
});

module.exports = router;
