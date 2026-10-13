const { rateLimit } = require("express-rate-limit");

function createRateLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

module.exports = createRateLimiter;