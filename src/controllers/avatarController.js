const Avatar = require('../models/Avatar');
const AvatarCategory = require('../models/AvatarCategory');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const { v4: uuidv4 } = require('uuid');

// Avatar dizini
const AVATAR_DIR = path.join(__dirname, '../../client/public/avatars');

// Tüm avatar kategorilerini getir
exports.getAvatarCategories = async (req, res) => {
  try {
    const categories = await AvatarCategory.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    console.error('Avatar kategorileri getirilirken hata oluştu:', error);
    res.status(500).json({ message: 'Avatar kategorileri getirilirken bir hata oluştu.' });
  }
};

// Yeni kategori ekle
exports.createCategory = async (req, res) => {
  try {
    const { name, displayName, description } = req.body;
    
    // Kategori adında boşluk varsa _ ile değiştir
    const normalizedName = name.trim().replace(/\s+/g, '_').toLowerCase();
    
    // Kategorinin var olup olmadığını kontrol et
    const existingCategory = await AvatarCategory.findOne({ name: normalizedName });
    if (existingCategory) {
      return res.status(400).json({ message: 'Bu isimde bir kategori zaten mevcut.' });
    }
    
    // Yeni kategori oluştur
    const newCategory = new AvatarCategory({
      name: normalizedName,
      displayName: displayName || name,
      description
    });
    
    await newCategory.save();
    
    // Kategori için klasör oluştur
    const categoryDir = path.join(AVATAR_DIR, normalizedName);
    if (!fs.existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true });
    }
    
    res.status(201).json({ 
      message: 'Kategori başarıyla oluşturuldu.', 
      category: newCategory 
    });
  } catch (error) {
    console.error('Kategori oluşturulurken hata:', error);
    res.status(500).json({ message: 'Kategori oluşturulurken bir hata oluştu.' });
  }
};

// Belirli bir kategorideki avatarları getir
exports.getAvatarsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    // Limit parametresini kontrol et (varsayılan: 20)
    let limit = parseInt(req.query.limit) || 1000;
    
    // Sayfalama için skip parametresi
    let skip = parseInt(req.query.skip) || 0;
    
    console.log(`Kategori: ${category}, Limit: ${limit}, Skip: ${skip}`);
    
    // Kategorinin var olup olmadığını kontrol et
    const existingCategory = await AvatarCategory.findOne({ name: category });
    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }
    
    // Limit parametresi ile sorgu yap
    const avatars = await Avatar.find({ category }).sort({ uploadDate: -1 }).skip(skip).limit(limit);
    
    // Toplam avatar sayısını da döndür
    const totalCount = await Avatar.countDocuments({ category });
    
    console.log(`Kategori ${category} için ${avatars.length}/${totalCount} avatar bulundu`);
    
    res.json({ 
      avatars, 
      totalCount,
      success: true
    });
  } catch (error) {
    console.error('Avatarlar getirilirken hata:', error);
    res.status(500).json({ message: 'Avatarlar getirilirken bir hata oluştu.' });
  }
};

// Yeni avatar yükle
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ message: 'Yüklenecek dosya bulunamadı.' });
    }
    
    const { category } = req.body;
    
    // Kategorinin var olup olmadığını kontrol et
    const existingCategory = await AvatarCategory.findOne({ name: category });
    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }
    
    const avatarFile = req.files.avatar;
    
    // Dosya tipini kontrol et
    if (!avatarFile.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Lütfen geçerli bir resim dosyası yükleyin.' });
    }
    
    // Dosya adını temizle ve düzenle
    const originalName = path.basename(avatarFile.name);
    const fileExt = path.extname(originalName);
    const baseName = path.basename(originalName, fileExt);
    // Dosya adında boşlukları ve özel karakterleri temizle
    const cleanBaseName = baseName
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_{2,}/g, '_');
    
    // Benzersiz bir dosya adı oluştur
    const fileName = `${cleanBaseName}_${uuidv4().substring(0, 8)}${fileExt}`;
    const filePath = path.join(AVATAR_DIR, category, fileName);
    const relativePath = `/avatars/${category}/${fileName}`;
    
    // Kategori dizininin var olduğundan emin ol
    const categoryDir = path.join(AVATAR_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true });
    }
    
    // Dosyayı kaydet
    await avatarFile.mv(filePath);
    
    // Veritabanına kaydet
    const avatar = new Avatar({
      name: fileName,
      category,
      filePath: relativePath,
      displayName: cleanBaseName.replace(/_/g, ' '),
      uploadedBy: req.user._id
    });
    
    await avatar.save();
    
    res.status(201).json({ 
      message: 'Avatar başarıyla yüklendi.', 
      avatar 
    });
  } catch (error) {
    console.error('Avatar yüklenirken hata:', error);
    res.status(500).json({ message: 'Avatar yüklenirken bir hata oluştu.' });
  }
};

// Çok sayıda avatar yükle
exports.uploadMultipleAvatars = async (req, res) => {
  try {
    if (!req.files || !req.files.avatars) {
      return res.status(400).json({ message: 'Yüklenecek dosya bulunamadı.' });
    }
    
    const { category } = req.body;
    
    // Kategorinin var olup olmadığını kontrol et
    const existingCategory = await AvatarCategory.findOne({ name: category });
    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }
    
    // Dosyaları diziye dönüştür (tek dosya yüklenebileceğini de hesaba kat)
    const avatarFiles = Array.isArray(req.files.avatars) 
      ? req.files.avatars 
      : [req.files.avatars];
    
    // Kategori dizininin var olduğundan emin ol
    const categoryDir = path.join(AVATAR_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      await mkdir(categoryDir, { recursive: true });
    }
    
    const uploadedAvatars = [];
    
    // Her bir dosyayı işle
    for (const avatarFile of avatarFiles) {
      // Dosya tipini kontrol et
      if (!avatarFile.mimetype.startsWith('image/')) {
        continue;
      }
      
      // Dosya adını temizle ve düzenle
      const originalName = path.basename(avatarFile.name);
      const fileExt = path.extname(originalName);
      const baseName = path.basename(originalName, fileExt);
      // Dosya adında boşlukları ve özel karakterleri temizle
      const cleanBaseName = baseName
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_{2,}/g, '_');
      
      // Benzersiz bir dosya adı oluştur
      const fileName = `${cleanBaseName}_${uuidv4().substring(0, 8)}${fileExt}`;
      const filePath = path.join(categoryDir, fileName);
      const relativePath = `/avatars/${category}/${fileName}`;
      
      // Dosyayı kaydet
      await avatarFile.mv(filePath);
      
      // Veritabanına kaydet
      const avatar = new Avatar({
        name: fileName,
        category,
        filePath: relativePath,
        displayName: cleanBaseName.replace(/_/g, ' '),
        uploadedBy: req.user._id
      });
      
      await avatar.save();
      uploadedAvatars.push(avatar);
    }
    
    res.status(201).json({ 
      message: `${uploadedAvatars.length} avatar başarıyla yüklendi.`, 
      avatars: uploadedAvatars 
    });
  } catch (error) {
    console.error('Avatarlar yüklenirken hata:', error);
    res.status(500).json({ message: 'Avatarlar yüklenirken bir hata oluştu.' });
  }
};

// Quiz ID'ye göre avatar kategorisi bulma ve avatarları getirme
exports.getAvatarsByQuizId = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Önce quizi ara ve avatar kategorisini bul
    const Quiz = require('../models/Quiz');
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz bulunamadı.' });
    }
    
    // Quiz'in avatar kategorisi
    const avatarCategory = quiz.avatarCategory || 'default';
    
    // Bu kategorideki avatarları getir
    const avatars = await Avatar.find({ category: avatarCategory }).sort({ uploadDate: -1 });
    
    res.json({ 
      category: avatarCategory, 
      avatars: avatars 
    });
  } catch (error) {
    console.error('Quiz avatarları getirilirken hata:', error);
    res.status(500).json({ message: 'Avatarlar getirilirken bir hata oluştu.' });
  }
};

// Avatar sil
exports.deleteAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Avatar'ı bul
    const avatar = await Avatar.findById(id);
    if (!avatar) {
      return res.status(404).json({ message: 'Avatar bulunamadı.' });
    }
    
    // Dosya yolu oluştur
    const filePath = path.join(AVATAR_DIR, avatar.category, avatar.name);
    
    // Dosya varsa sil
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
    }
    
    // Veritabanından sil
    await Avatar.findByIdAndDelete(id);
    
    res.json({ message: 'Avatar başarıyla silindi.' });
  } catch (error) {
    console.error('Avatar silinirken hata:', error);
    res.status(500).json({ message: 'Avatar silinirken bir hata oluştu.' });
  }
};
