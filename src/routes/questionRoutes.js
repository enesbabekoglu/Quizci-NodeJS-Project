const express = require('express');
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

const router = express.Router();

// Tüm rotalarda kimlik doğrulama gerekli
router.use(auth.authenticate);
router.use(auth.isMember);  // Sadece üyeler soru işlemleri yapabilir

// Belirli bir quize soru ekleme
router.post('/:quizId', questionController.createQuestion);

// Belirli bir soruyu güncelleme ve silme
router.put('/:questionId', questionController.updateQuestion);
router.delete('/:questionId', questionController.deleteQuestion);

module.exports = router;
