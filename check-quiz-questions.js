require('dotenv').config();
const mongoose = require('mongoose');
const Quiz = require('./src/models/Quiz');
const Question = require('./src/models/Question');

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Belirli bir Quiz ID'ye göre quiz ve sorularını getir
async function checkQuiz(quizId) {
  try {
    console.log(`${quizId} ID'li quiz kontrol ediliyor...`);
    
    // Quiz'i bul
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.log('Quiz bulunamadı');
      return;
    }
    
    console.log('Quiz bulundu:');
    console.log('Title:', quiz.title);
    console.log('Questions array:', quiz.questions);
    console.log('Questions length:', quiz.questions.length);
    
    // Soruları bul
    const questions = await Question.find({ quizId: quizId });
    console.log(`\nVeritabanında ${questions.length} soru bulundu:`);
    
    if (questions.length > 0) {
      questions.forEach((q, i) => {
        console.log(`\nSoru ${i+1}:`);
        console.log('ID:', q._id);
        console.log('Text:', q.questionText);
        console.log('Options:', q.options);
        console.log('Correct Index:', q.correctIndex);
        console.log('QuizId:', q.quizId);
      });
    }
    
    // Quiz'de olmayan ancak veritabanında olan soruların kontrolü
    const questionIdsInQuiz = quiz.questions.map(id => id.toString());
    const orphanedQuestions = questions.filter(q => !questionIdsInQuiz.includes(q._id.toString()));
    
    if (orphanedQuestions.length > 0) {
      console.log('\nPROBLEM: Quiz referansında olmayan ama veritabanında olan sorular:');
      orphanedQuestions.forEach(q => {
        console.log(`ID: ${q._id}, Text: ${q.questionText}`);
      });
    }
    
    // Veritabanında olmayan ancak Quiz'de referansı olan soruların kontrolü
    const questionIdsInDb = questions.map(q => q._id.toString());
    const missingQuestions = quiz.questions.filter(id => !questionIdsInDb.includes(id.toString()));
    
    if (missingQuestions.length > 0) {
      console.log('\nPROBLEM: Quiz referansında olan ama veritabanında olmayan sorular:');
      missingQuestions.forEach(id => {
        console.log(`ID: ${id}`);
      });
    }
    
    // Quiz'in questions dizisinde olmayan ama veritabanında olan soruları düzeltme önerisi
    if (orphanedQuestions.length > 0) {
      console.log('\nDÜZELTME İÇİN ÖNERİLEN KOD:');
      console.log('```javascript');
      console.log(`// Quiz'e eksik soruları eklemek için:
const quiz = await Quiz.findById("${quizId}");
const missingQuestionIds = [${orphanedQuestions.map(q => `"${q._id}"`).join(', ')}];
quiz.questions.push(...missingQuestionIds);
await quiz.save();
console.log("Quiz'e eksik sorular eklendi!");`);
      console.log('```');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nVeritabanı bağlantısı kapatıldı.');
  }
}

// Komut satırından Quiz ID'yi al
const quizId = process.argv[2];

if (!quizId) {
  console.log('Lütfen bir Quiz ID\'si girin. Örneğin: node check-quiz-questions.js 684c2674b10ab5586cf0f60d');
} else {
  checkQuiz(quizId);
}
