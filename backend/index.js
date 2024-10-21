const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const riceRoutes = require('./routes/rice');
const paddyRoutes = require('./routes/paddy');
const outturnRoutes = require('./routes/outturn');
const riceGodownRoutes = require('./routes/rice_godowns');
const paddyGodownRoutes = require('./routes/paddy_godowns');
const frkRoutes = require('./routes/frk'); // Add the FRK route

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/rice', riceRoutes);
app.use('/api/paddy', paddyRoutes);
app.use('/api/outturn', outturnRoutes);
app.use('/api/rice-godowns', riceGodownRoutes);
app.use('/api/paddy-godowns', paddyGodownRoutes);
app.use('/api/frk', frkRoutes); // Use the FRK route

const DEFAULT_PORT = 5000;

// Function to find an available port
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying another port...`);
      startServer(port + 1); // Try the next port
    } else {
      console.error(err);
    }
  });
}

// Start the server on the default port, or another available port
startServer(DEFAULT_PORT);
