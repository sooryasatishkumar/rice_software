const path = require('path');
const os = require('os');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();  // Use .verbose() to enable detailed error messages

// Determine the writable directory for the database
const userDataPath = path.join(os.homedir(), 'my-app-data');
const dbPath = path.join(userDataPath, 'ricepaddy.db');

// Path to the bundled (read-only) database in the package
const bundledDbPath = path.join(process.cwd(), 'ricepaddy.db');

// Ensure the user data directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Check if the database already exists in the writable location
if (!fs.existsSync(dbPath)) {
  // Copy the bundled database to the writable location
  fs.copyFileSync(bundledDbPath, dbPath);
  console.log(`Database copied to ${dbPath}`);
} else {
  console.log(`Database already exists at ${dbPath}`);
}

// Create and connect to the SQLite database file in the writable location
const db = new sqlite3.Database(dbPath);  // Instantiate the Database class

console.log(`Connected to the SQLite database at "${dbPath}"`);

const createTables = () => {
  const createRiceEntriesTable = `
    CREATE TABLE IF NOT EXISTS rice_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      godown TEXT,
      challanNo TEXT,
      lorryNo TEXT,
      variety TEXT,
      onbBags INTEGER,
      ssBags INTEGER,
      swpBags INTEGER,
      frk REAL,
      tonsKgs REAL,
      moisture REAL,
      adNumber TEXT,
      adDate TEXT,
      company TEXT,
      year INTEGER
    )
  `;

  const createPaddyEntriesTable = `
    CREATE TABLE IF NOT EXISTS paddy_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      godown TEXT,
      issueMemoId TEXT,
      lorryNo TEXT,
      grade TEXT,
      moisture REAL,
      onbBags INTEGER,
      ssBags INTEGER,
      swpBags INTEGER,
      nbBags INTEGER,
      tonsKgs REAL,
      company TEXT,
      year INTEGER
    )
  `;

  const createRiceGodownsTable = `
    CREATE TABLE IF NOT EXISTS rice_godowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `;

  const createPaddyGodownsTable = `
    CREATE TABLE IF NOT EXISTS paddy_godowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `;

  const createFrkDetailsTable = `
    CREATE TABLE IF NOT EXISTS frk_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT,
      year INTEGER,
      date TEXT,
      KGs REAL DEFAULT NULL,
      debited_KGs REAL DEFAULT NULL,
      remaining_KGs REAL DEFAULT 0,
      progressive_FRK REAL DEFAULT 0
    )
  `;

  db.serialize(() => {
    db.run(createRiceEntriesTable);
    db.run(createPaddyEntriesTable);
    db.run(createRiceGodownsTable);
    db.run(createPaddyGodownsTable);
    db.run(createFrkDetailsTable);
    console.log('Tables checked/created');
  });
};

createTables();

module.exports = db;
