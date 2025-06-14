const express = require('express');
const questionBankController = require('../controllers/questionBankController');
const auth = require('../middleware/auth');

const router = express.Router();

// Kimlik doğrulama gerekli
router.use(auth.authenticate);

// Şablon quizleri listele
router.get('/', questionBankController.getTemplates);

// Şablon quizi kopyala (sadece üyeler)
router.post('/duplicate/:id', auth.isMember, questionBankController.duplicateTemplate);

module.exports = router;
