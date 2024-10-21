const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add a new rice entry with duplicate check and subtract from FRK stock
router.post('/', (req, res) => {
  const { date, godown, challanNo, lorryNo, variety, onbBags, ssBags, swpBags, tonsKgs, moisture, adNumber, adDate, company, year, frk } = req.body;

  if (!date || !godown || !challanNo || !lorryNo || !variety || !company || !year || frk === undefined) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Check for duplicate challanNo within the same company and year
    const checkDuplicateSql = 'SELECT COUNT(*) AS count FROM rice_entries WHERE challanNo = ? AND company = ? AND year = ?';
    db.get(checkDuplicateSql, [challanNo, company, year], (err, result) => {
      if (err) {
        console.error('Error checking for duplicate challanNo:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to check for duplicate challanNo' });
      }
      if (result.count > 0) {
        db.run('ROLLBACK');
        return res.status(409).json({ error: 'Duplicate entry: Challan No already exists for this company and year' });
      }

      // Insert the new rice entry
      const insertRiceEntrySql = `
        INSERT INTO rice_entries (
          date, godown, challanNo, lorryNo, variety, onbBags, ssBags, swpBags, tonsKgs, moisture, adNumber, adDate, company, year, frk
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const riceValues = [date, godown, challanNo, lorryNo, variety, onbBags, ssBags, swpBags, tonsKgs, moisture, adNumber, adDate, company, year, frk];

      db.run(insertRiceEntrySql, riceValues, function(err) {
        if (err) {
          console.error('Error inserting new rice entry:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to insert new rice entry' });
        }

        // Only update FRK if adDate is provided
        if (adDate) {
          const insertFrkEntrySql = `
            INSERT INTO frk_details (date, company, year, KGs, debited_KGs, remaining_KGs)
            SELECT ?, ?, ?, 0, ?, remaining_KGs - ? 
            FROM frk_details 
            WHERE company = ? AND year = ? 
            ORDER BY date DESC LIMIT 1
          `;
          const frkValues = [adDate, company, year, frk, frk, company, year];

          db.run(insertFrkEntrySql, frkValues, function(err) {
            if (err) {
              console.error('Error inserting FRK entry:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to update FRK entry' });
            }

            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to commit transaction' });
              }

              res.status(201).json({ id: this.lastID, message: 'Rice entry added and FRK entry created.' });
            });
          });
        } else {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to commit transaction' });
            }

            res.status(201).json({ id: this.lastID, message: 'Rice entry added without updating FRK.' });
          });
        }
      });
    });
  });
});

// Update an existing rice entry
router.put('/:challanNo', (req, res) => {
  const { date, godown, lorryNo, variety, onbBags, ssBags, swpBags, tonsKgs, moisture, adNumber, adDate, company, year, frk } = req.body;
  const { challanNo } = req.params;

  if (!challanNo || !company || !year) {
    return res.status(400).json({ error: 'Challan No, company, and year are required' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Update the existing rice entry
    const updateRiceEntrySql = `
      UPDATE rice_entries
      SET date = ?, godown = ?, lorryNo = ?, variety = ?, onbBags = ?, ssBags = ?, swpBags = ?, tonsKgs = ?, moisture = ?, adNumber = ?, adDate = ?, company = ?, year = ?, frk = ?
      WHERE challanNo = ? AND company = ? AND year = ?
    `;
    const riceValues = [date, godown, lorryNo, variety, onbBags, ssBags, swpBags, tonsKgs, moisture, adNumber, adDate, company, year, frk, challanNo, company, year];

    db.run(updateRiceEntrySql, riceValues, function(err) {
      if (err) {
        console.error('Error updating rice entry:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to update rice entry' });
      }

      // Only update FRK if adDate is provided
      if (adDate) {
        const insertFrkEntrySql = `
          INSERT INTO frk_details (date, company, year, KGs, debited_KGs, remaining_KGs)
          SELECT ?, ?, ?, 0, ?, remaining_KGs - ? 
          FROM frk_details 
          WHERE company = ? AND year = ? 
          ORDER BY date DESC LIMIT 1
        `;
        const frkValues = [adDate, company, year, frk, frk, company, year];

        db.run(insertFrkEntrySql, frkValues, function(err) {
          if (err) {
            console.error('Error inserting FRK entry:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to update FRK entry' });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to commit transaction' });
            }

            res.json({ message: 'Rice entry updated and FRK entry created.' });
          });
        });
      } else {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to commit transaction' });
          }

          res.json({ message: 'Rice entry updated without updating FRK.' });
        });
      }
    });
  });
});


// Get all rice entries or fetch a specific entry by challanNo, year, and company
router.get('/', (req, res) => {
  const { challanNo, year, company } = req.query;
  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  let sql = 'SELECT * FROM rice_entries WHERE company = ? AND year = ?';
  let values = [company, year];

  if (challanNo) {
    sql += ' AND challanNo = ?';
    values.push(challanNo);
  }

  db.all(sql, values, (err, results) => {
    if (err) {
      console.error('Error fetching rice entries:', err);
      return res.status(500).json({ error: 'Failed to fetch rice entries' });
    }
    res.json(results);
  });
});

// Delete a rice entry by id, company, and year
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { company, year } = req.query;

  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const deleteRiceEntrySql = 'DELETE FROM rice_entries WHERE id = ? AND company = ? AND year = ?';
    const values = [id, company, year];

    db.run(deleteRiceEntrySql, values, function (err) {
      if (err) {
        console.error('Error deleting rice entry:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to delete rice entry' });
      }

      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Rice entry not found or does not match the provided company and year' });
      }

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to commit transaction' });
        }

        res.json({ message: 'Rice entry deleted successfully' });
      });
    });
  });
});

module.exports = router;
