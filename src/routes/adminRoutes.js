const express = require('express');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const multer = require('multer');

// Bellek içi depolama için multer yapılandırması
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Tüm rotalarda admin yetkisi gerekli
router.use(auth.authenticate, auth.isAdmin);

// İstatistik ve listeleme rotaları
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getUsers);
router.get('/quizzes', adminController.getAllQuizzes);
router.get('/sessions', adminController.getSessions);

// Kullanıcı rolü güncelleme
router.patch('/users/:id/role', adminController.updateUserRole);

// Kullanıcı silme
router.delete('/users/:id', adminController.deleteUser);

// Avatar yönetimi
router.post('/avatars', upload.single('avatar'), adminController.uploadAvatar);
router.get('/avatars/categories', adminController.getAvatarCategories);
router.get('/avatars/category/:category', adminController.getAvatarsByCategory);
router.delete('/avatars', adminController.deleteAvatar);

module.exports = router;
