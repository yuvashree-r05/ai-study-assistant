// This is the simplest real form of API security: every request
// must include a header with a secret key that matches ours, or it
// gets rejected before touching any of our actual routes/LLM calls.
//
// This isn't "enterprise-grade" auth (no per-user accounts, no
// token expiry) — but it's a genuine, meaningful upgrade from "wide
// open to anyone who finds the URL", which is what you have without
// this. That gap matters a lot once something is deployed publicly.

function apiKeyAuth(req, res, next) {
  const providedKey = req.headers['x-api-key'];

  if (!providedKey || providedKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Missing or invalid API key.' });
  }

  next(); // key is valid — let the request continue to the actual route
}

module.exports = apiKeyAuth;