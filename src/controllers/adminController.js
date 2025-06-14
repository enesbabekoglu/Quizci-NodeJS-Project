const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Session = require('../models/Session');
const fs = require('fs');
const path = require('path');

// İstatistikler
exports.getAnalytics = async (req, res) => {
  try {
    // Özet istatistikleri topla
    const userCount = await User.countDocuments();
    const quizCount = await Quiz.countDocuments();
    const sessionCount = await Session.countDocuments();
    
    // Aktif oturum sayısı
    const activeSessionCount = await Session.countDocuments({ status: 'active' });
    
    // Son 7 günde oluşturulan quizler
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentQuizzes = await Quiz.countDocuments({ createdAt: { $gte: last7Days } });
    
    // En popüler avatarlar
    const sessions = await Session.find();
    const avatarStats = {};
    
    sessions.forEach(session => {
      session.participants.forEach(participant => {
        if (!avatarStats[participant.avatar]) {
          avatarStats[participant.avatar] = 0;
        }
        avatarStats[participant.avatar]++;
      });
    });
    
    // Avatar popülerliğine göre sırala
    const popularAvatars = Object.entries(avatarStats)
      .map(([avatar, count]) => ({ avatar, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    res.json({
      summary: {
        userCount,
        quizCount,
        sessionCount,
        activeSessionCount,
        recentQuizzes
      },
      popularAvatars
    });
  } catch (error) {
    console.error('İstatistik hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Tüm kullanıcıları getir
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Kullanıcı listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Tüm quizleri getir
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({ quizzes });
  } catch (error) {
    console.error('Quiz listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Tüm oturumları getir
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('quiz', 'title')
      .sort({ createdAt: -1 });
    
    res.json({ sessions });
  } catch (error) {
    console.error('Oturum listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Kullanıcı rolünü güncelle
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    // Rol kontrolü
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { role }, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Rol güncelleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Kullanıcı sil
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Admin kendisini silemesin
    if (userId === req.userId.toString()) {
      return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Başka admin silmeyi engelle
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin kullanıcılar silinemez' });
    }
    
    // Kullanıcının quizlerini bul
    const userQuizzes = await Quiz.find({ createdBy: userId });
    
    // Her quiz için ilgili soruları ve oturumları temizle
    for (const quiz of userQuizzes) {
      await Question.deleteMany({ quizId: quiz._id });
      await Session.deleteMany({ quizId: quiz._id });
    }
    
    // Kullanıcının tüm quizlerini sil
    await Quiz.deleteMany({ createdBy: userId });
    
    // Kullanıcıyı sil
    await user.deleteOne();
    
    res.json({ message: 'Kullanıcı ve tüm ilgili içerikler başarıyla silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Avatar yükle
exports.uploadAvatar = async (req, res) => {
  try {
    // Avatar dosyası kontrolü
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar dosyası eksik' });
    }
    
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ message: 'Avatar kategorisi belirtilmedi' });
    }
    
    // Kategori dizini oluştur
    const categoryDir = path.join(__dirname, '../../public/avatars', category);
    
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    // Dosyayı taşı
    const fileName = `${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(path.join(categoryDir, fileName), req.file.buffer);
    
    res.status(201).json({
      message: 'Avatar başarıyla yüklendi',
      avatar: {
        category,
        fileName,
        path: `/public/avatars/${category}/${fileName}`
      }
    });
  } catch (error) {
    console.error('Avatar yükleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Avatar kategorileri getir
exports.getAvatarCategories = async (req, res) => {
  try {
    const avatarsDir = path.join(__dirname, '../../public/avatars');
    
    // public/avatars dizini yoksa oluştur
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
      return res.json({ categories: [] });
    }
    
    // Kategorileri (alt dizinleri) listele
    const categories = fs.readdirSync(avatarsDir)
      .filter(item => {
        const itemPath = path.join(avatarsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    res.json({ categories });
  } catch (error) {
    console.error('Avatar kategorileri hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Kategorideki avatarları getir
exports.getAvatarsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const categoryDir = path.join(__dirname, '../../public/avatars', category);
    
    // Kategori dizini var mı kontrol et
    if (!fs.existsSync(categoryDir)) {
      return res.status(404).json({ message: 'Avatar kategorisi bulunamadı' });
    }
    
    // Avatarları listele
    const avatars = fs.readdirSync(categoryDir)
      .filter(item => {
        const itemPath = path.join(categoryDir, item);
        return fs.statSync(itemPath).isFile();
      })
      .map(fileName => ({
        fileName,
        path: `/public/avatars/${category}/${fileName}`
      }));
    
    res.json({ 
      category, 
      avatars 
    });
  } catch (error) {
    console.error('Avatar listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Avatar sil
exports.deleteAvatar = async (req, res) => {
  try {
    const { category, fileName } = req.body;
    
    if (!category || !fileName) {
      return res.status(400).json({ message: 'Kategori ve dosya adı gereklidir' });
    }
    
    const avatarPath = path.join(__dirname, '../../public/avatars', category, fileName);
    
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(avatarPath)) {
      return res.status(404).json({ message: 'Avatar bulunamadı' });
    }
    
    // Dosyayı sil
    fs.unlinkSync(avatarPath);
    
    res.json({ message: 'Avatar başarıyla silindi' });
  } catch (error) {
    console.error('Avatar silme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};
