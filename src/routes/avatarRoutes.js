const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin yetki kontrolü
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Bu işlem için admin yetkisi gerekiyor.' });
};

// Tüm avatar kategorilerini getir
router.get('/categories', authMiddleware, avatarController.getAvatarCategories);

// Yeni kategori ekle (sadece admin)
router.post('/categories', authMiddleware, isAdmin, avatarController.createCategory);

// Belirli bir kategorideki tüm avatarları getir (auth gerekli endpoint)
router.get('/category/:category', authMiddleware, avatarController.getAvatarsByCategory);

// PUBLIC - Belirli bir kategorideki avatarları getir (auth gerektirmez)
router.get('/public/category/:category', avatarController.getAvatarsByCategory);

// Quiz ID'ye göre avatarları getir
router.get('/quiz/:quizId', authMiddleware, avatarController.getAvatarsByQuizId);

// Avatar yükleme (sadece admin)
router.post('/upload', authMiddleware, isAdmin, avatarController.uploadAvatar);

// Çoklu avatar yükleme (sadece admin)
router.post('/upload-multiple', authMiddleware, isAdmin, avatarController.uploadMultipleAvatars);

// Avatar silme (sadece admin)
router.delete('/:id', authMiddleware, isAdmin, avatarController.deleteAvatar);

module.exports = router;
