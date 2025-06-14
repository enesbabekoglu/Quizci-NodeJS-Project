import axios from 'axios';

// API URL'yi çevre değişkeninden alma veya varsayılan olarak 5001 portunu kullanma
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001'; // Port 5001 olarak güncellendi
const API_PORT = process.env.REACT_APP_API_PORT || '5001';

// API temel URL'si
const API_BASE_URL = `${API_URL}/api`;

console.log(`API bağlantısı: ${API_BASE_URL}`);

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 saniye zaman aşımı
});

// İstek göndermeden önce token kontrolü
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
    console.log(`API İstem Yapılıyor: ${config.method.toUpperCase()} ${config.url}`, 'Token: Var');
  } else {
    console.warn(`API İstem Yapılıyor: ${config.method.toUpperCase()} ${config.url}`, 'Token: YOK!');
  }
  return config;
}, error => {
  console.error('API istek hatası:', error);
  return Promise.reject(error);
});

// Yanıt interceptor'u
API.interceptors.response.use(
  response => {
    console.log(`API Yanıt: ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  error => {
    if (error.response) {
      console.error(
        `API Hata: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        `Durum: ${error.response.status}`,
        error.response.data
      );
      
      // Token süresi dolduysa kullanıcıyı login sayfasına yönlendirebiliriz
      if (error.response.status === 401) {
        console.warn('Yetkilendirme hatası, token geçersiz veya süresi dolmuş olabilir');
      }
    } else if (error.request) {
      console.error('API yanıt vermedi:', error.request);
    } else {
      console.error('API istek hatası:', error.message);
    }
    return Promise.reject(error);
  }
);

// Kimlik doğrulama servisleri
export const AuthService = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials),
  getCurrentUser: () => API.get('/auth/me')
};

// Quiz servisleri
export const QuizService = {
  createQuiz: (quizData) => API.post('/quizzes', quizData),
  getQuizzes: () => API.get('/quizzes'),
  getQuiz: (id) => API.get(`/quizzes/${id}`),
  updateQuiz: (quizId, quizData) => {
    console.log(`Quiz ${quizId} güncelleniyor:`, quizData);
    
    // Sayısal alanların doğru formatını sağlayalım
    const formattedData = {
      ...quizData,
      defaultQuestionDuration: Number(quizData.defaultQuestionDuration) || 30,
      defaultQuestionPoints: Number(quizData.defaultQuestionPoints) || 100
    };
    
    console.log('Formatı düzenlenmiş quiz verileri:', formattedData);
    
    return API.put(`/quizzes/${quizId}`, formattedData)
      .then(response => {
        console.log('Quiz güncelleme başarılı:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Quiz güncelleme hatası:', error.response?.data || error.message);
        throw error;
      });
  },
  addQuestion: (quizId, questionData) => {
    // Formatı dönüştür
    const { answers, questionText, duration, points, image, ...rest } = questionData;
    
    // Backend için doğru formatı hazırla
    const correctIndex = answers.findIndex(answer => answer.isCorrect);
    const options = answers.map(answer => answer.text).filter(text => text.trim() !== '');
    
    // Süre ve puanı sayısal formata çevir
    const numericDuration = parseInt(duration) || 30;
    const numericPoints = parseInt(points) || 100;
    const imageUrl = image || '';
    
    console.log('Orijinal değerler:', { duration, points, image });
    console.log('Dönüştürülen değerler:', { numericDuration, numericPoints, imageUrl });
    
    const formattedData = {
      questionText,
      options,
      correctIndex,
      // Süre, puan ve görsel değerlerini sayısal formatta gönder
      duration: numericDuration,
      points: numericPoints,
      image: imageUrl
    };
    
    console.log('Soru ekleme istemi:', quizId, JSON.stringify(formattedData, null, 2));
    
    return API.post(`/questions/${quizId}`, formattedData)
      .then(response => {
        console.log('Soru ekleme başarılı:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Soru ekleme hatası:', error.response?.data || error.message);
        throw error;
      });
  },
  updateQuestion: (quizId, questionId, questionData) => {
    // Formatı dönüştür
    const { answers, questionText, duration, points, image, ...rest } = questionData;
    
    console.log('API - Soru güncelleme için alınan değerler:', { 
      duration, 
      durationType: typeof duration, 
      points, 
      pointsType: typeof points, 
      image 
    });
    
    // Backend için doğru formatı hazırla
    const correctIndex = answers.findIndex(answer => answer.isCorrect);
    const options = answers.map(answer => answer.text).filter(text => text.trim() !== '');
    
    // Number constructor ile sayısal değerlere çevir (parseInt yerine)
    const numericDuration = Number(duration) || 30;
    const numericPoints = Number(points) || 100;
    const imageUrl = image || '';
    
    console.log('API - Orijinal değerler:', { duration, points, image });
    console.log('API - Dönüştürülen değerler:', { 
      numericDuration, 
      numericDurationType: typeof numericDuration,
      numericPoints, 
      numericPointsType: typeof numericPoints,
      imageUrl 
    });
    
    const formattedData = {
      questionText,
      options,
      correctIndex,
      // Süre, puan ve görsel değerlerini sayısal formatta gönder
      duration: numericDuration,
      points: numericPoints,
      image: imageUrl
    };
    
    console.log('Soru güncelleme istemi:', questionId, JSON.stringify(formattedData, null, 2));
    
    // quizId parametresini hem URL'de hem de gövdede gönderelim
    return API.put(`/questions/${questionId}`, {
      ...formattedData,
      quizId // quizId'yi de gönderelim ki backend'de doğrulayabilelim
    })
      .then(response => {
        console.log('Soru güncelleme başarılı:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Soru güncelleme hatası:', error.response?.data || error.message);
        throw error;
      });
  },
  deleteQuestion: (quizId, questionId) => API.delete(`/questions/${questionId}`),
  deleteQuiz: (quizId) => {
    console.log(`Quiz silme isteği gönderiliyor: ${quizId}`);
    return API.delete(`/quizzes/${quizId}`)
      .then(response => {
        console.log('Quiz silme başarılı:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Quiz silme hatası:', error.response?.data || error.message);
        throw error;
      });
  }
};

// Soru servisleri
export const QuestionService = {
  createQuestion: (quizId, questionData) => API.post(`/questions/${quizId}`, questionData),
  getQuestions: (quizId) => API.get(`/questions/${quizId}`),
  updateQuestion: (questionId, questionData) => API.put(`/questions/${questionId}`, questionData),
  deleteQuestion: (questionId) => API.delete(`/questions/${questionId}`)
};

// Oturum servisleri
export const SessionService = {
  startSession: (quizId) => API.post(`/sessions/start/${quizId}`),
  // Farklı endpoint varyasyonlarını deniyoruz
  checkSession: (pin) => API.get(`/sessions/status/${pin}`),
  joinSession: (pin, participant) => {
    console.log(`${pin} pin kodlu oturuma katılınıyor:`, participant);
    
    // Backend'de doğru format:  
    // - backend router: app.use('/api/sessions', sessionRoutes)
    // - controller: router.post('/:pin/join', sessionController.joinSession);
    // Dolayısıyla tam endpoint: /api/sessions/636085/join
    
    // Daha detaylı loglama yapalım
    console.log(`Oturuma katılma isteği gönderiliyor: ${pin} => /sessions/${pin}/join`);
    console.log('Gönderilen data:', JSON.stringify(participant));
    console.log('Avatar tipi:', typeof participant.avatar);
    console.log('Avatar değeri:', participant.avatar);
    console.log('Nickname değeri:', participant.nickname);
    
    // Bu durumda axios baseURL="http://localhost:5001/api" olduğu için
    // endpoint olarak /sessions/:pin/join kullanılmalı
    return API.post(`/sessions/${pin}/join`, participant);
  },
  getSession: (sessionId) => API.get(`/sessions/${sessionId}`),
  endSession: (sessionId) => API.post(`/sessions/end/${sessionId}`),
  getAvatars: (category) => API.get(`/avatars/${category}`),
  
  // Yerel depolama kullanımı için yardımcı fonksiyonlar
  saveSession: (session) => {
    try {
      // Var olan oturum listesini al
      const existingSessions = SessionService.getLocalSessions();
      
      // Yeni oturumun ID'si zaten listede var mı kontrol et
      const sessionExists = existingSessions.some(s => s._id === session._id);
      
      if (!sessionExists) {
        // Yeni oturumu listeye ekle
        existingSessions.unshift(session); // Başa ekle (en yeni en üstte)
        
        // En fazla 20 oturum sakla
        const limitedSessions = existingSessions.slice(0, 20);
        
        // Yerel depolamada güncelle
        localStorage.setItem('quizci_user_sessions', JSON.stringify(limitedSessions));
      }
      
      return true;
    } catch (err) {
      console.error('Oturum kaydedilemedi:', err);
      return false;
    }
  },
  
  getLocalSessions: () => {
    try {
      const sessionsJson = localStorage.getItem('quizci_user_sessions');
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (err) {
      console.error('Yerel oturumlar alınırken hata:', err);
      return [];
    }
  },
  
  clearLocalSessions: () => {
    localStorage.removeItem('quizci_user_sessions');
  }
};

// Ses ve müzik servisleri
export const AudioService = {
  getMusic: () => API.get('/audio/music'),
  getSounds: () => API.get('/audio/sounds')
};

// Avatar servisleri
export const AvatarService = {
  // Avatar kategorileri
  getCategories: () => {
    console.log('Avatar kategorileri getiriliyor');
    
    try {
      // Önce MongoDB'den kategorileri çekmeyi dene
      // Auth gerektirmeyen endpoint olmadığı için auth gerektiren endpoint önce denenebilir
      return API.get('/avatars/categories');
    } catch (error) {
      console.error('MongoDB\'den kategorileri çekme hatası:', error);
      console.log('Kategori verileri yerel olarak döndürülüyor...');
      
      // MongoDB'den çekemediyse yerel verileri kullan
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              categories: [
                { id: "1", name: "hayvanlar", displayName: "Hayvanlar" },
                { id: "2", name: "karakterler", displayName: "Karakterler" },
                { id: "3", name: "emojiler", displayName: "Emojiler" }
              ]
            }
          });
        }, 500);
      });
    }
  },
  createCategory: (categoryData) => API.post('/avatars/categories', categoryData),
  
  // Avatar işlemleri
  getAvatarsByCategory: async (category) => {
    console.log(category + ' kategorisindeki avatarlar getiriliyor');
    
    // Kategori eşleştirme tablosu - backend-frontend uyumu
    const categoryMappings = {
      'hayvanlar': 'animals',
      'meyveler': 'fruits',
      'yiyecekler': 'foods',
      // Ters eşleştirme - backend kategorilerinin frontend klasörlerine eşleşmesi
      'animals': 'animals',
      'fruits': 'fruits',
      'foods': 'foods',
    };
    
    // Gerçek yerel dosya yollarını kullan
    // Frontend klasör yapısı için kategoriyi eşleştir
    let actualCategory = categoryMappings[category] || category;
    
    try {
      // Önce MongoDB'den avatarları çekmeyi dene
      console.log(`MongoDB'den ${category} kategorisindeki avatarlar getiriliyor`);
      // Public endpointi kullan - JWT token gerektirmeyen
      // Kategoriyi backend'in beklediği formata dönüştür (Türkçe -> İngilizce)
      const backendCategory = categoryMappings[category] || category;
      console.log(`Backend kategori adı: ${backendCategory}`);
      // Limit=1000 ekleyerek bütün avatarları getir
      const response = await API.get(`/avatars/public/category/${backendCategory}?limit=1000`);
      
      // MongoDB'den başarılı yanıt alındıysa doğrudan döndür
      if (response.data && response.data.avatars && response.data.avatars.length > 0) {
        console.log(`MongoDB'den ${response.data.avatars.length} avatar başarıyla yüklendi`);
        
        // Her avatar için filePath'i düzelt
        const processedAvatars = response.data.avatars.map(avatar => {
          // Eğer filePath yoksa oluştur
          if (!avatar.filePath) {
            avatar.filePath = `/uploads/avatars/${category}/${avatar.name}`;
          }
          return avatar;
        });
        
        return {
          data: {
            avatars: processedAvatars,
            success: true,
            message: 'Avatarlar MongoDB\'den başarıyla yüklendi'
          }
        };
      } else {
        throw new Error('MongoDB\'de avatar bulunamadı');
      }
    } catch (error) {
      console.error('MongoDB\'den avatar yükleme hatası:', error);
      console.log('Yerel dosya sistemine geçiliyor...');
      
      // MongoDB'den çekemediyse yerel dosyalardan devam et
      // HTML5 fetch ile yerel dosyaları listelemek doğrudan mümkün olmadığı için
      // mock veri kullanarak yapıyoruz, ancak gerçek dosya yollarını kullanacağız
      const createAvatarFromFileName = (fileName, category) => {
        // Dosya adından avatar ismi oluştur
        const nameParts = fileName.split('_');
        // displayName için ilk kısmı al ve büyük harfle başlat
        const displayName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
        
        return {
          id: fileName.replace('.jpeg', ''),
          name: fileName,
          displayName: displayName,
          category: category,
          filePath: `/avatars/${actualCategory}/${fileName}` // Yerel dosya yolu
        };
      };
      
      // Kategoriye göre dosya listesi
      const fileListByCategory = {
        animals: [
          'alpaca_b8729848.jpeg', 'bear_0e24a4ad.jpeg', 'beaver_ff0a897f.jpeg',
          'bee_534b6c72.jpeg', 'butterfly_adda3113.jpeg', 'calf_59ef8f25.jpeg',
          'cat_e3980238.jpeg', 'chameleon_427a486d.jpeg', 'dog_8e58d0e2.jpeg',
          'fox_fcfb1cba.jpeg', 'frog_c4cd563d.jpeg', 'owl_303c16ba.jpeg',
          'panda_ad4a2cdc.jpeg', 'rabbit_cb507be4.jpeg'
        ],
        fruits: [
          'apple_91509a56.jpeg', 'avocado_41114a48.jpeg', 'banana_2a02232c.jpeg',
          'strawberry_d8854dc0.jpeg', 'watermelon_3a260629.jpeg', 'orange_4f2473af.jpeg',
          'kiwi_c0e0a2ba.jpeg', 'grape_980e8d3f.jpeg'
        ],
        foods: [
          'pizza_8d0f0a97.jpeg', 'sandwich_3dfd31e5.jpeg', 'taco_f402ff89.jpeg',
          'waffle_afcdfc34.jpeg', 'cookie_72a90303.jpeg', 'donut_669f1bef.jpeg'
        ],
        default: [
          'cat_e3980238.jpeg', 'dog_8e58d0e2.jpeg', 'pizza_8d0f0a97.jpeg',
          'apple_91509a56.jpeg'
        ]
      };
      
      return new Promise(resolve => {
        setTimeout(() => {
          // Kategoriye göre dosya listesini al veya varsayılanı kullan
          const fileList = fileListByCategory[actualCategory] || fileListByCategory.default;
          
          // Dosya listesinden avatar nesneleri oluştur
          const avatars = fileList.map(fileName => 
            createAvatarFromFileName(fileName, actualCategory)
          );
          
          console.log('Yerel avatarlar yükleniyor:', avatars.length);
          
          resolve({
            data: {
              avatars: avatars,
              success: true,
              message: 'Avatarlar başarıyla yüklendi'
            }
          });
        }, 200);
      });
    }
  },
  getAvatarsByQuizId: (quizId) => {
    console.log(`${quizId} ID'li quiz için avatarlar getiriliyor`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            avatars: [
              { id: "a1", name: "Kedi", imageUrl: "https://i.pravatar.cc/150?img=1", category: "hayvanlar" },
              { id: "a2", name: "Köpek", imageUrl: "https://i.pravatar.cc/150?img=2", category: "hayvanlar" },
              { id: "a3", name: "Penguen", imageUrl: "https://i.pravatar.cc/150?img=3", category: "hayvanlar" },
              { id: "a4", name: "Aslan", imageUrl: "https://i.pravatar.cc/150?img=4", category: "hayvanlar" }
            ]
          }
        });
      }, 800);
    });
  },
  uploadAvatar: (formData) => {
    console.log('Avatar yükleniyor', formData);
    // MongoDB'ye avatar yükleme işlemi
    return API.post('/avatars', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  uploadMultipleAvatars: (formData) => {
    console.log('Çoklu avatar yükleniyor', formData);
    // MongoDB'ye çoklu avatar yükleme işlemi
    return API.post('/avatars/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteAvatar: (id) => {
    console.log(`${id} ID'li avatar siliniyor`);
    // MongoDB'den avatar silme işlemi
    return API.delete(`/avatars/${id}`);
  }
};

