// MongoDB'deki boş quizCode'ları düzeltme scripti
const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const Quiz = require('../models/Quiz');

// MongoDB'ye bağlan
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB veritabanına bağlandı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

// Benzersiz kod oluşturan fonksiyon
const generateUniqueCode = () => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return random + timestamp;
};

// Boş quiz kodlarını güncelle
const fixQuizCodes = async () => {
  try {
    await connectDB();
    
    // Boş veya null quizCode değeri olan tüm quizleri bul
    const quizzes = await Quiz.find({
      $or: [
        { quizCode: null },
        { quizCode: { $exists: false } },
        { quizCode: "" }
      ]
    });
    
    console.log(`${quizzes.length} adet boş quiz kodu bulundu`);
    
    // Her quiz için yeni kod oluştur ve güncelle
    for (const quiz of quizzes) {
      const newCode = generateUniqueCode();
      console.log(`Quiz ID: ${quiz._id}, Eski kod: ${quiz.quizCode}, Yeni kod: ${newCode}`);
      
      quiz.quizCode = newCode;
      await quiz.save();
    }
    
    console.log('Tüm quiz kodları başarıyla güncellendi');
    process.exit(0);
  } catch (error) {
    console.error('Script hatası:', error);
    process.exit(1);
  }
};

// Scripti çalıştır
fixQuizCodes();
