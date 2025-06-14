// MongoDB'deki boş quizCode'ları düzeltme scripti
const mongoose = require('mongoose');
require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB bağlantı bilgileri - .env dosyası bulunamazsa buradaki bilgileri kullan
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizci';

// Benzersiz kod oluşturan fonksiyon
const generateUniqueCode = () => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return random + timestamp;
};

// Direkt MongoDB client kullanarak düzeltme
const fixQuizCodes = async () => {
  let client;
  
  try {
    console.log('MongoDB\'ye bağlanılıyor...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('Bağlantı başarılı!');
    const db = client.db();
    const quizCollection = db.collection('quizzes');
    
    // MongoDB Native Driver kullanarak güncelleme yapalım
    console.log('Boş quiz kodları aranıyor...');
    const cursor = quizCollection.find({
      $or: [
        { quizCode: null },
        { quizCode: { $exists: false } },
        { quizCode: "" }
      ]
    });
    
    const quizzes = await cursor.toArray();
    console.log(`${quizzes.length} adet boş quiz kodu bulundu`);
    
    // Her quiz için tekil kod oluştur ve güncelle
    let counter = 0;
    for (const quiz of quizzes) {
      const newCode = generateUniqueCode();
      console.log(`Quiz ID: ${quiz._id}, Eski kod: ${quiz.quizCode}, Yeni kod: ${newCode}`);
      
      const result = await quizCollection.updateOne(
        { _id: quiz._id },
        { $set: { quizCode: newCode } }
      );
      
      if (result.modifiedCount > 0) counter++;
    }
    
    console.log(`${counter} adet quiz kodu başarıyla güncellendi`);
    
    // Quiz koleksiyonunun indeksini düzenleyelim
    console.log('Quiz indeksi düzenleniyor...');
    await quizCollection.dropIndex('quizCode_1');
    await quizCollection.createIndex({ quizCode: 1 }, { unique: true, sparse: true });
    
    console.log('İndeks başarıyla yeniden oluşturuldu');
  } catch (error) {
    console.error('Script hatası:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB bağlantısı kapatıldı');
    }
  }
};

// Scripti çalıştır
fixQuizCodes();
