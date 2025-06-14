import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService, AudioService, AvatarService } from '../utils/api';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    defaultQuestionPoints: 100,
    defaultQuestionDuration: 30,
    avatarCategory: 'hayvanlar',
    music: '',
    isTemplate: false,
    coverImage: ''
  });
  
  const [musicOptions, setMusicOptions] = useState([]);
  const [avatarCategories, setAvatarCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Müzik seçeneklerini yükle
  useEffect(() => {
    const loadMusicOptions = async () => {
      try {
        const response = await AudioService.getMusic();
        setMusicOptions(response.data.music || []);
      } catch (err) {
        console.error('Müzikler yüklenemedi:', err);
      }
    };
    
    const loadAvatarCategories = async () => {
      try {
        const response = await AvatarService.getCategories();
        console.log('Avatar kategorileri yüklendi:', response.data);
        if (response.data && response.data.categories) {
          setAvatarCategories(response.data.categories);
        }
      } catch (err) {
        console.error('Avatar kategorileri yüklenemedi:', err);
      }
    };
    
    loadMusicOptions();
    loadAvatarCategories();
  }, []);
  
  // Form alanlarını güncelle
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Resim yükleme işlemi
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        coverImage: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };
  
  // Form gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Temel doğrulama
    if (!formData.title.trim()) {
      setError('Quiz başlığı gereklidir');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    // Backend ile uyumlu olacak şekilde veri hazırlığı
    // Backend sadece belirli alanları alıyor
    const quizDataToSubmit = {
      title: formData.title,
      defaultQuestionDuration: formData.defaultQuestionDuration,
      defaultQuestionPoints: formData.defaultQuestionPoints,
      duration: formData.defaultQuestionDuration, // Eski API uyumluluğu için
      avatarCategory: formData.avatarCategory,
      music: formData.music,
      isTemplate: formData.isTemplate,
      coverImage: formData.coverImage // Kapak resmi
    };
    
    // Sunucuya gönderilecek veriyi konsola yazdırıyoruz
    console.log('Gönderilecek quiz verileri:', {
      ...quizDataToSubmit,
      coverImageVar: formData.coverImage ? 'Mevcut (base64)' : 'Yok',
    });
    
    try {
      const response = await QuizService.createQuiz(quizDataToSubmit);
      
      console.log('Quiz oluşturma yanıtı:', response.data); // Yanıtı görelim
      
      // Quiz ID'yi doğru şekilde alalım
      const quizId = response.data._id || (response.data.quiz && response.data.quiz._id);
      
      if (!quizId) {
        console.error('Quiz ID bulunamadı:', response.data);
        setError('Quiz oluşturuldu ama yönlendirme için ID bulunamadı.');
        return;
      }
      
      setMessage('Quiz başarıyla oluşturuldu!');
      
      // Soruları düzenlemek için quiz detay sayfasına yönlendir
      setTimeout(() => {
        navigate(`/quiz/${quizId}`);
      }, 1500);
    } catch (err) {
      console.error('Quiz oluşturma hatası:', err);
      setError(err.response?.data?.message || 'Quiz oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary mb-8">Yeni Quiz Oluştur</h1>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-700">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="card">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Başlığı*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Quiz başlığını girin"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-2">
              <label htmlFor="defaultQuestionDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Soru Başına Süre (saniye)
              </label>
              <input
                type="number"
                id="defaultQuestionDuration"
                name="defaultQuestionDuration"
                value={formData.defaultQuestionDuration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="5"
                max="120"
              />
              <p className="mt-1 text-xs text-gray-500">
                Her bir soru için katılımcılara verilecek süre (5-120 saniye)
              </p>
            </div>
            
            <div className="mb-2">
              <label htmlFor="defaultQuestionPoints" className="block text-sm font-medium text-gray-700 mb-2">
                Soru Başına Puan
              </label>
              <input
                type="number"
                id="defaultQuestionPoints"
                name="defaultQuestionPoints"
                value={formData.defaultQuestionPoints}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Her bir soru için doğru cevaba verilecek puan
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="avatarCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Kategorisi
            </label>
            <select
              id="avatarCategory"
              name="avatarCategory"
              value={formData.avatarCategory}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {avatarCategories.length > 0 ? (
                avatarCategories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.displayName || category.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="default">Varsayılan</option>
                  <option value="hayvanlar">Hayvanlar</option>
                  <option value="emojiler">Emojiler</option>
                  <option value="karakterler">Karakterler</option>
                </>
              )}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Katılımcıların seçebileceği avatarların kategorisi
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="music" className="block text-sm font-medium text-gray-700 mb-2">
              Arka Plan Müziği
            </label>
            <select
              id="music"
              name="music"
              value={formData.music}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Müzik Yok</option>
              {musicOptions.map(music => (
                <option key={music.id} value={music.path}>
                  {music.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Kapak Fotoğrafı
            </label>
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                id="coverImage"
                name="coverImageUpload"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                accept="image/*"
              />
              {formData.coverImage && (
                <div className="mt-3 border rounded-md p-2">
                  <img
                    src={formData.coverImage}
                    alt="Kapak görseli önizleme"
                    className="w-full max-h-40 rounded-md object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4 flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="isTemplate"
                name="isTemplate"
                checked={formData.isTemplate}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="isTemplate" className="text-sm font-medium text-gray-700">
                Şablon olarak ekle
              </label>
              <p className="text-xs text-gray-500">
                Bu quiz'i şablon olarak eklemek, diğer kullanıcıların kopyalayıp kullanabilmesini sağlar
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-gray-300 text-gray-800 hover:bg-gray-400 px-4 py-2 rounded-md transition-colors duration-200"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Oluşturuluyor...' : 'Quiz Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;
