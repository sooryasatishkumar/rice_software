const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Ensure the correct path to the database config

// Get all rice godowns
router.get('/', (req, res) => {
  const sql = 'SELECT name FROM rice_godowns';
  db.all(sql, [], (err, results) => {
    if (err) {
      console.error('Error fetching rice godowns:', err);
      return res.status(500).json({ error: 'Failed to fetch rice godowns' });
    }
    res.json(results);
  });
});

// Add a new rice godown
router.post('/', (req, res) => {
  const { name } = req.body;

  // Basic input validation
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: 'Godown name is required' });
  }

  // Check for duplicate godown name
  const checkDuplicateSql = 'SELECT COUNT(*) AS count FROM rice_godowns WHERE name = ?';
  db.get(checkDuplicateSql, [name], (err, result) => {
    if (err) {
      console.error('Error checking for duplicate godown:', err);
      return res.status(500).json({ error: 'Failed to check godown existence' });
    }
    if (result.count > 0) {
      return res.status(409).json({ error: 'Godown already exists' });
    }

    // Insert new godown
    const insertSql = 'INSERT INTO rice_godowns (name) VALUES (?)';
    db.run(insertSql, [name], function(err) {
      if (err) {
        console.error('Error inserting new godown:', err);
        return res.status(500).json({ error: 'Failed to add new godown' });
      }
      res.status(201).json({ id: this.lastID, message: 'Godown added successfully' });
    });
  });
});

module.exports = router;
