const crypto = require("crypto");

function generateSalt(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

if (require.main === module) {
  console.log(generateSalt());
}

module.exports = { generateSalt };
