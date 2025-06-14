const express = require('express');
const sessionController = require('../controllers/sessionController');
const auth = require('../middleware/auth');

const router = express.Router();

// Oturum başlatma (kimlik doğrulama gerekli)
router.post('/start/:quizId', auth.authenticate, auth.isMember, sessionController.startSession);

// Oturuma katılma (kimlik doğrulama gerekli değil)
router.post('/:pin/join', sessionController.joinSession);

// Oturum bilgisini getir (kimlik doğrulama gerekli değil)
router.get('/:pin', sessionController.getSession);

// Oturumu sonlandır (kimlik doğrulama gerekli)
router.post('/:sessionId/end', auth.authenticate, auth.isMember, sessionController.endSession);

module.exports = router;
