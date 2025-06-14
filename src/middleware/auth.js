const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kimlik doğrulama middleware'i
exports.authenticate = async (req, res, next) => {
  try {
    // Token kontrolü
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme hatası: Token bulunamadı' });
    }
    
    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcı kontrolü
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Yetkilendirme hatası: Kullanıcı bulunamadı' });
    }
    
    // İsteğe kullanıcı bilgisini ekle
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Yetkilendirme hatası:', error.message);
    res.status(401).json({ message: 'Yetkilendirme hatası: Geçersiz token' });
  }
};

// Admin kontrolü middleware'i
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir' });
  }
};

// Üye kontrolü middleware'i (hem admin hem member yetkilendirmesi)
exports.isMember = (req, res, next) => {
  if (req.user && (req.user.role === 'member' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Bu işlem için üyelik gereklidir' });
  }
};
