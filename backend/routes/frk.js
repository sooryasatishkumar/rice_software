const express = require('express');
const router = express.Router();
const db = require('../config/db');


// Add a new FRK entry
router.post('/', (req, res) => {
  const { date, company, year, KGs, debited_KGs = 0 } = req.body;

  if (!date || !company || !year || (KGs === undefined && debited_KGs === undefined)) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error starting transaction:', err);
        return res.status(500).json({ error: 'Transaction failed to start.' });
      }

      // Fetch the last entry to get the previous remaining_KGs
      const fetchLastFrkSql = `
        SELECT remaining_KGs
        FROM frk_details 
        WHERE company = ? AND year = ? 
        ORDER BY date DESC, id DESC 
        LIMIT 1
      `;

      db.get(fetchLastFrkSql, [company, year], (err, lastEntry) => {
        if (err) {
          console.error('Error fetching last FRK entry:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to fetch previous FRK entry.' });
        }

        // Ensure numeric conversion
        const previousRemainingKGs = lastEntry ? parseFloat(lastEntry.remaining_KGs) : 0;
        const currentKGs = parseFloat(KGs);
        const currentDebitedKGs = parseFloat(debited_KGs);

        let newRemainingKGs;

        if (currentKGs > 0 && currentDebitedKGs === 0) {
          newRemainingKGs = previousRemainingKGs + currentKGs;
        } else if (currentKGs === 0 && currentDebitedKGs > 0) {
          newRemainingKGs = previousRemainingKGs - currentDebitedKGs;
        } else {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Invalid FRK entry. Either KGs or debited_KGs should be greater than zero.' });
        }

        const insertFrkEntrySql = `
          INSERT INTO frk_details (date, company, year, KGs, debited_KGs, remaining_KGs)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(insertFrkEntrySql, [date, company, year, currentKGs, currentDebitedKGs, newRemainingKGs], function(err) {
          if (err) {
            console.error('Error inserting FRK entry:', err);
            db.run('ROLLBACK', () => {
              return res.status(500).json({ error: 'Failed to add FRK stock.' });
            });
            return;
          }

          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              db.run('ROLLBACK', () => {
                return res.status(500).json({ error: 'Transaction commit failed.' });
              });
              return;
            }
            res.json({ id: this.lastID, message: 'FRK stock added successfully' });
          });
        });
      });
    });
  });
});

module.exports = router;

// Get all FRK entries or filter by company and year
router.get('/', (req, res) => {
  const { company, year } = req.query;

  // Ensure that company and year are always provided
  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  const sql = 'SELECT * FROM frk_details WHERE company = ? AND year = ?';
  const values = [company, year];

  db.all(sql, values, (err, results) => {
    if (err) {
      console.error('Error fetching FRK entries:', err);
      return res.status(500).json({ error: 'Failed to fetch FRK entries.' });
    }
    res.json(results);
  });
});

// Delete an FRK entry by ID, company, and year
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { company, year } = req.query;

  if (!id || !company || !year) {
    return res.status(400).json({ error: 'ID, company, and year are required.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const fetchCurrentFrkSql = `
      SELECT KGs, debited_KGs, remaining_KGs
      FROM frk_details
      WHERE id = ? AND company = ? AND year = ?
    `;

    db.get(fetchCurrentFrkSql, [id, company, year], (err, currentEntry) => {
      if (err) {
        console.error('Error fetching current FRK entry:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to fetch FRK entry' });
      }

      if (!currentEntry) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'FRK entry not found.' });
      }

      const deleteFrkEntrySql = 'DELETE FROM frk_details WHERE id = ? AND company = ? AND year = ?';
      db.run(deleteFrkEntrySql, [id, company, year], function(err) {
        if (err) {
          console.error('Error deleting FRK entry:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to delete FRK entry' });
        }

        // After deleting, adjust the remaining_KGs for subsequent entries
        const adjustFrkEntriesSql = `
          UPDATE frk_details
          SET remaining_KGs = remaining_KGs - ?
          WHERE id > ? AND company = ? AND year = ?
        `;

        const adjustmentAmount = currentEntry.KGs > 0 ? currentEntry.KGs : -currentEntry.debited_KGs;

        db.run(adjustFrkEntriesSql, [adjustmentAmount, id, company, year], function(err) {
          if (err) {
            console.error('Error adjusting subsequent FRK entries:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to adjust FRK entries' });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to commit transaction' });
            }

            res.json({ message: 'FRK entry deleted successfully' });
          });
        });
      });
    });
  });
});

module.exports = router;
