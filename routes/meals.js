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
    const stmt = db.prepare(`SELECT * FROM meals`);
    const meals = stmt.all();

    // Parse the `ingredients` field for each meal
    const parsedMeals = meals.map((meal) => ({
      ...meal,
      ingredients: JSON.parse(meal.ingredients), // Parse JSON string back into array
    }));

    res.json(parsedMeals);
  } catch (err) {
    console.error('Error fetching meals:', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});


// Add or update a meal
router.post('/', (req, res) => {
  const { name, ingredients, lastUsed, url } = req.body;

  if (!name || !ingredients || !url) {
    return res.status(400).json({ error: 'Invalid meal data' });
  }

  try {
    const stmt = db.prepare(
      `INSERT INTO meals (name, ingredients, lastUsed, url) VALUES (?, ?, ?, ?)`
    );
    stmt.run(name, JSON.stringify(ingredients), lastUsed, url);
    res.status(201).json({ message: 'Meal added successfully' });
  } catch (err) {
    console.error('Error adding meal:', err);
    res.status(500).json({ error: 'Failed to add meal' });
  }
});


router.get('/weekly', (req, res) => {
  try {
    // Fetch all meals from the database
    const stmt = db.prepare(`SELECT * FROM meals`);
    const allMeals = stmt.all();

    if (allMeals.length === 0) {
      return res.status(404).json({ error: 'No meals found' });
    }

    // Sort meals by lastUsed (oldest first)
    allMeals.sort((a, b) => new Date(a.lastUsed) - new Date(b.lastUsed));

    // Select up to 7 meals
    const selectedMeals = allMeals.slice(0, 7);

    // Shuffle the selected meals to introduce randomness
    for (let i = selectedMeals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedMeals[i], selectedMeals[j]] = [selectedMeals[j], selectedMeals[i]];
    }

    res.json(selectedMeals);
  } catch (err) {
    console.error('Error selecting weekly meals:', err);
    res.status(500).json({ error: 'Failed to select weekly meals' });
  }
});


// Update last used
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const lastUsed = new Date().toISOString(); // Get the current timestamp

  try {
    const stmt = db.prepare(`UPDATE meals SET lastUsed = ? WHERE id = ?`);
    const result = stmt.run(lastUsed, id);

    // Check if a row was actually updated
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json({ message: 'Meal updated successfully' });
  } catch (err) {
    console.error('Error updating meal:', err);
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

module.exports = router;
