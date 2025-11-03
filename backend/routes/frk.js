const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Fetch FRK stock additions and rice entries with adNumber
router.get('/frk-balance', (req, res) => {
  const { company, year } = req.query;
  const parsedYear = parseInt(year, 10);

  if (!company || !parsedYear) {
    return res.status(400).json({ error: 'Company and valid year are required.' });
  }

  db.serialize(() => {
    // Fetch the FRK stock additions, ordered by date
    const getFrkStockSql = `
      SELECT id, date, frk
      FROM frk_entries
      WHERE company = ? AND year = ?
      ORDER BY date ASC
    `;

    db.all(getFrkStockSql, [company, parsedYear], (err, frkStocks) => {
      if (err) {
        console.error('Error fetching FRK stock entries:', err);
        return res.status(500).json({ error: 'Failed to fetch FRK stock entries' });
      }

      // Fetch rice entries with adNumber, ordered by date
      const getRiceEntriesSql = `
        SELECT date, adNumber, frk
        FROM rice_entries
        WHERE adNumber IS NOT NULL AND company = ? AND year = ?
        ORDER BY date ASC
      `;

      db.all(getRiceEntriesSql, [company, parsedYear], (err, riceEntries) => {
        if (err) {
          console.error('Error fetching rice entries:', err);
          return res.status(500).json({ error: 'Failed to fetch rice entries' });
        }

        // Combine both FRK stocks and rice entries in a single array
        const combinedEntries = [];

        // Add FRK stock entries
        frkStocks.forEach(stock => {
          combinedEntries.push({
            id: stock.id,
            date: stock.date,
            frkAdded: stock.frk,
            frkUsed: 0, // No FRK used for stock addition
          });
        });

        // Add rice entries (FRK used)
        riceEntries.forEach(rice => {
          combinedEntries.push({
            date: rice.date,
            frkAdded: 0, // No FRK added for rice entry
            frkUsed: rice.frk,
          });
        });

        // Sort all entries by date
        combinedEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate the cumulative FRK balance
        let cumulativeBalance = 0;
        const resultEntries = combinedEntries.map(entry => {
          cumulativeBalance += entry.frkAdded - entry.frkUsed;

          return {
            id: entry.id,
            date: entry.date,
            frkAdded: entry.frkAdded,
            frkUsed: entry.frkUsed,
            balance: cumulativeBalance
          };
        });

        // Return the calculated stock and rice entry deductions
        res.json(resultEntries);
      });
    });
  });
});

// Add a new FRK entry to the database
router.post('/', (req, res) => {
  const { company, year, date, frk } = req.body;

  // Validate the request body
  if (!company || !year || !date || frk === undefined) {
    return res.status(400).json({ error: 'Company, year, date, and frk are required.' });
  }

  const parsedYear = parseInt(year, 10);
  const parsedFrk = parseFloat(frk);

  // Validate year and FRK values
  if (isNaN(parsedYear) || isNaN(parsedFrk)) {
    return res.status(400).json({ error: 'Invalid year or FRK amount.' });
  }

  // SQL query to insert a new FRK entry
  const insertFrkSql = `
    INSERT INTO frk_entries (company, year, date, frk)
    VALUES (?, ?, ?, ?)
  `;

  // Insert into the database
  db.run(insertFrkSql, [company, parsedYear, date, parsedFrk], function (err) {
    if (err) {
      console.error('Error inserting new FRK entry:', err);
      return res.status(500).json({ error: 'Failed to insert FRK entry.' });
    }

    // Return success message
    res.status(201).json({ message: 'FRK entry added successfully!', id: this.lastID });
  });
});

// Delete an FRK entry by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID is required to delete an entry.' });
  }

  // SQL query to delete an FRK entry by its ID
  const deleteFrkSql = `DELETE FROM frk_entries WHERE id = ?`;

  db.run(deleteFrkSql, [id], function (err) {
    if (err) {
      console.error('Error deleting FRK entry:', err);
      return res.status(500).json({ error: 'Failed to delete FRK entry.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'FRK entry not found.' });
    }

    // Return success message
    res.status(200).json({ message: 'FRK entry deleted successfully.' });
  });
});

module.exports = router;
