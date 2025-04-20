const jwt = require('jsonwebtoken');
const User = require('../models/User');


const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        return next(new Error('Yetkisiz erişim, bu tokena ait kullanıcı bulunamadı.'));
      }

      next();

    } catch (error) {
      console.error('Token doğrulama hatası:', error.message);
      res.status(401);
      if (error.name === 'JsonWebTokenError') {
        return next(new Error('Yetkisiz erişim, geçersiz token.'));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Oturum süresi doldu, lütfen tekrar giriş yapın.'));
      }
      return next(new Error('Yetkisiz erişim, token doğrulanamadı.'));
    }
  }

  if (!token) {
    res.status(401); 
    return next(new Error('Yetkisiz erişim, token bulunamadı.'));
  }
};

module.exports = { protect };