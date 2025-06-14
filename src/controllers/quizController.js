const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// Benzersiz 6 haneli kod oluşturan yardımcı fonksiyon - daha karmaşık bir yaklaşım
function generateUniqueCode() {
  // Daha karmaşık bir kod oluşturmak için timestamp ekleme
  const timestamp = Date.now().toString().slice(-4); // Son 4 hanesi
  const random = Math.floor(1000 + Math.random() * 9000).toString(); // 4 haneli rastgele sayı
  return random + timestamp; // 8 haneli benzersiz kod
}

// Veritabanında belirli bir kodun benzersiz olduğunu kontrol et
async function isCodeUnique(code) {
  if (!code) return false; // Boş kod kabul etmiyoruz
  const existingQuiz = await Quiz.findOne({ quizCode: code });
  return !existingQuiz;
}

// Benzersiz bir kod oluşturup döndür (tekrarlayıcı)
async function generateUniqueQuizCode() {
  let quizCode;
  let isUnique = false;
  let retryCount = 0;
  const maxRetries = 15; // Daha fazla deneme
  
  while (!isUnique && retryCount < maxRetries) {
    quizCode = generateUniqueCode();
    isUnique = await isCodeUnique(quizCode);
    retryCount++;
  }
  
  // Eğer tüm denemeler başarısız olursa, daha benzersiz bir kod oluştur
  if (!isUnique) {
    // UUID benzeri bir kod oluştur - daha da benzersiz
    quizCode = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    isUnique = await isCodeUnique(quizCode);
    
    if (!isUnique) {
      throw new Error('Benzersiz bir quiz kodu oluşturulamadı.');
    }
  }
  
  return quizCode;
}

// Yeni quiz oluştur
exports.createQuiz = async (req, res) => {
  try {
    const { title, duration, avatarCategory, music } = req.body;
    
    // Her durumda benzersiz bir quiz kodu üretildiğinden emin oluyoruz
    let quizCode;
    try {
      quizCode = await generateUniqueQuizCode();
    } catch (codeError) {
      console.error('Quiz kodu oluşturma hatası:', codeError);
      return res.status(500).json({ message: 'Benzersiz quiz kodu oluşturulamadı. Lütfen tekrar deneyin.' });
    }
    
    // Kesinlikle boş kod kontrolü
    if (!quizCode || quizCode === 'null' || quizCode === 'undefined') {
      console.error('Quiz kodu geçerli değil!');
      return res.status(500).json({ message: 'Geçerli bir quiz kodu oluşturulamadı. Lütfen tekrar deneyin.' });
    }
    
    console.log('Oluşturulan quiz kodu:', quizCode); // Log ekleyelim
    
    // Yeni quiz nesnesi oluştur
    const quiz = new Quiz({
      title,
      createdBy: req.userId,
      duration: duration || 30,
      avatarCategory: avatarCategory || 'hayvanlar',
      music: music || null,
      quizCode // Oluşturulan benzersiz kodu ekle
    });
    
    // Kaydetmeden önce kod kontrolü
    if (!quiz.quizCode) {
      console.error('Quiz nesnesi oluşturuldu ama quiz kodu eksik!');
      quiz.quizCode = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    }
    
    // Veritabanına kaydet
    // Kaydedilen quizi döndür
    const savedQuiz = await quiz.save();
    
    console.log('Oluşturulan quiz:', savedQuiz); // Hangi veriler döndürülüyor görelim
    
    // Mutlaka _id içerdiğinden emin olalım
    res.status(201).json({
      message: 'Quiz başarıyla oluşturuldu',
      _id: savedQuiz._id,  // Bu anahtarı açıkça belirtelim (frontend'de response.data._id olarak erişiliyor)
      quiz: savedQuiz      // Tüm quiz nesnesini de döndürelim
    });
  } catch (error) {
    console.error('Quiz oluşturma hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
}

// Tüm quizleri getir
exports.getAllQuizzes = async (req, res) => {
  try {
    // Yalnızca gerekli alanları getir
    const quizzes = await Quiz.find()
      .sort({ createdAt: -1 });
    
    res.json({ quizzes });
  } catch (error) {
    console.error('Quiz listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Kullanıcının quizlerini listele
exports.getMyQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.userId })
      .sort({ createdAt: -1 });
    
    res.json({ quizzes });
  } catch (error) {
    console.error('Quiz listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Belirli bir quizi getir
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('questions');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz bulunamadı' });
    }
    
    // Sadece oluşturan kullanıcı veya adminler görüntüleyebilir
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu quizi görüntüleme yetkiniz yok' });
    }
    
    res.json({ quiz });
  } catch (error) {
    console.error('Quiz getirme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Quizi güncelle
exports.updateQuiz = async (req, res) => {
  try {
    const { 
      title, 
      duration, 
      defaultQuestionDuration, 
      defaultQuestionPoints,
      avatarCategory, 
      music,
      isTemplate,
      coverImage 
    } = req.body;
    
    // Güncellenecek verileri loglama
    console.log('Quiz güncelleme verileri:', req.body);
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz bulunamadı' });
    }
    
    // Sadece oluşturan kullanıcı veya adminler güncelleyebilir
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu quizi düzenleme yetkiniz yok' });
    }
    
    // Alanları güncelle
    if (title) quiz.title = title;
    if (duration !== undefined) quiz.duration = duration;
    if (defaultQuestionDuration !== undefined) quiz.defaultQuestionDuration = defaultQuestionDuration;
    if (defaultQuestionPoints !== undefined) quiz.defaultQuestionPoints = defaultQuestionPoints;
    if (avatarCategory) quiz.avatarCategory = avatarCategory;
    if (music !== undefined) quiz.music = music;
    if (isTemplate !== undefined) quiz.isTemplate = isTemplate;
    if (coverImage !== undefined) quiz.coverImage = coverImage;
    
    console.log('Güncellenen quiz bilgileri:', {
      title: quiz.title,
      defaultQuestionDuration: quiz.defaultQuestionDuration,
      defaultQuestionPoints: quiz.defaultQuestionPoints,
      isTemplate: quiz.isTemplate,
      coverImage: quiz.coverImage ? 'var' : 'yok'
    });
    
    await quiz.save();
    
    res.json({
      message: 'Quiz başarıyla güncellendi',
      quiz
    });
  } catch (error) {
    console.error('Quiz güncelleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Quizi sil
exports.deleteQuiz = async (req, res) => {
  try {
    console.log(`Quiz silme isteği: ${req.params.id} kullanıcı: ${req.userId}`);
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      console.log(`Quiz bulunamadı: ${req.params.id}`);
      return res.status(404).json({ message: 'Quiz bulunamadı' });
    }
    
    // Sadece oluşturan kullanıcı veya adminler silebilir
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      console.log(`Yetki hatası - Quiz silme erişim reddedildi: ${req.userId} kullanıcısı ${quiz.createdBy} tarafından oluşturulan quizi silemez`);
      return res.status(403).json({ message: 'Bu quizi silme yetkiniz yok' });
    }
    
    console.log(`Sorular siliniyor - quiz: ${quiz._id}`);
    // İlgili tüm soruları da sil
    const questionResult = await Question.deleteMany({ quizId: quiz._id });
    console.log(`Silinen soru sayısı: ${questionResult.deletedCount}`);
    
    // Quizi sil - deleteOne() yerine findByIdAndDelete kullanıyoruz
    console.log(`Quiz siliniyor: ${quiz._id}`);
    const deleteResult = await Quiz.findByIdAndDelete(quiz._id);
    
    if (!deleteResult) {
      throw new Error(`Quiz silme başarısız oldu: ${quiz._id}`);
    }
    
    console.log(`Quiz başarıyla silindi: ${quiz._id}`);
    res.json({ message: 'Quiz ve ilgili tüm sorular başarıyla silindi' });
  } catch (error) {
    console.error('Quiz silme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};
