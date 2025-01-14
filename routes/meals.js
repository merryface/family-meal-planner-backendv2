const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'defaultsecret';

// Middleware for authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Get all meals
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM meals');
    const meals = stmt.all(); // Fetch all rows synchronously
    res.json(meals);
  } catch (err) {
    console.error('Error fetching meals:', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});



// Add or update a meal
router.post('/', authenticate, (req, res) => {
  const { name, ingredients, url } = req.body;
  const lastUsed = new Date().toISOString();

  db.run(
    `INSERT INTO meals (name, ingredients, lastUsed, url) VALUES (?, ?, ?, ?)`,
    [name, JSON.stringify(ingredients), lastUsed, url],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to add meal' });
      res.status(201).json({ message: 'Meal added successfully' });
    }
  );
});

// Semi-random weekly meal selection
router.get('/weekly', authenticate, (req, res) => {
  db.all(`SELECT * FROM meals ORDER BY RANDOM() LIMIT 7`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch meals' });
    res.json(rows);
  });
});

// Update last used
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const lastUsed = new Date().toISOString();

  db.run(
    `UPDATE meals SET lastUsed = ? WHERE id = ?`,
    [lastUsed, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update meal' });
      res.json({ message: 'Meal updated successfully' });
    }
  );
});

module.exports = router;
