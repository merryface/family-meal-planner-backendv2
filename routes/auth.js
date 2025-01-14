const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'defaultsecret';
console.log('Registering /auth routes');

console.log('Auth routes are being registered');

// Register a user
router.post('/register', async (req, res) => {
  console.log('POST /auth/register accessed'); 
  const { username, password } = req.body;

  if (!username || !password) {
    console.log('Missing username or password');
    return res.status(400).json({ error: 'Username and password required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const stmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
    stmt.run(username, hashedPassword);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
  
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});


module.exports = router;
