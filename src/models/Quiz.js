const mongoose = require('mongoose');

// 6 haneli rastgele kod oluşturan yardımcı fonksiyon
function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Benzersiz kod oluşturma ve kontrol etme fonksiyonu
async function createUniqueQuizCode(model) {
  // Maksimum deneme sayısı
  const maxTries = 10;
  let tries = 0;
  
  while (tries < maxTries) {
    // Yeni kod oluştur
    const newCode = generateRandomCode();
    
    // Bu kodun benzersiz olup olmadığını kontrol et
    const existingQuiz = await model.findOne({ quizCode: newCode });
    
    // Eğer bu kod kullanılmıyorsa döndür
    if (!existingQuiz) {
      return newCode;
    }
    
    tries++;
  }
  
  throw new Error('Benzersiz quiz kodu oluşturulamadı, lütfen tekrar deneyin.');
}

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    default: 30
  },
  // Yeni eklenen varsayılan soru süresi
  defaultQuestionDuration: {
    type: Number,
    default: 30
  },
  // Yeni eklenen varsayılan soru puanları
  defaultQuestionPoints: {
    type: Number,
    default: 100
  },
  avatarCategory: {
    type: String,
    default: 'hayvanlar'
  },
  music: {
    type: String,
    default: null
  },
  // Yeni eklenen kapak fotoğrafı
  coverImage: {
    type: String,
    default: ''
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  quizCode: {
    type: String,
    unique: true,
    required: false, // Zorunluluğu kaldırdık, otomatik oluşturacağız
    sparse: true   // Benzersizlik kontrolünde null değerleri yok say
  }
});

// Quiz kaydetmeden önce çalışacak middleware
quizSchema.pre('save', async function(next) {
  try {
    // Eğer quizCode henüz ayarlanmamışsa
    if (!this.quizCode) {
      console.log('Quiz kaydediliyor, quizCode otomatik oluşturuluyor...');
      // Benzersiz bir kod oluştur
      this.quizCode = await createUniqueQuizCode(this.constructor);
      console.log('Oluşturulan quizCode:', this.quizCode);
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
