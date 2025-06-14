// Test script: Soruyu güncellemek için
const mongoose = require('mongoose');
require('dotenv').config();

// Veritabanı bağlantısı
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizci');
    console.log('MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
  }
}

// Quiz ve sorularını getir
async function getQuiz(quizId) {
  try {
    const Question = require('./models/Question');
    const Quiz = require('./models/Quiz');
    
    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      console.error('Quiz bulunamadı');
      return null;
    }
    
    console.log('Quiz bulundu:', quiz.title);
    console.log('Soru sayısı:', quiz.questions.length);
    
    // Eğer quiz.questions bir array değilse (çünkü populate edilmemiş olabilir)
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      const questions = await Question.find({ quizId: quizId });
      console.log('Sorular ayrı sorguyla bulundu:', questions.length);
      return { quiz, questions };
    }
    
    return { quiz, questions: quiz.questions };
  } catch (error) {
    console.error('Quiz getirme hatası:', error);
    return null;
  }
}

// Soruyu güncelle
async function updateQuestion(questionId) {
  try {
    const Question = require('./models/Question');
    
    // Soruyu bul
    const question = await Question.findById(questionId);
    if (!question) {
      console.error('Soru bulunamadı');
      return false;
    }
    
    console.log('Soru bulundu:', question.questionText);
    console.log('Mevcut değerler:', {
      duration: question.duration,
      points: question.points,
      image: question.image
    });
    
    // Soruyu güncelle
    question.duration = 20; // Süreyi 20 saniye yap
    question.points = 50;   // Puanı 50 yap
    question.image = 'https://picsum.photos/seed/quiz1/800/400'; // Görsel URL'si
    
    // Kaydet
    await question.save();
    
    console.log('Soru güncellendi. Yeni değerler:', {
      duration: question.duration,
      points: question.points,
      image: question.image
    });
    
    return true;
  } catch (error) {
    console.error('Soru güncelleme hatası:', error);
    return false;
  }
}

// Ana fonksiyon
async function main() {
  try {
    await connectDB();
    
    const quizId = '684c42655e38550d6ce265f8';
    const result = await getQuiz(quizId);
    
    if (result && result.questions && result.questions.length > 0) {
      // İlk soruyu güncelle
      const questionId = result.questions[0]._id;
      console.log('Güncellenecek soru ID:', questionId);
      
      const updated = await updateQuestion(questionId);
      if (updated) {
        console.log('Soru başarıyla güncellendi');
      }
    } else {
      console.log('Güncellenecek soru bulunamadı');
    }
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    // Bağlantıyı kapat
    mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Çalıştır
main();
