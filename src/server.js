const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const socketIo = require('socket.io');
const path = require('path');
const fileUpload = require('express-fileupload');

// Socket Service
const socketService = require('./services/socketService');

// Rotalar
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const questionRoutes = require('./routes/questionRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const questionBankRoutes = require('./routes/questionBankRoutes');
const audioRoutes = require('./routes/audioRoutes');
const avatarRoutes = require('./routes/avatarRoutes');

// Çevresel değişkenleri yükle
dotenv.config();

// Express uygulamasını oluştur
const app = express();
const server = http.createServer(app);

// CORS ayarları
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // PATCH metodu eklendi
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Socket servisini başlat
socketService(io);

// Middleware
app.use(cors(corsOptions));
// İstek boyut sınırlarını artır (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Dosya yükleme desteği
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  useTempFiles: true,
  createParentPath: true
}));

// Statik dosyalar için klasör
app.use('/public', express.static(path.join(__dirname, '../public')));

// Basit sağlık kontrolü
app.get('/', (req, res) => {
  res.send('Quizci API çalışıyor!');
});

// API rotalarını yükle
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/avatars', avatarRoutes);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizci')
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
