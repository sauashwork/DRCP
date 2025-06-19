const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    logAction('Rate limit exceeded', { ip: req.ip });
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});