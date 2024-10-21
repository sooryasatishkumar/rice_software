const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add a new paddy entry with duplicate check
router.post('/', (req, res) => {
  const { date, godown, issueMemoId, lorryNo, grade, moisture, onbBags, ssBags, swpBags, nbBags, tonsKgs, company, year } = req.body;

  // Basic input validation
  if (!date || !godown || !issueMemoId || !lorryNo || !grade || !company || !year) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  // Check for duplicate issueMemoId within the same company and year
  const checkDuplicateSql = 'SELECT COUNT(*) AS count FROM paddy_entries WHERE issueMemoId = ? AND company = ? AND year = ?';
  db.get(checkDuplicateSql, [issueMemoId, company, year], (err, result) => {
    if (err) {
      console.error('Error checking for duplicate entry:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (result.count > 0) {
      return res.status(409).json({ error: 'Duplicate entry: Issue Memo ID already exists for this company and year' });
    }

    // Insert new entry
    const sql = `
      INSERT INTO paddy_entries 
      (date, godown, issueMemoId, lorryNo, grade, moisture, onbBags, ssBags, swpBags, nbBags, tonsKgs, company, year) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [date, godown, issueMemoId, lorryNo, grade, moisture, onbBags, ssBags, swpBags, nbBags, tonsKgs, company, year];
    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error inserting new paddy entry:', err);
        return res.status(500).json({ error: 'Failed to add new paddy entry' });
      }
      res.status(201).json({ id: this.lastID, message: 'Paddy entry added successfully' });
    });
  });
});

// Update a paddy entry based on issueMemoId, company, and year
router.put('/:issueMemoId', (req, res) => {
  const { date, godown, lorryNo, grade, moisture, onbBags, ssBags, swpBags, nbBags, tonsKgs, company, year } = req.body;
  const { issueMemoId } = req.params;

  if (!issueMemoId || !company || !year) {
    return res.status(400).json({ error: 'Issue Memo ID, company, and year are required' });
  }

  const sql = `
    UPDATE paddy_entries 
    SET date = ?, godown = ?, lorryNo = ?, grade = ?, moisture = ?, onbBags = ?, ssBags = ?, swpBags = ?, nbBags = ?, tonsKgs = ? 
    WHERE issueMemoId = ? AND company = ? AND year = ?
  `;
  const values = [date, godown, lorryNo, grade, moisture, onbBags, ssBags, swpBags, nbBags, tonsKgs, issueMemoId, company, year];
  db.run(sql, values, function(err) {
    if (err) {
      console.error('Error updating paddy entry:', err);
      return res.status(500).json({ error: 'Failed to update paddy entry' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Paddy entry not found for the given company and year' });
    }
    res.json({ message: 'Paddy entry updated successfully!' });
  });
});

// Get paddy entries by issueMemoId, company, and year
router.get('/', (req, res) => {
  const { issueMemoId, company, year } = req.query;

  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  let sql = 'SELECT * FROM paddy_entries WHERE company = ? AND year = ?';
  let values = [company, year];

  if (issueMemoId) {
    sql += ' AND issueMemoId = ?';
    values.push(issueMemoId);
  }

  db.all(sql, values, (err, results) => {
    if (err) {
      console.error('Error fetching paddy entries:', err);
      return res.status(500).json({ error: 'Failed to fetch paddy entries' });
    }
    res.json(results);
  });
});

// Delete a paddy entry by id, company, and year
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { company, year } = req.query;

  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  const deleteSql = 'DELETE FROM paddy_entries WHERE id = ? AND company = ? AND year = ?';
  const values = [id, company, year];

  db.run(deleteSql, values, function(err) {
    if (err) {
      console.error('Error deleting paddy entry:', err);
      return res.status(500).json({ error: 'Failed to delete paddy entry' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Paddy entry not found for the given company and year' });
    }
    res.json({ message: 'Paddy entry deleted successfully' });
  });
});

module.exports = router;
