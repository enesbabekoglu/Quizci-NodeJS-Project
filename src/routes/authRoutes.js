const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Kullanıcı kaydı rotası
router.post('/register', authController.register);

// Kullanıcı girişi rotası
router.post('/login', authController.login);

// Kullanıcı bilgilerini getir (kimlik doğrulama gerekli)
router.get('/me', auth.authenticate, authController.getMe);

module.exports = router;
