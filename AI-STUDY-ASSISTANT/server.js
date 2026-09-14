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

// FRONTEND_URL lets us restrict CORS to only your actual deployed
// frontend, instead of allowing any website to call this API. If
// it's not set (local development), we fall back to allowing
// everything, which is fine for localhost testing.
const corsOptions = process.env.FRONTEND_URL
  ? { origin: process.env.FRONTEND_URL }
  : {};

app.use(cors(corsOptions));
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