import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizService, AudioService, AvatarService } from '../utils/api';
import QuestionForm from '../components/QuestionForm';
import QuizSettingsForm from '../components/QuizSettingsForm';
import Modal from '../components/Modal';

const QuizDetail = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Soru yönetimi için state'ler
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Soru silme modalı için state'ler
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  
  // Modal kontrolü için state'ler
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState(''); // 'question' veya 'settings'
  
  // Quiz ayarları için state'ler
  // Not: Bu state'ler yukarıda tanımlanmıştı
  
  // Avatar kategorileri için state'ler
  const [avatarCategories, setAvatarCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Quiz'i yükle
  const loadQuiz = async () => {
    try {
      setLoading(true);
      const response = await QuizService.getQuiz(quizId);
      console.log('Gelen Quiz Verisi:', response.data);
      console.log('Quiz içinde sorular var mı?', 
        response.data.quiz ? 
          `Evet, ${response.data.quiz.questions ? response.data.quiz.questions.length : 0} soru` : 
          `Hayır, ${response.data.questions ? response.data.questions.length : 0} soru`
      );
      
      // Quiz verisini doğru şekilde ayarla
      const quizData = response.data.quiz || response.data;
      
      // Gelen soruların süre, puan ve görsel URL değerlerini kontrol edelim
      if (quizData.questions && quizData.questions.length > 0) {
        console.log('SORU DETAYLARI KONTROLÜ:');
        quizData.questions.forEach((question, index) => {
          console.log(`Soru ${index + 1}:`, {
            id: question._id,
            duration: question.duration,
            durationType: typeof question.duration,
            points: question.points,
            pointsType: typeof question.points,
            image: question.image ? 'Var' : 'Yok'
          });
        });
      }
      
      console.log('Kullanılacak quiz verisi:', quizData);
      setQuiz(quizData);
      setError('');
    } catch (err) {
      console.error('Quiz yüklenemedi:', err);
      setError('Quiz yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Avatar kategorilerini yükle
  const loadAvatarCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await AvatarService.getCategories();
      console.log('Avatar kategorileri yüklendi:', response.data);
      if (response.data && response.data.categories) {
        setAvatarCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Avatar kategorileri yüklenirken hata:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      loadQuiz();
      // Avatar kategorilerini yükle
      loadAvatarCategories();
    }
  }, [quizId]);

  // Yeni soru ekleme modalini aç
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setModalTitle('Yeni Soru Ekle');
    setModalType('question');
    setIsModalOpen(true);
    setQuestionError('');
  };
  
  // Soru düzenleme modalini aç
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setModalTitle('Soruyu Düzenle');
    setModalType('question');
    setIsModalOpen(true);
    setQuestionError('');
  };
  
  // Modalı kapat
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Modal kapandıktan sonra form verilerini sıfırlamak için bir süre bekle
    setTimeout(() => {
      // Modal tipine göre farklı state'leri sıfırla
      if (modalType === 'question') {
        setEditingQuestion(null);
        setQuestionError('');
      } else if (modalType === 'settings') {
        setSettingsError('');
      }
      // Modal tipini sıfırla
      setModalType('');
    }, 300);
  };
  
  // Soru formunu kapat
  const handleCancelQuestion = () => {
    handleCloseModal();
  };
  
  // Quiz ayarları modalını aç
  const handleOpenSettings = () => {
    console.log('Quiz Ayarları butonu tıklandı');
    setModalType('settings');
    setModalTitle('Quiz Ayarları');
    setIsModalOpen(true);
    setSettingsError('');
    console.log('Modal durumu:', { modalType: 'settings', isModalOpen: true });
  };
  
  // Quiz ayarlarını kaydet
  const handleSaveSettings = async (settingsData) => {
    try {
      setSavingSettings(true);
      setSettingsError('');
      
      console.log('Quiz ayarları kaydediliyor (form verileri):', settingsData);
      
      // API'ye gönderilecek verileri hazırla
      const quizData = {
        title: settingsData.title,
        defaultQuestionDuration: Number(settingsData.defaultQuestionDuration),
        defaultQuestionPoints: Number(settingsData.defaultQuestionPoints),
        avatarCategory: settingsData.avatarCategory,
        music: settingsData.music,
        isTemplate: settingsData.isTemplate,
        coverImage: settingsData.coverImage
      };
      
      console.log('API endpoint:', `/api/quizzes/${quizId}`);
      console.log('API gönderilecek veriler:', quizData);
      
      const response = await QuizService.updateQuiz(quizId, quizData);
      console.log('Quiz ayarları güncellendi (sunucudan gelen yanıt):', response.data);
      
      // Sayfayı yenile
      await loadQuiz();
      handleCloseModal();
    } catch (error) {
      console.error('Quiz ayarları kaydedilemedi:', error);
      setSettingsError('Quiz ayarları kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSavingSettings(false);
    }
  };
  
  // Soru kaydet (yeni veya düzenlenen)
  const handleSaveQuestion = async (formData) => {
    try {
      setSavingQuestion(true);
      setQuestionError('');
      
      // Detaylı loglar ekleyelim
      console.log('QuizDetail - Form’dan alınan orijinal veriler:', formData);
      console.log('QuizDetail - Orijinal değerler:', {
        duration: formData.duration, 
        durationType: typeof formData.duration,
        points: formData.points,
        pointsType: typeof formData.points,
        image: formData.image
      });
      
      // Form verilerinde süre, puan ve görsel URL'nin olduğundan emin olalım
    // Number kullanalım ki ondalik sayılar doğru işlensin
    let fixedDuration = formData.duration;
    let fixedPoints = formData.points;
    
    // Sayısal dönüşümlerini güçlendirelim
    if (fixedDuration !== undefined) {
      // Önce Number ile deneyelim
      fixedDuration = Number(fixedDuration);
      if (isNaN(fixedDuration)) {
        // Başarısızsa parseInt ile deneyelim, başarısız olursa varsayılan 30 kullanalım
        fixedDuration = parseInt(formData.duration) || 30;
      }
    } else {
      fixedDuration = 30; // Varsayılan değer
    }
    
    if (fixedPoints !== undefined) {
      // Önce Number ile deneyelim
      fixedPoints = Number(fixedPoints);
      if (isNaN(fixedPoints)) {
        // Başarısızsa parseInt ile deneyelim, başarısız olursa varsayılan 100 kullanalım
        fixedPoints = parseInt(formData.points) || 100;
      }
    } else {
      fixedPoints = 100; // Varsayılan değer
    }
    
    const enhancedFormData = {
      ...formData,
      duration: fixedDuration,  // Kesinlikle sayısal olmasını sağladık
      points: fixedPoints,      // Kesinlikle sayısal olmasını sağladık
      image: formData.image || ''
    };
      
      console.log('QuizDetail - Güncellenmiş değerler:', {
        duration: enhancedFormData.duration, 
        durationType: typeof enhancedFormData.duration,
        points: enhancedFormData.points,
        pointsType: typeof enhancedFormData.points,
        image: enhancedFormData.image
      });
      
      console.log('Gönderilecek form verileri:', enhancedFormData);
      
      if (editingQuestion) {
        // Mevcut soruyu güncelle
        console.log('Soruyu güncelliyorum:', editingQuestion._id, enhancedFormData);
        await QuizService.updateQuestion(quizId, editingQuestion._id, enhancedFormData);
      } else {
        // Yeni soru ekle
        console.log('Soru ekleme için form verileri:', enhancedFormData);
        await QuizService.addQuestion(quizId, enhancedFormData);
      }
      
      // Quiz'i yeniden yükleyerek güncellenmiş soru listesini al
      const response = await QuizService.getQuiz(quizId);
      console.log('Soru kaydettikten sonra Quiz verisi:', response.data);
      setQuiz(response.data.quiz || response.data);
      
      // Modal'ı kapat
      handleCloseModal();
      
    } catch (err) {
      console.error('Soru kaydedilemedi:', err);
      setQuestionError('Soru kaydedilirken bir hata oluştu.');
    } finally {
      setSavingQuestion(false);
    }
  };
  
  // Soru silme modalını aç
  const openDeleteQuestionModal = (question) => {
    console.log('Soru silme modalı açılıyor:', question._id);
    setQuestionToDelete(question);
    setIsDeleteModalOpen(true);
  };
  
  // Soru silme modalını kapat
  const closeDeleteQuestionModal = () => {
    setIsDeleteModalOpen(false);
    setQuestionToDelete(null);
  };

  // Soru sil
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    
    try {
      console.log('Soru siliniyor:', questionToDelete._id);
      await QuizService.deleteQuestion(quizId, questionToDelete._id);
      
      // Modalı kapat
      closeDeleteQuestionModal();
      
      // Quiz'i yeniden yükleyerek güncellenmiş soru listesini al
      const response = await QuizService.getQuiz(quizId);
      console.log('Silme işleminden sonra gelen yanıt:', response.data);
      
      // Quiz verisini doğru şekilde ayarla (quiz nesnesinin konumunu kontrol et)
      const quizData = response.data.quiz || response.data;
      console.log('Silme işleminden sonra kullanılacak quiz verisi:', quizData);
      
      setQuiz(quizData);
      
    } catch (err) {
      console.error('Soru silinemedi:', err);
      setError('Soru silinirken bir hata oluştu.');
      closeDeleteQuestionModal();
    }
  };
  
  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-gray-500">Quiz yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (error || !quiz) {
    return (
      <div className="page-container">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error || 'Quiz bulunamadı.'}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
        >
          Kontrol Paneline Dön
        </button>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-secondary">{quiz.title}</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
        >
          Geri
        </button>
      </div>
      
      {/* Quiz detay bilgileri */}
      <div className="card bg-white p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kapak görseli */}
          <div className="flex justify-center items-center">
            {quiz.coverImage ? (
              <img 
                src={quiz.coverImage} 
                alt={quiz.title + " kapak görseli"}
                className="w-full max-h-64 rounded-lg shadow-md object-cover"
              />
            ) : (
              <div className="w-full h-48 rounded-lg bg-gray-200 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Quiz bilgileri */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Quiz Bilgileri</h2>
                <p className="mb-2">
                  <span className="font-medium">Soru Sayısı:</span> {quiz.questions?.length || 0}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Varsayılan Soru Süresi:</span> {quiz.defaultQuestionDuration} saniye
                </p>
                <p className="mb-2">
                  <span className="font-medium">Avatar Kategorisi:</span> {quiz.avatarCategory || 'Varsayılan'}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Müzik:</span> {quiz.music ? quiz.music : 'Yok'}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Şablon:</span> {quiz.isTemplate ? 'Evet' : 'Hayır'}
                </p>
              </div>
            
              <div>
                <h2 className="text-xl font-bold mb-4">Oturum Bilgileri</h2>
                <p className="mb-4">Oturum başlatmak için dashboard üzerinden "Başlat" butonunu kullanın.</p>
                <button
                  onClick={() => navigate(`/session/start/${quiz._id}`)}
                  className="btn btn-primary w-full md:w-auto"
                >
                  Yeni Oturum Başlat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sorular bölümü */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Sorular</h2>
          <div className="space-x-2">
            <button
              onClick={handleOpenSettings}
              className="btn btn-secondary"
            >
              Quiz Ayarları
            </button>
            <button
              onClick={handleAddQuestion}
              className="btn btn-primary"
            >
              Yeni Soru Ekle
            </button>
          </div>
        </div>
        
        {questionError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
            {questionError}
          </div>
        )}
        
        {settingsError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
            {settingsError}
          </div>
        )}
      
      {/* Soru Düzenleme/Ekleme Modalı */}
      <Modal 
        isOpen={isModalOpen} 
        title={modalTitle} 
        onClose={handleCloseModal}
      >
        {modalType === 'question' && (
          <QuestionForm 
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={handleCancelQuestion}
            isSaving={savingQuestion}
            error={questionError}
            quizId={quizId}
          />
        )}
        {modalType === 'settings' && (
          <QuizSettingsForm 
            quiz={quiz}
            onSave={handleSaveSettings}
            onCancel={handleCloseModal}
            isSaving={savingSettings}
            error={settingsError}
          />
        )}
      </Modal>
      
      {/* Soru listesi */}
      {console.log('Quiz soruları:', quiz.questions)}
      {quiz.questions && quiz.questions.length > 0 ? (
        <div className="space-y-4">
          {console.log('Sorular haritalanacak:', quiz.questions.length)}
          {quiz.questions.map((question, index) => (
            <div key={question._id} className="card bg-white hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold mb-2 flex-grow pr-4">
                    {index + 1}. {question.questionText}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteQuestionModal(question)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  {/* Puan ve süre bilgilerini kontrol ederek gösteriyoruz */}
                  <span className="mr-4">Ödül: {question.points || 100} puan</span>
                  <span>Süre: {question.duration || 30} saniye</span>
                  {question.image && (
                    <div className="mt-2">
                      <img 
                        src={question.image} 
                        alt="Soru görseli" 
                        className="mt-2 rounded-lg max-h-40 object-cover"
                        onError={(e) => {
                          console.log('Görsel yükleme hatası');
                          e.target.style.display = 'none';
                        }} 
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Backend'den sorular options dizisinde geliyor */}
                  {question.options && question.options.map((option, i) => (
                    <div 
                      key={i}
                      className={`p-2 rounded-md text-sm ${question.correctIndex === i ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}
                    >
                      {question.correctIndex === i && (
                        <span className="inline-block mr-1 text-green-600">✓</span>
                      )}
                      {option}
                    </div>
                  ))}
                  
                  {/* Eğer eski format varsa onları da destekle */}
                  {!question.options && question.answers && question.answers.map((answer, i) => (
                    <div 
                      key={i}
                      className={`p-2 rounded-md text-sm ${answer.isCorrect ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}
                    >
                      {answer.isCorrect && (
                        <span className="inline-block mr-1 text-green-600">✓</span>
                      )}
                      {answer.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-md text-center">
          <p className="text-lg text-blue-700 mb-4">Henüz soru eklenmemiş.</p>
          <button 
            onClick={handleAddQuestion}
            className="btn btn-primary"
          >
            İlk Soruyu Ekle
          </button>
        </div>
      )}
      </div>
      
      {/* Soru Silme Onay Modalı */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={closeDeleteQuestionModal} 
        title="Soru Silme Onayı"
      >
        {questionToDelete && (
          <div className="p-4">
            <p className="mb-4 text-gray-700">
              <strong>{questionToDelete.questionText?.substring(0, 50)}{questionToDelete.questionText?.length > 50 ? '...' : ''}</strong> sorusunu silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={closeDeleteQuestionModal}
                className="bg-gray-300 text-gray-800 hover:bg-gray-400 px-4 py-2 rounded-md transition-colors duration-200"
              >
                İptal
              </button>
              <button 
                onClick={handleDeleteQuestion}
                className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Sil
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuizDetail;
