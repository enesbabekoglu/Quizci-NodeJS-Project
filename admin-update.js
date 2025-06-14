// Bir kullanıcıyı admin yapmak için betik
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

// E-posta adresini buraya girin
const userEmail = 'enesbabekoglu@hotmail.com'; // Mevcut kullanıcı listesinden seçildi

async function makeUserAdmin() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizci');
    console.log('MongoDB bağlantısı başarılı');
    
    // Kullanıcıyı bul ve rolünü güncelle
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      console.log(`${userEmail} e-posta adresine sahip bir kullanıcı bulunamadı`);
    } else {
      console.log(`${user.username} kullanıcısının rolü "admin" olarak güncellendi`);
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

makeUserAdmin();
