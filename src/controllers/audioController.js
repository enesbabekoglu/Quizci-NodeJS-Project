const fs = require('fs');
const path = require('path');

// Müzik dosyalarını listele
exports.getMusic = async (req, res) => {
  try {
    const musicDir = path.join(__dirname, '../../public/music');
    
    // music dizini yoksa oluştur
    if (!fs.existsSync(musicDir)) {
      fs.mkdirSync(musicDir, { recursive: true });
      return res.json({ music: [] });
    }
    
    // Müzik dosyalarını listele
    const music = fs.readdirSync(musicDir)
      .filter(file => {
        const fileExt = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.ogg'].includes(fileExt);
      })
      .map(file => ({
        id: file.replace(/\.[^/.]+$/, ""), // Uzantıyı kaldır, id olarak kullan
        name: file.replace(/\.[^/.]+$/, "").replace(/_/g, ' '), // Dosya adını düzenle
        file: file,
        path: `/public/music/${file}`
      }));
    
    res.json({ music });
  } catch (error) {
    console.error('Müzik listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Ses efektlerini listele
exports.getSounds = async (req, res) => {
  try {
    const soundsDir = path.join(__dirname, '../../public/sounds');
    
    // sounds dizini yoksa oluştur
    if (!fs.existsSync(soundsDir)) {
      fs.mkdirSync(soundsDir, { recursive: true });
      return res.json({ sounds: [] });
    }
    
    // Ses dosyalarını listele
    const sounds = fs.readdirSync(soundsDir)
      .filter(file => {
        const fileExt = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.ogg'].includes(fileExt);
      })
      .map(file => ({
        id: file.replace(/\.[^/.]+$/, ""), // Uzantıyı kaldır, id olarak kullan
        name: file.replace(/\.[^/.]+$/, "").replace(/_/g, ' '), // Dosya adını düzenle
        file: file,
        path: `/public/sounds/${file}`
      }));
    
    res.json({ sounds });
  } catch (error) {
    console.error('Ses efekti listeleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Müzik dosyası yükle (sadece admin yetkisi)
exports.uploadMusic = async (req, res) => {
  try {
    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({ message: 'Müzik dosyası eksik' });
    }
    
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Dosya türü kontrolü
    if (!['.mp3', '.wav', '.ogg'].includes(fileExt)) {
      return res.status(400).json({ message: 'Desteklenmeyen dosya formatı. Sadece mp3, wav ve ogg dosyaları kabul edilir.' });
    }
    
    // Dosyayı kaydet
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(__dirname, '../../public/music', fileName);
    
    fs.writeFileSync(filePath, req.file.buffer);
    
    res.status(201).json({
      message: 'Müzik dosyası başarıyla yüklendi',
      music: {
        id: fileName.replace(/\.[^/.]+$/, ""),
        name: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
        file: fileName,
        path: `/public/music/${fileName}`
      }
    });
  } catch (error) {
    console.error('Müzik yükleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Ses efekti yükle (sadece admin yetkisi)
exports.uploadSound = async (req, res) => {
  try {
    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({ message: 'Ses dosyası eksik' });
    }
    
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Dosya türü kontrolü
    if (!['.mp3', '.wav', '.ogg'].includes(fileExt)) {
      return res.status(400).json({ message: 'Desteklenmeyen dosya formatı. Sadece mp3, wav ve ogg dosyaları kabul edilir.' });
    }
    
    // Dosyayı kaydet
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(__dirname, '../../public/sounds', fileName);
    
    fs.writeFileSync(filePath, req.file.buffer);
    
    res.status(201).json({
      message: 'Ses efekti başarıyla yüklendi',
      sound: {
        id: fileName.replace(/\.[^/.]+$/, ""),
        name: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
        file: fileName,
        path: `/public/sounds/${fileName}`
      }
    });
  } catch (error) {
    console.error('Ses efekti yükleme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Müzik dosyası sil
exports.deleteMusic = async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ message: 'Dosya adı gereklidir' });
    }
    
    const filePath = path.join(__dirname, '../../public/music', fileName);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Müzik dosyası bulunamadı' });
    }
    
    // Dosyayı sil
    fs.unlinkSync(filePath);
    
    res.json({ message: 'Müzik dosyası başarıyla silindi' });
  } catch (error) {
    console.error('Müzik silme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};

// Ses efekti sil
exports.deleteSound = async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ message: 'Dosya adı gereklidir' });
    }
    
    const filePath = path.join(__dirname, '../../public/sounds', fileName);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Ses efekti bulunamadı' });
    }
    
    // Dosyayı sil
    fs.unlinkSync(filePath);
    
    res.json({ message: 'Ses efekti başarıyla silindi' });
  } catch (error) {
    console.error('Ses efekti silme hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
  }
};
