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
  const { company, year, fromDate, toDate } = req.query;


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
  const { company, year, fromDate, toDate } = req.query;


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
  const { company, year, fromDate, toDate } = req.query;


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


// Helper function to extract only the date part (YYYY-MM-DD)
const getOnlyDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

router.get('/a-belated', (req, res) => {
  const { company, year, fromDate, toDate } = req.query;


  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  // Query for paddy entries
  const paddySql = `
    SELECT
      date AS paddy_date,
      godown,
      issueMemoId AS issue_memo_no,
      grade AS variety,
      (onbBags + ssBags + swpBags + nbBags) AS paddy_bags,
      tonsKgs AS paddy_weight,
      ROUND(tonsKgs * ${OUTTURN_RATIO}) AS rice_due -- Rounding to whole number
    FROM paddy_entries
    WHERE grade = 'RPA' AND company = ? AND year = ?
    ORDER BY paddy_date;
  `;

  // Query for rice entries
  const riceSql = `
    SELECT
      adDate AS rice_date,
      tonsKgs AS rice_deposited,
      adNumber AS rice_ad_no
    FROM rice_entries
    WHERE variety = 'BRA' AND company = ? AND year = ?
    ORDER BY rice_date;
  `;

  db.serialize(() => {
    db.all(paddySql, [company, year], (err, paddyResults) => {
      if (err) {
        console.error('Error fetching paddy entries:', err);
        return res.status(500).send('Server error');
      }

      db.all(riceSql, [company, year], (err, riceResults) => {
        if (err) {
          console.error('Error fetching rice entries:', err);
          return res.status(500).send('Server error');
        }

        let output = [];

        // Initialize variables
        let depositIndex = 0;
        let currentDepositRemaining = 0;

        // Initialize the first deposit's remaining amount
        if (riceResults.length > 0) {
          currentDepositRemaining = Number(riceResults[0].rice_deposited);
        }

        // Initialize group tracking
        let currentGroupDate = '';
        let totalPaddyBags = 0;
        let totalPaddyWeight = 0;
        let totalRiceDue = 0;
        let groupRiceDeposited = 0;

        paddyResults.forEach((paddyEntry, paddyIdx) => {
          const paddyDate = getOnlyDate(paddyEntry.paddy_date);

          // Check if we're in a new date group
          if (paddyDate !== currentGroupDate) {
            // If not the first group, add a total row for the previous group
            if (currentGroupDate !== '') {
              output.push({
                rowType: 'total',
                s_no: 'Total',
                paddy_date: currentGroupDate,
                godown: '',
                issue_memo_no: '',
                variety: '',
                paddy_bags: totalPaddyBags,
                paddy_weight: totalPaddyWeight,
                rice_due: totalRiceDue,
                rice_date: '',
                rice_deposited: groupRiceDeposited,
                rice_ad_no: ''
              });

              // Reset group-specific totals
              totalPaddyBags = 0;
              totalPaddyWeight = 0;
              totalRiceDue = 0;
              groupRiceDeposited = 0;
            }

            // Update to the new group date
            currentGroupDate = paddyDate;
          }

          let riceDue = Number(paddyEntry.rice_due);
          let fulfilledRice = [];

          console.log(`\nProcessing Paddy Entry ${paddyIdx + 1}`);
          console.log(`Rice Due: ${riceDue}`);
          console.log(`Starting Deposit Index: ${depositIndex}`);
          console.log(`Current Deposit Remaining Before Allocation: ${currentDepositRemaining}`);

          // Allocate rice deposits to fulfill rice_due
          while (riceDue > 0 && depositIndex < riceResults.length) {
            let currentDeposit = riceResults[depositIndex];

            console.log(`  Current Deposit Index: ${depositIndex}`);
            console.log(`  Current Deposit Amount: ${currentDeposit.rice_deposited}`);
            console.log(`  Current Deposit Remaining: ${currentDepositRemaining}`);
            console.log(`  Rice Due: ${riceDue}`);

            if (currentDepositRemaining >= riceDue) {
              // Fulfill the rice due with part of the current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: riceDue,
                rice_ad_no: currentDeposit.rice_ad_no
              });

              // Update groupRiceDeposited
              groupRiceDeposited += riceDue;

              // Update current deposit remaining
              currentDepositRemaining -= riceDue;
              console.log(`  Allocated ${riceDue}. Current Deposit Remaining: ${currentDepositRemaining}`);

              riceDue = 0; // Rice due is fulfilled

              // If current deposit is exhausted, move to next deposit
              if (currentDepositRemaining === 0) {
                depositIndex++;
                if (depositIndex < riceResults.length) {
                  currentDeposit = riceResults[depositIndex];
                  currentDepositRemaining = Number(currentDeposit.rice_deposited);
                  console.log(`  Moving to next deposit. New Deposit Index: ${depositIndex}`);
                }
              }
            } else {
              // Use the entire current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: currentDepositRemaining,
                rice_ad_no: currentDeposit.rice_ad_no
              });

              // Update groupRiceDeposited
              groupRiceDeposited += currentDepositRemaining;

              // Update riceDue
              riceDue -= currentDepositRemaining;
              console.log(`  Allocated ${currentDepositRemaining}. Rice Due After Allocation: ${riceDue}`);

              // Move to the next rice deposit
              depositIndex++;
              if (depositIndex < riceResults.length) {
                currentDeposit = riceResults[depositIndex];
                currentDepositRemaining = Number(currentDeposit.rice_deposited);
                console.log(`  Moving to next deposit. New Deposit Index: ${depositIndex}`);
              } else {
                currentDepositRemaining = 0;
              }
            }
          }

          if (riceDue > 0) {
            console.warn(`Not enough rice deposits to fulfill paddy entry ${paddyIdx + 1}. Remaining rice_due: ${riceDue} kgs`);
          }

          // Accumulate group-specific totals
          totalPaddyBags += paddyEntry.paddy_bags;
          totalPaddyWeight += paddyEntry.paddy_weight;
          totalRiceDue += paddyEntry.rice_due;

          // Add paddy entry with fulfilled rice deposits
          output.push({
            s_no: paddyIdx + 1,
            paddy_date: paddyEntry.paddy_date,
            godown: paddyEntry.godown,
            issue_memo_no: paddyEntry.issue_memo_no,
            variety: paddyEntry.variety,
            paddy_bags: paddyEntry.paddy_bags,
            paddy_weight: paddyEntry.paddy_weight,
            rice_due: paddyEntry.rice_due,
            rice_date: fulfilledRice.length > 0 ? fulfilledRice[0].rice_date : null,
            rice_deposited: fulfilledRice.length > 0 ? fulfilledRice[0].rice_deposited : null,
            rice_ad_no: fulfilledRice.length > 0 ? fulfilledRice[0].rice_ad_no : null,
            rowType: '' // Empty unless it's a total row
          });

          // If multiple rice deposits are needed, add additional rows
          for (let i = 1; i < fulfilledRice.length; i++) {
            output.push({
              s_no: '',
              paddy_date: '',
              godown: '',
              issue_memo_no: '',
              variety: '',
              paddy_bags: '',
              paddy_weight: '',
              rice_due: '',
              rice_date: fulfilledRice[i].rice_date,
              rice_deposited: fulfilledRice[i].rice_deposited,
              rice_ad_no: fulfilledRice[i].rice_ad_no,
              rowType: '' // No special type for these rows
            });
          }
        });

        // After processing all paddy entries, add a total row for the last group
        if (currentGroupDate !== '') {
          output.push({
            rowType: 'total',
            s_no: 'Total',
            paddy_date: currentGroupDate,
            godown: '',
            issue_memo_no: '',
            variety: '',
            paddy_bags: totalPaddyBags,
            paddy_weight: totalPaddyWeight,
            rice_due: totalRiceDue,
            rice_date: '',
            rice_deposited: groupRiceDeposited,
            rice_ad_no: ''
          });
        }

        res.json(output);
      });
    });
  });
});

router.get('/c-belated', (req, res) => {
  const { company, year, fromDate, toDate } = req.query;


  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  // Query for paddy entries
  const paddySql = `
    SELECT
      date AS paddy_date,
      godown,
      issueMemoId AS issue_memo_no,
      grade AS variety,
      (onbBags + ssBags + swpBags + nbBags) AS paddy_bags,
      tonsKgs AS paddy_weight,
      ROUND(tonsKgs * ${OUTTURN_RATIO}) AS rice_due -- Rounding to whole number
    FROM paddy_entries
    WHERE grade = 'RPC' AND company = ? AND year = ?
    ORDER BY paddy_date;
  `;

  // Query for rice entries
  const riceSql = `
    SELECT
      adDate AS rice_date,
      tonsKgs AS rice_deposited,
      adNumber AS rice_ad_no
    FROM rice_entries
    WHERE variety = 'BRC' AND company = ? AND year = ?
    ORDER BY rice_date;
  `;

  db.serialize(() => {
    db.all(paddySql, [company, year], (err, paddyResults) => {
      if (err) {
        console.error('Error fetching paddy entries:', err);
        return res.status(500).send('Server error');
      }

      db.all(riceSql, [company, year], (err, riceResults) => {
        if (err) {
          console.error('Error fetching rice entries:', err);
          return res.status(500).send('Server error');
        }

        let output = [];

        // Initialize variables
        let depositIndex = 0;
        let currentDepositRemaining = 0;

        // Initialize the first deposit's remaining amount
        if (riceResults.length > 0) {
          currentDepositRemaining = Number(riceResults[0].rice_deposited);
        }

        // Initialize group tracking
        let currentGroupDate = '';
        let totalPaddyBags = 0;
        let totalPaddyWeight = 0;
        let totalRiceDue = 0;
        let groupRiceDeposited = 0;

        paddyResults.forEach((paddyEntry, paddyIdx) => {
          const paddyDate = getOnlyDate(paddyEntry.paddy_date);

          // Check if we're in a new date group
          if (paddyDate !== currentGroupDate) {
            // If not the first group, add a total row for the previous group
            if (currentGroupDate !== '') {
              output.push({
                rowType: 'total',
                s_no: 'Total',
                paddy_date: currentGroupDate,
                godown: '',
                issue_memo_no: '',
                variety: '',
                paddy_bags: totalPaddyBags,
                paddy_weight: totalPaddyWeight,
                rice_due: totalRiceDue,
                rice_date: '',
                rice_deposited: groupRiceDeposited,
                rice_ad_no: ''
              });

              // Reset group-specific totals
              totalPaddyBags = 0;
              totalPaddyWeight = 0;
              totalRiceDue = 0;
              groupRiceDeposited = 0;
            }

            // Update to the new group date
            currentGroupDate = paddyDate;
          }

          let riceDue = Number(paddyEntry.rice_due);
          let fulfilledRice = [];

          console.log(`\nProcessing Paddy Entry ${paddyIdx + 1}`);
          console.log(`Rice Due: ${riceDue}`);
          console.log(`Starting Deposit Index: ${depositIndex}`);
          console.log(`Current Deposit Remaining Before Allocation: ${currentDepositRemaining}`);

          // Allocate rice deposits to fulfill rice_due
          while (riceDue > 0 && depositIndex < riceResults.length) {
            let currentDeposit = riceResults[depositIndex];

            console.log(`  Current Deposit Index: ${depositIndex}`);
            console.log(`  Current Deposit Amount: ${currentDeposit.rice_deposited}`);
            console.log(`  Current Deposit Remaining: ${currentDepositRemaining}`);
            console.log(`  Rice Due: ${riceDue}`);

            if (currentDepositRemaining >= riceDue) {
              // Fulfill the rice due with part of the current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: riceDue,
                rice_ad_no: currentDeposit.rice_ad_no
              });

              // Update groupRiceDeposited
              groupRiceDeposited += riceDue;

              // Update current deposit remaining
              currentDepositRemaining -= riceDue;
              console.log(`  Allocated ${riceDue}. Current Deposit Remaining: ${currentDepositRemaining}`);

              riceDue = 0; // Rice due is fulfilled

              // If current deposit is exhausted, move to next deposit
              if (currentDepositRemaining === 0) {
                depositIndex++;
                if (depositIndex < riceResults.length) {
                  currentDeposit = riceResults[depositIndex];
                  currentDepositRemaining = Number(currentDeposit.rice_deposited);
                  console.log(`  Moving to next deposit. New Deposit Index: ${depositIndex}`);
                }
              }
            } else {
              // Use the entire current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: currentDepositRemaining,
                rice_ad_no: currentDeposit.rice_ad_no
              });

              // Update groupRiceDeposited
              groupRiceDeposited += currentDepositRemaining;

              // Update riceDue
              riceDue -= currentDepositRemaining;
              console.log(`  Allocated ${currentDepositRemaining}. Rice Due After Allocation: ${riceDue}`);

              // Move to the next rice deposit
              depositIndex++;
              if (depositIndex < riceResults.length) {
                currentDeposit = riceResults[depositIndex];
                currentDepositRemaining = Number(currentDeposit.rice_deposited);
                console.log(`  Moving to next deposit. New Deposit Index: ${depositIndex}`);
              } else {
                currentDepositRemaining = 0;
              }
            }
          }

          if (riceDue > 0) {
            console.warn(`Not enough rice deposits to fulfill paddy entry ${paddyIdx + 1}. Remaining rice_due: ${riceDue} kgs`);
          }

          // Accumulate group-specific totals
          totalPaddyBags += paddyEntry.paddy_bags;
          totalPaddyWeight += paddyEntry.paddy_weight;
          totalRiceDue += paddyEntry.rice_due;

          // Add paddy entry with fulfilled rice deposits
          output.push({
            s_no: paddyIdx + 1,
            paddy_date: paddyEntry.paddy_date,
            godown: paddyEntry.godown,
            issue_memo_no: paddyEntry.issue_memo_no,
            variety: paddyEntry.variety,
            paddy_bags: paddyEntry.paddy_bags,
            paddy_weight: paddyEntry.paddy_weight,
            rice_due: paddyEntry.rice_due,
            rice_date: fulfilledRice.length > 0 ? fulfilledRice[0].rice_date : null,
            rice_deposited: fulfilledRice.length > 0 ? fulfilledRice[0].rice_deposited : null,
            rice_ad_no: fulfilledRice.length > 0 ? fulfilledRice[0].rice_ad_no : null,
            rowType: '' // Empty unless it's a total row
          });

          // If multiple rice deposits are needed, add additional rows
          for (let i = 1; i < fulfilledRice.length; i++) {
            output.push({
              s_no: '',
              paddy_date: '',
              godown: '',
              issue_memo_no: '',
              variety: '',
              paddy_bags: '',
              paddy_weight: '',
              rice_due: '',
              rice_date: fulfilledRice[i].rice_date,
              rice_deposited: fulfilledRice[i].rice_deposited,
              rice_ad_no: fulfilledRice[i].rice_ad_no,
              rowType: '' // No special type for these rows
            });
          }
        });

        // After processing all paddy entries, add a total row for the last group
        if (currentGroupDate !== '') {
          output.push({
            rowType: 'total',
            s_no: 'Total',
            paddy_date: currentGroupDate,
            godown: '',
            issue_memo_no: '',
            variety: '',
            paddy_bags: totalPaddyBags,
            paddy_weight: totalPaddyWeight,
            rice_due: totalRiceDue,
            rice_date: '',
            rice_deposited: groupRiceDeposited,
            rice_ad_no: ''
          });
        }

        res.json(output);
      });
    });
  });
});





router.get('/belated-a-combined', (req, res) => {
  const { company, year, fromDate, toDate } = req.query;


  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  // Query for paddy entries
  const paddySql = `
    SELECT
      date AS paddy_date,
      godown,
      issueMemoId AS issue_memo_no,
      grade AS variety,
      (onbBags + ssBags + swpBags + nbBags) AS paddy_bags,
      tonsKgs AS paddy_weight,
      ROUND(tonsKgs * ${OUTTURN_RATIO}) AS rice_due -- Rounding to whole number
    FROM paddy_entries
    WHERE grade = 'RPA' AND company = ? AND year = ?
    ORDER BY paddy_date;
  `;

  // Query for rice entries
  const riceSql = `
    SELECT
      adDate AS rice_date,
      tonsKgs AS rice_deposited,
      adNumber AS rice_ad_no
    FROM rice_entries
    WHERE variety = 'BRA' AND company = ? AND year = ?
    ORDER BY rice_date;
  `;

  db.serialize(() => {
    db.all(paddySql, [company, year], (err, paddyResults) => {
      if (err) {
        console.error('Error fetching paddy entries:', err);
        return res.status(500).send('Server error');
      }

      db.all(riceSql, [company, year], (err, riceResults) => {
        if (err) {
          console.error('Error fetching rice entries:', err);
          return res.status(500).send('Server error');
        }

        let output = [];

        // Group paddy entries by date
        const paddyGroups = {};
        paddyResults.forEach((entry) => {
          const dateKey = getOnlyDate(entry.paddy_date);
          if (!paddyGroups[dateKey]) {
            paddyGroups[dateKey] = {
              paddy_entries: [],
              total_paddy_bags: 0,
              total_paddy_weight: 0,
              total_rice_due: 0,
            };
          }
          paddyGroups[dateKey].paddy_entries.push(entry);
          paddyGroups[dateKey].total_paddy_bags += entry.paddy_bags;
          paddyGroups[dateKey].total_paddy_weight += entry.paddy_weight;
          paddyGroups[dateKey].total_rice_due += entry.rice_due;
        });

        // Initialize variables for rice deposits
        let depositIndex = 0;
        let currentDepositRemaining = riceResults.length > 0 ? Number(riceResults[0].rice_deposited) : 0;

        // Process each date group
        let s_no = 1;
        Object.keys(paddyGroups).sort().forEach((dateKey) => {
          const group = paddyGroups[dateKey];

          // Output individual paddy entries
          group.paddy_entries.forEach((paddyEntry) => {
            output.push({
              s_no: s_no++,
              paddy_date: paddyEntry.paddy_date,
              variety: paddyEntry.variety,
              paddy_bags: paddyEntry.paddy_bags,
              paddy_weight: paddyEntry.paddy_weight,
              rice_due: paddyEntry.rice_due,
              rice_date: '', // Will be filled in during allocation
              rice_deposited: '',
              rice_ad_no: '',
              rowType: '', // Empty unless it's a total row
            });
          });

          // Allocate rice deposits to fulfill the total rice due for the date
          let riceDue = group.total_rice_due;
          let fulfilledRice = [];

          while (riceDue > 0 && depositIndex < riceResults.length) {
            let currentDeposit = riceResults[depositIndex];

            if (currentDepositRemaining >= riceDue) {
              // Fulfill the rice due with part of the current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: riceDue,
                rice_ad_no: currentDeposit.rice_ad_no,
              });

              currentDepositRemaining -= riceDue;
              riceDue = 0;

              // Move to next deposit if the current one is exhausted
              if (currentDepositRemaining === 0) {
                depositIndex++;
                if (depositIndex < riceResults.length) {
                  currentDeposit = riceResults[depositIndex];
                  currentDepositRemaining = Number(currentDeposit.rice_deposited);
                }
              }
            } else {
              // Use the entire current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: currentDepositRemaining,
                rice_ad_no: currentDeposit.rice_ad_no,
              });

              riceDue -= currentDepositRemaining;
              depositIndex++;
              if (depositIndex < riceResults.length) {
                currentDeposit = riceResults[depositIndex];
                currentDepositRemaining = Number(currentDeposit.rice_deposited);
              } else {
                currentDepositRemaining = 0;
              }
            }
          }

          if (riceDue > 0) {
            console.warn(`Not enough rice deposits to fulfill rice due for date ${dateKey}. Remaining rice_due: ${riceDue} kgs`);
          }

          // Output allocated rice deposits
          fulfilledRice.forEach((riceAllocation, index) => {
            // For the first allocation, attach it to the last paddy entry
            if (index === 0) {
              output[output.length - 1] = {
                ...output[output.length - 1],
                rice_date: riceAllocation.rice_date,
                rice_deposited: riceAllocation.rice_deposited,
                rice_ad_no: riceAllocation.rice_ad_no,
              };
            } else {
              // For subsequent allocations, add new rows
              output.push({
                s_no: '',
                paddy_date: '',
                variety: '',
                paddy_bags: '',
                paddy_weight: '',
                rice_due: '',
                rice_date: riceAllocation.rice_date,
                rice_deposited: riceAllocation.rice_deposited,
                rice_ad_no: riceAllocation.rice_ad_no,
                rowType: '', // No special type for these rows
              });
            }
          });

          // Add total row for the date group
          output.push({
            s_no: 'Total',
            paddy_date: '', // Or dateKey if you want to display the date
            variety: '',
            paddy_bags: group.total_paddy_bags,
            paddy_weight: group.total_paddy_weight,
            rice_due: group.total_rice_due,
            rice_date: '',
            rice_deposited: fulfilledRice.reduce((sum, r) => sum + r.rice_deposited, 0),
            rice_ad_no: '',
            rowType: 'total', // Indicate that this is a total row
          });
        });

        res.json(output);
      });
    });
  });
});

router.get('/belated-c-combined', (req, res) => {
  const { company, year, fromDate, toDate } = req.query;




  if (!company || !year) {
    return res.status(400).json({ error: 'Company and year are required.' });
  }

  // Query for paddy entries
  const paddySql = `
    SELECT
      date AS paddy_date,
      godown,
      issueMemoId AS issue_memo_no,
      grade AS variety,
      (onbBags + ssBags + swpBags + nbBags) AS paddy_bags,
      tonsKgs AS paddy_weight,
      ROUND(tonsKgs * ${OUTTURN_RATIO}) AS rice_due -- Rounding to whole number
    FROM paddy_entries
    WHERE grade = 'RPC' AND company = ? AND year = ?
    ORDER BY paddy_date;
  `;

  // Query for rice entries
  const riceSql = `
    SELECT
      adDate AS rice_date,
      tonsKgs AS rice_deposited,
      adNumber AS rice_ad_no
    FROM rice_entries
    WHERE variety = 'BRC' AND company = ? AND year = ?
    ORDER BY rice_date;
  `;

  db.serialize(() => {
    db.all(paddySql, [company, year], (err, paddyResults) => {
      if (err) {
        console.error('Error fetching paddy entries:', err);
        return res.status(500).send('Server error');
      }

      db.all(riceSql, [company, year], (err, riceResults) => {
        if (err) {
          console.error('Error fetching rice entries:', err);
          return res.status(500).send('Server error');
        }

        let output = [];

        // Group paddy entries by date
        const paddyGroups = {};
        paddyResults.forEach((entry) => {
          const dateKey = getOnlyDate(entry.paddy_date);
          if (!paddyGroups[dateKey]) {
            paddyGroups[dateKey] = {
              paddy_entries: [],
              total_paddy_bags: 0,
              total_paddy_weight: 0,
              total_rice_due: 0,
            };
          }
          paddyGroups[dateKey].paddy_entries.push(entry);
          paddyGroups[dateKey].total_paddy_bags += entry.paddy_bags;
          paddyGroups[dateKey].total_paddy_weight += entry.paddy_weight;
          paddyGroups[dateKey].total_rice_due += entry.rice_due;
        });

        // Initialize variables for rice deposits
        let depositIndex = 0;
        let currentDepositRemaining = riceResults.length > 0 ? Number(riceResults[0].rice_deposited) : 0;

        // Process each date group
        let s_no = 1;
        Object.keys(paddyGroups).sort().forEach((dateKey) => {
          const group = paddyGroups[dateKey];

          // Output individual paddy entries
          group.paddy_entries.forEach((paddyEntry) => {
            output.push({
              s_no: s_no++,
              paddy_date: paddyEntry.paddy_date,
              variety: paddyEntry.variety,
              paddy_bags: paddyEntry.paddy_bags,
              paddy_weight: paddyEntry.paddy_weight,
              rice_due: paddyEntry.rice_due,
              rice_date: '', // Will be filled in during allocation
              rice_deposited: '',
              rice_ad_no: '',
              rowType: '', // Empty unless it's a total row
            });
          });

          // Allocate rice deposits to fulfill the total rice due for the date
          let riceDue = group.total_rice_due;
          let fulfilledRice = [];

          while (riceDue > 0 && depositIndex < riceResults.length) {
            let currentDeposit = riceResults[depositIndex];

            if (currentDepositRemaining >= riceDue) {
              // Fulfill the rice due with part of the current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: riceDue,
                rice_ad_no: currentDeposit.rice_ad_no,
              });

              currentDepositRemaining -= riceDue;
              riceDue = 0;

              // Move to next deposit if the current one is exhausted
              if (currentDepositRemaining === 0) {
                depositIndex++;
                if (depositIndex < riceResults.length) {
                  currentDeposit = riceResults[depositIndex];
                  currentDepositRemaining = Number(currentDeposit.rice_deposited);
                }
              }
            } else {
              // Use the entire current deposit
              fulfilledRice.push({
                rice_date: currentDeposit.rice_date,
                rice_deposited: currentDepositRemaining,
                rice_ad_no: currentDeposit.rice_ad_no,
              });

              riceDue -= currentDepositRemaining;
              depositIndex++;
              if (depositIndex < riceResults.length) {
                currentDeposit = riceResults[depositIndex];
                currentDepositRemaining = Number(currentDeposit.rice_deposited);
              } else {
                currentDepositRemaining = 0;
              }
            }
          }

          if (riceDue > 0) {
            console.warn(`Not enough rice deposits to fulfill rice due for date ${dateKey}. Remaining rice_due: ${riceDue} kgs`);
          }

          // Output allocated rice deposits
          fulfilledRice.forEach((riceAllocation, index) => {
            // For the first allocation, attach it to the last paddy entry
            if (index === 0) {
              output[output.length - 1] = {
                ...output[output.length - 1],
                rice_date: riceAllocation.rice_date,
                rice_deposited: riceAllocation.rice_deposited,
                rice_ad_no: riceAllocation.rice_ad_no,
              };
            } else {
              // For subsequent allocations, add new rows
              output.push({
                s_no: '',
                paddy_date: '',
                variety: '',
                paddy_bags: '',
                paddy_weight: '',
                rice_due: '',
                rice_date: riceAllocation.rice_date,
                rice_deposited: riceAllocation.rice_deposited,
                rice_ad_no: riceAllocation.rice_ad_no,
                rowType: '', // No special type for these rows
              });
            }
          });

          // Add total row for the date group
          output.push({
            s_no: 'Total',
            paddy_date: '', // Or dateKey if you want to display the date
            variety: '',
            paddy_bags: group.total_paddy_bags,
            paddy_weight: group.total_paddy_weight,
            rice_due: group.total_rice_due,
            rice_date: '',
            rice_deposited: fulfilledRice.reduce((sum, r) => sum + r.rice_deposited, 0),
            rice_ad_no: '',
            rowType: 'total', // Indicate that this is a total row
          });
        });

        res.json(output);
      });
    });
  });
});


module.exports = router;


