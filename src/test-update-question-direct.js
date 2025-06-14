require('dotenv').config();
const axios = require('axios');

// JWT token oluşturma veya mevcut bir token kullanma
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODRjNDI1YTVlMzg1NTBkNmNlMjY1ZjUiLCJyb2xlIjoidXNlciIsImlhdCI6MTcxODM2MjAxMCwiZXhwIjoxNzE4NDQ4NDEwfQ.4oOIKJmZQvVnajOnnJQ6nF_EGvbSA3Io2xvl2HVV1DM';

// Soru ID'si ve Quiz ID'si
const questionId = '684c45235e38550d6ce266ab';
const quizId = '684c42655e38550d6ce265f8';

// Test fonksiyonu
async function testUpdateQuestion() {
  try {
    console.log('API test başlıyor...');
    
    // API url'si
    const apiUrl = `http://localhost:5001/api/questions/${questionId}`;
    
    // Güncellenecek veri
    const updateData = {
      questionText: 'Test soru metni',
      options: ['Seçenek 1', 'Seçenek 2', 'Seçenek 3', 'Seçenek 4'],
      correctIndex: 2,
      duration: 45,
      points: 75,
      image: 'https://picsum.photos/seed/quiz2/800/400'
    };
    
    console.log('Gönderilecek veriler:', updateData);
    console.log('API URL:', apiUrl);
    
    // API isteği
    const response = await axios.put(apiUrl, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API yanıtı:', response.data);
    
    // Sonuçları doğrulama
    if (response.data.question) {
      const updatedQuestion = response.data.question;
      console.log('Güncellenen soru detayları:');
      console.log('- Süre:', updatedQuestion.duration, 'saniye');
      console.log('- Puan:', updatedQuestion.points, 'puan');
      console.log('- Görsel URL:', updatedQuestion.image);
    }
    
  } catch (error) {
    console.error('Test hatası:');
    if (error.response) {
      // Sunucudan gelen yanıt hatası
      console.error('Sunucu yanıtı:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error('Yanıt alınamadı:', error.request);
    } else {
      // İstek yapılamadı
      console.error('Hata mesajı:', error.message);
    }
    console.error('Hata konfigürasyonu:', error.config);
  }
}

// Testi çalıştır
testUpdateQuestion();
