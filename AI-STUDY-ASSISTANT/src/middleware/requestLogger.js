// Logs every request that comes in: method, path, status code, and
// how long it took. This is deliberately simple (no external logging
// library) — just enough to see what's actually happening on your
// server without guessing, which matters a lot once this is deployed
// and you can't just watch Bruno responses directly.

function requestLogger(req, res, next) {
  const startTime = Date.now();

  // res.on('finish') fires once the response has actually been sent —
  // so this logs AFTER the request completes, capturing the real
  // status code and duration, not just "a request arrived".
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = requestLogger;