const express = require('express');
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

const router = express.Router();

// Tüm rotalarda kimlik doğrulama gerekli
router.use(auth.authenticate);

// Quiz oluşturma ve listeleme
router.post('/', auth.isMember, quizController.createQuiz);
router.get('/', quizController.getAllQuizzes);
router.get('/my', quizController.getMyQuizzes);

// Belirli bir quiz üzerinde işlemler
router.get('/:id', quizController.getQuiz);
router.put('/:id', auth.isMember, quizController.updateQuiz);
router.delete('/:id', auth.isMember, quizController.deleteQuiz);

module.exports = router;
