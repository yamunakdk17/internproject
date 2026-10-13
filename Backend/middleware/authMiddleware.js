const jwt = require("jsonwebtoken");
const response = require("../utils/response");

const protect = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

  if (!token) {
    return response.error(res, "Unauthorized", 401);
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");
    return response.error(res, "Authentication is not configured", 500);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    return next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    const message =
      error.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in again.";

    return response.error(res, message, 401);
  }
};

module.exports = protect;
