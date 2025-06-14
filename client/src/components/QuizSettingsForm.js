import React, { useState, useEffect } from 'react';
import { AvatarService } from '../utils/api';

const QuizSettingsForm = ({ quiz, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    defaultQuestionPoints: 100,
    defaultQuestionDuration: 30,
    avatarCategory: 'hayvanlar',
    music: '',
    isTemplate: false,
    coverImage: ''
  });
  
  // Avatar kategorileri için state
  const [avatarCategories, setAvatarCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Avatar kategorilerini yükle
  useEffect(() => {
    const fetchAvatarCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await AvatarService.getCategories();
        if (response.data && response.data.categories) {
          setAvatarCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Avatar kategorileri yüklenirken hata:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchAvatarCategories();
  }, []);

  // Mevcut quiz verilerini form'a yükle
  useEffect(() => {
    if (quiz) {
      console.log('Quiz ayarları formu için gelen veriler:', quiz);
      
      setFormData({
        title: quiz.title || '',
        defaultQuestionPoints: quiz.defaultQuestionPoints || 100,
        defaultQuestionDuration: quiz.defaultQuestionDuration || 30,
        avatarCategory: quiz.avatarCategory || 'hayvanlar',
        music: quiz.music || '',
        isTemplate: quiz.isTemplate || false,
        coverImage: quiz.coverImage || ''
      });
    }
  }, [quiz]);

  // Form alanı değişikliğini izle
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`Form alanı değişti: ${name} = ${type === 'checkbox' ? checked : value}`);
    
    const newValue = type === 'checkbox' ? checked : 
                    type === 'number' ? Number(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
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

  // Formu kaydet
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Quiz ayarları kaydediliyor:', formData);
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group mb-4">
        <label htmlFor="title" className="form-label block font-medium text-gray-700 mb-1">Quiz Adı</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="defaultQuestionDuration" className="form-label">Varsayılan Soru Süresi (saniye)</label>
          <input
            type="number"
            id="defaultQuestionDuration"
            name="defaultQuestionDuration"
            value={formData.defaultQuestionDuration}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="5"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="defaultQuestionPoints" className="form-label">Varsayılan Soru Puanı</label>
          <input
            type="number"
            id="defaultQuestionPoints"
            name="defaultQuestionPoints"
            value={formData.defaultQuestionPoints}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="10"
            required
          />
        </div>
      </div>

      <div className="form-group mb-4">
        <label htmlFor="avatarCategory" className="form-label block font-medium text-gray-700 mb-1">Avatar Kategorisi</label>
        {loadingCategories ? (
          <div className="animate-pulse py-2 bg-gray-100 rounded">Yükleniyor...</div>
        ) : (
          <select
            id="avatarCategory"
            name="avatarCategory"
            value={formData.avatarCategory}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingCategories}
          >
            {avatarCategories.length > 0 ? (
              avatarCategories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.displayName || category.name}
                </option>
              ))
            ) : (
              <>
                <option value="hayvanlar">Hayvanlar</option>
                <option value="emojiler">Emojiler</option>
                <option value="meslekler">Meslekler</option>
                <option value="sporlar">Sporlar</option>
              </>
            )}
          </select>
        )}
      </div>

      <div className="form-group mb-4">
        <label htmlFor="music" className="form-label block font-medium text-gray-700 mb-1">Arka Plan Müziği</label>
        <select
          id="music"
          name="music"
          value={formData.music}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Müzik Yok</option>
          <option value="jazz">Jazz</option>
          <option value="pop">Pop</option>
          <option value="rock">Rock</option>
          <option value="klasik">Klasik</option>
        </select>
      </div>

      <div className="form-group mb-4">
        <label htmlFor="coverImage" className="form-label block font-medium text-gray-700 mb-1">Kapak Fotoğrafı</label>
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

      <div className="form-group mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            id="isTemplate"
            name="isTemplate"
            checked={formData.isTemplate}
            onChange={handleChange}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="form-label font-medium text-gray-700">Şablonlara Ekle</span>
        </label>
        <p className="text-sm text-gray-500 mt-1">
          Bu seçenek işaretlenirse, bu quiz diğer kullanıcıların şablon olarak kullanabileceği şekilde paylaşılır.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          className="btn btn-secondary"
        >
          İptal
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
        >
          Kaydet
        </button>
      </div>
    </form>
  );
};

export default QuizSettingsForm;
