const crypto = require("crypto");

function publicToken(prefix = "roa") {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

module.exports = { publicToken };
