const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

// Yeni soru ekle
exports.createQuestion = async (req, res) => {
  try {
    const { 
      questionText, 
      options, 
      correctIndex, 
      media,
      // Yeni alanları ekleyelim 
      duration, 
      points,
      image 
    } = req.body;
    
    console.log('Soru oluşturma için gelen veriler:', req.body);
    
    const quizId = req.params.quizId;
    
    // Quiz'in var olduğunu kontrol et
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz bulunamadı' });
    }
    
    // Kullanıcının quiz'i düzenleme yetkisi var mı kontrol et
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu quize soru ekleme yetkiniz yok' });
    }
    
    // Soru oluştur
    const question = new Question({
      quizId,
      questionText,
      options,
      correctIndex,
      // Yeni alanlar
      duration: duration || 30,
      points: points || 100,
      image: image || '',
      media: media || { type: null, url: null }
    });
    
    await question.save();
    
    // Quiz'e soru referansını ekle
    quiz.questions.push(question._id);
    await quiz.save();
    
    res.status(201).json({
      message: 'Soru başarıyla oluşturuldu',
      question
    });
  } catch (error) {
    console.error('Soru oluşturma hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Soruyu güncelle
exports.updateQuestion = async (req, res) => {
  try {
    const { 
      questionText, 
      options, 
      correctIndex, 
      media, 
      // Yeni alanları ekleyelim
      duration, 
      points, 
      image 
    } = req.body;

    console.log('Soru güncelleme verileri:', req.body); // Tüm gelen verileri görelim
    
    const questionId = req.params.questionId;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }
    
    // Quiz'i bul ve yetki kontrolü yap
    const quiz = await Quiz.findById(question.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Bu sorunun bağlı olduğu quiz bulunamadı' });
    }
    
    // Kullanıcının quiz'i düzenleme yetkisi var mı kontrol et
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu soruyu düzenleme yetkiniz yok' });
    }
    
    // Soruyu güncelle
    if (questionText) question.questionText = questionText;
    if (options) question.options = options;
    if (correctIndex !== undefined) question.correctIndex = correctIndex;
    if (media) question.media = media;
    
    // Süre, puan ve görsel alanlarını da güncelle
    console.log('Güncellenecek değerler:', { 
      duration: duration, 
      points: points, 
      image: image 
    });

    // Sayısal tipleri çok sıkı kontrol edip dönüştürelim
    if (duration !== undefined) {
      // İlk durumunu loglayalım
      console.log('Gelen süre değeri (tip):', duration, typeof duration);
      
      // Direkt Number ile dönüştür
      let numericDuration = Number(duration);
      
      // Eğer geçerli bir sayı değilse, parseInt deneyelim
      if (isNaN(numericDuration)) {
        numericDuration = parseInt(duration) || 30;
      }
      
      // Yine geçerli değilse, varsayılanı kullanalım
      if (isNaN(numericDuration)) {
        numericDuration = 30;
      }
      
      // Kesinlikle sayısal olarak ata
      question.duration = numericDuration;
      
      console.log('Yeni süre değeri (kesinlikle sayı):', question.duration, typeof question.duration);
    }
    
    if (points !== undefined) {
      // İlk durumunu loglayalım
      console.log('Gelen puan değeri (tip):', points, typeof points);
      
      // Direkt Number ile dönüştür
      let numericPoints = Number(points);
      
      // Eğer geçerli bir sayı değilse, parseInt deneyelim
      if (isNaN(numericPoints)) {
        numericPoints = parseInt(points) || 100;
      }
      
      // Yine geçerli değilse, varsayılanı kullanalım
      if (isNaN(numericPoints)) {
        numericPoints = 100;
      }
      
      // Kesinlikle sayısal olarak ata
      question.points = numericPoints;
      
      console.log('Yeni puan değeri (kesinlikle sayı):', question.points, typeof question.points);
    }
    
    if (image !== undefined) {
      question.image = image || '';
      console.log('Yeni görsel değeri:', question.image, typeof question.image);
    }
    
    // Soruyu kaydedin
    const savedQuestion = await question.save();
    console.log('Kaydedilen soru:', {
      questionId: savedQuestion._id,
      duration: savedQuestion.duration,
      points: savedQuestion.points,
      image: savedQuestion.image
    });
    
    res.json({
      message: 'Soru başarıyla güncellendi',
      question: savedQuestion
    });
  } catch (error) {
    console.error('Soru güncelleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Soruyu sil
exports.deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params.questionId;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Soru bulunamadı' });
    }
    
    // Quiz'i bul ve yetki kontrolü yap
    const quiz = await Quiz.findById(question.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Bu sorunun bağlı olduğu quiz bulunamadı' });
    }
    
    // Kullanıcının quiz'i düzenleme yetkisi var mı kontrol et
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu soruyu silme yetkiniz yok' });
    }
    
    // Quiz'den soru referansını kaldır
    quiz.questions = quiz.questions.filter(q => q.toString() !== questionId);
    await quiz.save();
    
    // Soruyu sil
    await question.deleteOne();
    
    res.json({ message: 'Soru başarıyla silindi' });
  } catch (error) {
    console.error('Soru silme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};
