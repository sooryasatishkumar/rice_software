const express = require('express');
const router = express.Router();
const db = require('../config/db');

const OUTTURN_RATIO = 0.68;

// Helper function to calculate progressive values
// Helper function to calculate progressive values
function calculateProgressiveValues(results) {
  let progPaddyBags = 0;
  let progPaddyTonsKgs = 0;
  let progRiceDue = 0;
  let progRiceBags = 0;
  let progRiceTonsKgs = 0;
  let totalBalanceRiceDue = 0;

  // Filter out rows with date '01/01/1970'
  const filteredResults = results.filter(row => {
    const rowDate = new Date(row.date);
    return rowDate.getTime() !== new Date('1970-01-01').getTime();
  });

  const formattedResults = filteredResults.map(row => {
    if (row.paddy_bags !== null) {
      progPaddyBags += row.paddy_bags;
      progPaddyTonsKgs += row.paddy_tonsKgs;
      progRiceDue += row.rice_due_rpa + row.rice_due_rpc; // Sum all varieties for total
    }
    if (row.rice_bags !== null) {
      progRiceBags += row.rice_bags;
      progRiceTonsKgs += row.rice_tonsKgs;
    }

    const balanceDue = progRiceDue - progRiceTonsKgs;
    totalBalanceRiceDue = balanceDue;

    return {
      ...row,
      progPaddyBags,
      progPaddyTonsKgs,
      progRiceDueTotal: progRiceDue, // Use this for total
      progRiceBagsTotal: progRiceBags, // Use this for total
      progRiceTonsKgsTotal: progRiceTonsKgs, // Use this for total
      totalBalanceRiceDue
    };
  });

  return formattedResults;
}


// Fetch total outturn data
router.get('/', (req, res) => {
  const { company, year } = req.query;

  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  const outturnSql = `
    SELECT
      date,
      grade AS paddy_variety,
      NULL AS rice_variety,
      (onbBags + ssBags + swpBags) AS paddy_bags,
      tonsKgs AS paddy_tonsKgs,
      CASE
        WHEN grade = 'RPA' THEN tonsKgs * ${OUTTURN_RATIO}
        ELSE 0
      END AS rice_due_rpa,
      CASE
        WHEN grade = 'RPC' THEN tonsKgs * ${OUTTURN_RATIO}
        ELSE 0
      END AS rice_due_rpc,
      NULL AS rice_bags,
      NULL AS rice_tonsKgs,
      NULL AS ad_no,
      company,
      year
    FROM paddy_entries
    WHERE company = ? AND year = ?
    UNION ALL
    SELECT
      adDate AS date,
      NULL AS paddy_variety,
      variety AS rice_variety,
      NULL AS paddy_bags,
      NULL AS paddy_tonsKgs,
      NULL AS rice_due_rpa,
      NULL AS rice_due_rpc,
      (onbBags + ssBags + swpBags) AS rice_bags,
      tonsKgs AS rice_tonsKgs,
      adNumber AS ad_no,
      company,
      year
    FROM rice_entries
    WHERE company = ? AND year = ?
    ORDER BY date;
  `;

  db.all(outturnSql, [company, year, company, year], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Server error');
      return;
    }

    const formattedResults = calculateProgressiveValues(results);

    res.json(formattedResults);
  });
});

// Fetch outturn data for variety A
router.get('/a', (req, res) => {
  const { company, year } = req.query;

  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  const outturnSql = `
    SELECT
      date,
      grade AS paddy_variety,
      NULL AS rice_variety,
      (onbBags + ssBags + swpBags) AS paddy_bags,
      tonsKgs AS paddy_tonsKgs,
      CASE
        WHEN grade = 'RPA' THEN tonsKgs * ${OUTTURN_RATIO}
        ELSE 0
      END AS rice_due_rpa,
      NULL AS rice_due_rpc,
      NULL AS rice_bags,
      NULL AS rice_tonsKgs,
      NULL AS ad_no,
      company,
      year
    FROM paddy_entries
    WHERE grade = 'RPA' AND company = ? AND year = ?
    UNION ALL
    SELECT
      adDate AS date,
      NULL AS paddy_variety,
      variety AS rice_variety,
      NULL AS paddy_bags,
      NULL AS paddy_tonsKgs,
      tonsKgs AS rice_due_rpa,
      NULL AS rice_due_rpc,
      (onbBags + ssBags + swpBags) AS rice_bags,
      tonsKgs AS rice_tonsKgs,
      adNumber AS ad_no,
      company,
      year
    FROM rice_entries
    WHERE variety = 'BRA' AND company = ? AND year = ?
    ORDER BY date;
  `;

  db.all(outturnSql, [company, year, company, year], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Server error');
      return;
    }

    const formattedResults = calculateProgressiveValues(results, 'BRA');

    res.json(formattedResults);
  });
});

// Fetch outturn data for variety C
router.get('/c', (req, res) => {
  const { company, year } = req.query;

  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  const outturnSql = `
    SELECT
      date,
      grade AS paddy_variety,
      NULL AS rice_variety,
      (onbBags + ssBags + swpBags) AS paddy_bags,
      tonsKgs AS paddy_tonsKgs,
      NULL AS rice_due_rpa,
      CASE
        WHEN grade = 'RPC' THEN tonsKgs * ${OUTTURN_RATIO}
        ELSE 0
      END AS rice_due_rpc,
      NULL AS rice_bags,
      NULL AS rice_tonsKgs,
      NULL AS ad_no,
      company,
      year
    FROM paddy_entries
    WHERE grade = 'RPC' AND company = ? AND year = ?
    UNION ALL
    SELECT
      adDate AS date,
      NULL AS paddy_variety,
      variety AS rice_variety,
      NULL AS paddy_bags,
      NULL AS paddy_tonsKgs,
      NULL AS rice_due_rpa,
      tonsKgs AS rice_due_rpc,
      (onbBags + ssBags + swpBags) AS rice_bags,
      tonsKgs AS rice_tonsKgs,
      adNumber AS ad_no,
      company,
      year
    FROM rice_entries
    WHERE variety = 'BRC' AND company = ? AND year = ?
    ORDER BY date;
  `;

  db.all(outturnSql, [company, year, company, year], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).send('Server error');
      return;
    }

    const formattedResults = calculateProgressiveValues(results, 'BRC');

    res.json(formattedResults);
  });
});

module.exports = router;
