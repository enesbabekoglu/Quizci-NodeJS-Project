const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// Şablon quizleri listele
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Quiz.find({ isTemplate: true })
      .populate('createdBy', 'username')
      .sort({ title: 1 });
    
    res.json({ templates });
  } catch (error) {
    console.error('Şablon listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Şablon quizi kopyala
exports.duplicateTemplate = async (req, res) => {
  try {
    const templateId = req.params.id;
    
    // Şablon quizi bul
    const template = await Quiz.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Şablon quiz bulunamadı' });
    }
    
    // Şablon kontrolü
    if (!template.isTemplate) {
      return res.status(400).json({ message: 'Bu quiz bir şablon değil' });
    }
    
    // Sorular
    const questions = await Question.find({ quizId: template._id });
    
    // Yeni quizi oluştur
    const newQuiz = new Quiz({
      title: `${template.title} (Kopyası)`,
      createdBy: req.userId,
      isTemplate: false,
      duration: template.duration,
      avatarCategory: template.avatarCategory,
      music: template.music,
      questions: []
    });
    
    await newQuiz.save();
    
    // Soruları kopyala
    for (const question of questions) {
      const newQuestion = new Question({
        quizId: newQuiz._id,
        questionText: question.questionText,
        options: question.options,
        correctIndex: question.correctIndex,
        media: question.media
      });
      
      await newQuestion.save();
      
      // Quize soru referansını ekle
      newQuiz.questions.push(newQuestion._id);
    }
    
    // Quizi güncelle
    await newQuiz.save();
    
    res.status(201).json({
      message: 'Şablon başarıyla kopyalandı',
      quiz: newQuiz
    });
  } catch (error) {
    console.error('Şablon kopyalama hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};
