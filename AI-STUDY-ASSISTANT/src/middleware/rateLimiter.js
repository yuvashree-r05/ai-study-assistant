// Rate limiting protects two things at once: your Groq/Gemini API
// costs (each request costs real money/quota) and general abuse
// (someone hammering your server with requests). Without this,
// nothing stops a single client from sending hundreds of requests
// per second.

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 60* 1000, // 1 minute window
  max: 20, // max 20 requests per window, per IP address
  standardHeaders: true, // sends RateLimit-* headers so clients know their limit/remaining
  legacyHeaders: false,
  message: {
    error: 'Too many requests — please wait a moment before trying again.',
  },
});

module.exports = apiLimiter;