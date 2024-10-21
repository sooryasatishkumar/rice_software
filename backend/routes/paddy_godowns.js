const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all paddy godowns
router.get('/', (req, res) => {
  const sql = 'SELECT name FROM paddy_godowns';
  db.all(sql, [], (err, results) => {
    if (err) {
      console.error('Error fetching godowns:', err);
      return res.status(500).json({ error: 'Failed to fetch godowns' });
    }
    res.json(results);
  });
});

// Add a new paddy godown
router.post('/', (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: 'Godown name is required' });
  }

  // Check if godown already exists
  const checkDuplicateSql = 'SELECT COUNT(*) AS count FROM paddy_godowns WHERE name = ?';
  db.get(checkDuplicateSql, [name], (err, result) => {
    if (err) {
      console.error('Error checking for duplicate godown:', err);
      return res.status(500).json({ error: 'Failed to check godown existence' });
    }
    if (result.count > 0) {
      return res.status(409).json({ error: 'Godown already exists' });
    }

    // Insert new godown
    const insertSql = 'INSERT INTO paddy_godowns (name) VALUES (?)';
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
