const jwt = require('jsonwebtoken');

const generateMainToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h', 
  });
};

const generate2FATempToken = (id) => {
    return jwt.sign({ id, type: '2fa_pending' }, process.env.JWT_SECRET, {
      expiresIn: '10m', 
    });
  };

module.exports = { generateMainToken, generate2FATempToken };