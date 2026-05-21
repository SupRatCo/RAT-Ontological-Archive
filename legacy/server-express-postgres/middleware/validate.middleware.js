const { badRequest } = require("../utils/errors");

function requireFields(fields = []) {
  return (req, _res, next) => {
    const missing = fields.filter((field) => {
      const value = req.body ? req.body[field] : undefined;
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missing.length) return next(badRequest(`Faltan campos obligatorios: ${missing.join(", ")}`));
    next();
  };
}

module.exports = { requireFields };
