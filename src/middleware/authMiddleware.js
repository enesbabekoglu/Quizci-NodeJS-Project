const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kullanıcı kimlik doğrulama middleware'i
module.exports = async (req, res, next) => {
  try {
    // Authorization header'dan token alınması
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Kimlik doğrulama hatası: Token eksik veya geçersiz format' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli_anahtar');
    
    // Token içindeki kullanıcı bilgilerini al
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Request nesnesine kullanıcı bilgilerini ekle
    req.user = user;
    next();
  } catch (error) {
    console.error('Kimlik doğrulama hatası:', error);
    return res.status(401).json({ message: 'Kimlik doğrulama hatası: ' + error.message });
  }
};
