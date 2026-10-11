const response = require("../utils/response");

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return response.error(res, "Forbidden: admin access required", 403);
  }

  next();
}

module.exports = requireAdmin;
