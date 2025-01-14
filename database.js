const Database = require('better-sqlite3');

// Initialize the database
const db = new Database('./meals.db');

// Example: Create tables if they don’t exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );
  
  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    ingredients TEXT,
    lastUsed TEXT,
    url TEXT
  );
`);

module.exports = db;
