// Tüm kullanıcıları listeleyen betik
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function listUsers() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizci');
    console.log('MongoDB bağlantısı başarılı');
    
    // Tüm kullanıcıları listele
    const users = await User.find().select('username email role');
    
    console.log('SİSTEMDEKİ KULLANICILAR:');
    console.log('-----------------------');
    
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Kullanıcı adı: ${user.username || 'Tanımsız'}`);
      console.log(`E-posta: ${user.email}`);
      console.log(`Rol: ${user.role}`);
      console.log('-----------------------');
    });
    
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

listUsers();
