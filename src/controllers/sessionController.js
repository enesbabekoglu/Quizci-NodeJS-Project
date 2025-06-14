const Session = require('../models/Session');
const Quiz = require('../models/Quiz');

// Yeni bir oturum başlat
exports.startSession = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    
    // Quiz'in var olduğunu kontrol et
    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz bulunamadı' });
    }
    
    // Kullanıcının bu quiz'i başlatma yetkisi var mı kontrol et
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu quizi başlatma yetkiniz yok' });
    }
    
    // Soru sayısını kontrol et
    if (quiz.questions.length === 0) {
      return res.status(400).json({ message: 'Bu quizde soru bulunmuyor. Lütfen önce soru ekleyin.' });
    }
    
    // Benzersiz bir PIN oluştur
    let pin;
    let pinExists = true;
    
    // Benzersiz bir PIN bulunana kadar dene
    while (pinExists) {
      pin = Session.generatePin();
      const existingSession = await Session.findOne({ pin });
      if (!existingSession) {
        pinExists = false;
      }
    }
    
    // Yeni oturum oluştur
    const session = new Session({
      quizId,
      pin
    });
    
    await session.save();
    
    res.status(201).json({
      message: 'Oturum başarıyla başlatıldı',
      session
    });
  } catch (error) {
    console.error('Oturum başlatma hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Oturuma katıl
exports.joinSession = async (req, res) => {
  try {
    const { pin } = req.params;
    const { nickname, avatar } = req.body;
    
    if (!nickname || !avatar) {
      return res.status(400).json({ message: 'Nickname ve avatar gereklidir' });
    }
    
    // Oturumu bul
    const session = await Session.findOne({ pin });
    if (!session) {
      return res.status(404).json({ message: 'Geçersiz PIN. Oturum bulunamadı' });
    }
    
    // Oturumun durumunu kontrol et
    if (session.status !== 'waiting') {
      return res.status(400).json({ message: 'Bu oturum katılıma kapalı' });
    }
    
    // Nickname'in benzersiz olduğundan emin ol
    const existingParticipant = session.participants.find(p => p.nickname === nickname);
    if (existingParticipant) {
      return res.status(400).json({ message: 'Bu isim zaten kullanılıyor. Lütfen başka bir isim seçin.' });
    }
    
    // Katılımcıyı ekle
    session.participants.push({
      nickname,
      avatar,
      score: 0,
      answers: []
    });
    
    await session.save();
    
    res.status(200).json({
      message: 'Oturuma başarıyla katıldınız',
      sessionId: session._id,
      nickname,
      pin
    });
  } catch (error) {
    console.error('Oturuma katılma hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Oturum durumunu getir
exports.getSession = async (req, res) => {
  try {
    const { pin } = req.params;
    
    // Oturumu bul
    const session = await Session.findOne({ pin })
      .populate('quizId')
      .select('-participants.answers');
    
    if (!session) {
      return res.status(404).json({ message: 'Oturum bulunamadı' });
    }
    
    res.status(200).json({ session });
  } catch (error) {
    console.error('Oturum bilgisi hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Oturumu sonlandır (sadece oturum sahibi veya admin)
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Oturumu bul
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Oturum bulunamadı' });
    }
    
    // Quiz'i bul ve yetki kontrolü yap
    const quiz = await Quiz.findById(session.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'İlgili quiz bulunamadı' });
    }
    
    // Kullanıcının bu oturumu sonlandırma yetkisi var mı kontrol et
    if (quiz.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu oturumu sonlandırma yetkiniz yok' });
    }
    
    // Oturumu güncelle
    session.status = 'completed';
    session.endedAt = new Date();
    
    await session.save();
    
    res.status(200).json({
      message: 'Oturum başarıyla sonlandırıldı',
      session
    });
  } catch (error) {
    console.error('Oturum sonlandırma hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};
