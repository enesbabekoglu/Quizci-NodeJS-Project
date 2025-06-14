# Quizci - Gerçek Zamanlı Quiz Platformu

Sanem Coşkun - 21360859022
Enes Babekoğlu - 20360859113

Quizci, eğitimcilerin ve sunucuların canlı quiz oturumları oluşturmasını ve kullanıcıların bu oturumlara katılmasını sağlayan interaktif bir uygulamadır. Socket.io tabanlı gerçek zamanlı iletişim, MongoDB veri tabanı ve React kullanıcı arayüzü ile modern web teknolojilerini bir araya getirmektedir.

## 🚀 Özellikler

- **Canlı Quiz Oturumları:** Öğretmenler ve sunucular gerçek zamanlı quiz oturumları oluşturabilir
- **Oturum PIN Sistemi:** Kullanıcılar, 6 haneli PIN kodu ile oturumlara kolayca katılabilir
- **Avatar Sistemi:** Kullanıcılar kişiselleştirilmiş avatarlar seçerek katılım sağlayabilir
- **Gerçek Zamanlı Etkileşim:** Socket.io sayesinde anlık geri bildirim ve sonuç paylaşımı
- **Yönetici Paneli:** Kullanıcıları, quizleri ve oturumları yönetmek için kapsamlı admin paneli
- **Duyarlı Tasarım:** Mobil ve masaüstü cihazlarda sorunsuz çalışan kullanıcı arayüzü

## 📋 Teknik Yapı

### Backend (Node.js)

- **Express.js:** Web sunucu çerçevesi
- **Socket.io:** Gerçek zamanlı iletişim
- **MongoDB/Mongoose:** Veritabanı ve ORM
- **JWT:** Kullanıcı kimlik doğrulaması
- **Express-fileupload:** Dosya yükleme sistemi
- **CORS:** Güvenli kaynaklar arası istekler

### Frontend (React)

- **React 19:** Modern kullanıcı arayüzü
- **React Router v7:** Uygulama içi yönlendirme
- **Socket.io-client:** Gerçek zamanlı veri iletişimi
- **Axios:** HTTP istekleri
- **Tailwind CSS:** Duyarlı tasarım sistemi
- **QRCode.react:** QR kod oluşturma

## 🛠️ Kurulum

### Gereksinimler

- Node.js (v18+)
- MongoDB (yerel veya Atlas)
- Web tarayıcısı

### Backend Kurulumu

```bash
# Proje klasörüne git
cd /Applications/XAMPP/xamppfiles/htdocs/projeler/NODEJS

# Bağımlılıkları yükle
npm install

# .env dosyasını yapılandır (örnek dosyadan kopyalanabilir)
cp .env.example .env

# Geliştirme sunucusunu başlat
npm run dev
```

### Frontend Kurulumu

```bash
# Frontend klasörüne git
cd /Applications/XAMPP/xamppfiles/htdocs/projeler/NODEJS/client

# Bağımlılıkları yükle
npm install

# .env dosyasını yapılandır
echo "REACT_APP_API_URL=http://localhost:5001" > .env

# Geliştirme sunucusunu başlat
npm start
```

## 🧩 Proje Yapısı

```
/
├── client/                     # React frontend
│   ├── public/                 # Statik dosyalar
│   └── src/                    # Kaynak kodu
│       ├── assets/             # Resimler ve diğer varlıklar
│       ├── components/         # Yeniden kullanılabilir bileşenler
│       ├── context/            # React context'leri
│       ├── pages/              # Ana sayfalar
│       └── utils/              # Yardımcı fonksiyonlar ve API servisleri
│
├── public/                     # Sunulacak statik dosyalar
│   └── avatars/                # Kullanıcı avatarları
│
├── src/                        # Node.js backend
│   ├── config/                 # Yapılandırma dosyaları
│   ├── controllers/            # API denetleyicileri
│   ├── middleware/             # Express ara yazılımı
│   ├── models/                 # Mongoose modelleri
│   ├── routes/                 # API rotaları
│   ├── scripts/                # Yardımcı scriptler
│   ├── services/               # İş mantığı servisleri
│   ├── utils/                  # Yardımcı fonksiyonlar
│   └── server.js               # Ana sunucu dosyası
└── package.json                # Proje bağımlılıkları
```

## 🌐 Ortam Değişkenleri

### Backend (.env)

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/quizci
JWT_SECRET=gizli_anahtar
NODE_ENV=development
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5001
```

## 📊 API Endpointleri

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Quiz İşlemleri
- `GET /api/quizzes` - Tüm quizleri listele
- `POST /api/quizzes` - Yeni quiz oluştur
- `GET /api/quizzes/:id` - Quiz detaylarını görüntüle
- `PUT /api/quizzes/:id` - Quiz güncelle
- `DELETE /api/quizzes/:id` - Quiz sil

### Oturum İşlemleri
- `POST /api/sessions/create` - Yeni oturum oluştur
- `POST /api/sessions/:pin/join` - Oturuma katıl
- `GET /api/sessions/:id` - Oturum bilgilerini görüntüle

### Avatar İşlemleri
- `GET /api/avatars/categories` - Avatar kategorilerini listele
- `GET /api/avatars/category/:category` - Kategori bazında avatarları listele

### Admin İşlemleri
- `GET /api/admin/users` - Tüm kullanıcıları listele
- `PATCH /api/admin/users/:id/role` - Kullanıcı rolünü güncelle
- `DELETE /api/admin/users/:id` - Kullanıcıyı sil
- `POST /api/admin/avatars` - Yeni avatar yükle
- `DELETE /api/admin/avatars` - Avatar sil

## 👥 Kullanıcı Rolleri

- **Admin:** Tüm sistemi yönetme yetkisi
- **Üye:** Quiz oluşturma ve yönetme yetkisi
- **Misafir:** Sadece quiz oturumlarına katılma yetkisi

## 🔌 Socket.io Olayları

### Sunucu Olayları
- `join-room` - Bir odaya katılma
- `leave-room` - Odadan ayrılma
- `start-quiz` - Quiz oturumunu başlatma
- `next-question` - Sonraki soruya geçme
- `submit-answer` - Cevap gönderme
- `end-quiz` - Quiz oturumunu sonlandırma

### İstemci Olayları
- `user-joined` - Yeni kullanıcı katıldı
- `user-left` - Kullanıcı ayrıldı
- `participants:update` - Katılımcı listesi güncellendi
- `quiz:start` - Quiz oturumu başlatıldı
- `question:new` - Yeni soru gösterildi
- `question:timer` - Soru süresi güncellendi
- `question:results` - Soru sonuçları paylaşıldı
- `quiz:end` - Quiz oturumu sonlandırıldı
- `leaderboard:update` - Skor tablosu güncellendi

## 🔒 Güvenlik Önlemleri

- JWT tabanlı kimlik doğrulama
- Şifrelenmiş kullanıcı şifreleri (bcrypt)
- CORS koruması
- Rol tabanlı erişim kontrolü

## 🤝 Katkıda Bulunma

Bu projeye katkıda bulunmak için:

1. Projeyi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📜 Lisans

Bu proje [ISC Lisansı](LICENSE) altında lisanslanmıştır.
