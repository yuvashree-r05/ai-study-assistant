// This is the entry point — the file you actually run.
// Its only jobs: load env vars, set up Express, mount our routes
// under /api, and start listening.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const askRoutes = require('./src/routes/ask.routes');
const requestLogger = require('./src/middleware/requestLogger');
const apiKeyAuth = require('./src/middleware/apiKeyAuth');
const apiLimiter = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use(requestLogger); // logs every request, first, so we see everything

app.use('/api', apiKeyAuth); // blocks anything without a valid key BEFORE it reaches a route
app.use('/api', apiLimiter); // then checks rate limits
app.use('/api', askRoutes); // only requests that passed both checks get here

// This must be registered LAST — Express only treats a 4-argument
// function as an error handler, and only calls it for errors that
// happen anywhere earlier in the chain above.
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI Study Assistant API running on http://localhost:${PORT}`);
});