const express = require('express');
const audioController = require('../controllers/audioController');
const auth = require('../middleware/auth');
const multer = require('multer');

// Bellek içi depolama için multer yapılandırması
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Herkese açık rotalar (kimlik doğrulama yok)
router.get('/music', audioController.getMusic);
router.get('/sounds', audioController.getSounds);

// Admin-only rotalar
router.post('/music', auth.authenticate, auth.isAdmin, upload.single('music'), audioController.uploadMusic);
router.post('/sounds', auth.authenticate, auth.isAdmin, upload.single('sound'), audioController.uploadSound);
router.delete('/music', auth.authenticate, auth.isAdmin, audioController.deleteMusic);
router.delete('/sounds', auth.authenticate, auth.isAdmin, audioController.deleteSound);

module.exports = router;
