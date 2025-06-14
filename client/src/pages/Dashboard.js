import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuizService, SessionService } from '../utils/api';
import { useAuth } from '../context/AuthContext';
// Loader bileşeni olmadığı için import kaldırıldı
import Modal from '../components/Modal';
import { FiPlay, FiUsers, FiClock, FiHelpCircle } from 'react-icons/fi';
import ActiveSessionCard from '../components/ActiveSessionCard';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Aktif oturumlar için state'ler
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [sessionInterval, setSessionInterval] = useState(null);
  
  // Sayfalama için state'ler
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(10); // Sayfa başına 10 oturum göster
  
  // Modal için state'ler
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  
  // Quizleri yükle
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await QuizService.getQuizzes();
      setQuizzes(response.data.quizzes || []);
      setError('');
    } catch (err) {
      console.error('Quizler yüklenemedi:', err);
      setError('Quizler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Silme modalını aç
  const openDeleteModal = (quiz) => {
    console.log('Silme modalı açılıyor:', quiz._id);
    setQuizToDelete(quiz);
    setIsConfirmModalOpen(true);
  };
  
  // Silme modalını kapat
  const closeDeleteModal = () => {
    setIsConfirmModalOpen(false);
    setQuizToDelete(null);
  };

  // Quiz silme işlemi
  const deleteQuiz = async () => {
    if (!quizToDelete) return;
    
    try {
      console.log('Quiz siliniyor:', quizToDelete._id);
      await QuizService.deleteQuiz(quizToDelete._id);
      closeDeleteModal();
      // Başarılı silme işleminden sonra listeyi güncelle
      loadQuizzes();
    } catch (err) {
      console.error('Quiz silinemedi:', err);
      setError('Quiz silinirken bir hata oluştu.');
      closeDeleteModal();
    }
  };
  
  // Yerel depolamadan oturumları yükle
  const loadActiveSessions = () => {
    try {
      setLoadingSessions(true);
      
      // Yerel depolamadan oturumları al
      const sessions = SessionService.getLocalSessions();
      console.log('Yerel depolamadaki oturumlar:', sessions);
      
      setActiveSessions(sessions); // Zaten sıralı gelecek
      setSessionError('');
    } catch (err) {
      console.error('Oturumlar yüklenemedi:', err);
      setSessionError('Oturumlar yüklenirken bir hata oluştu.');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Sayfa yüklendiğinde quizleri ve aktif oturumları al
  useEffect(() => {
    loadQuizzes();
    loadActiveSessions();
    
    // Her 30 saniyede bir aktif oturumları güncelle
    const interval = setInterval(() => {
      loadActiveSessions();
    }, 30000);
    
    setSessionInterval(interval);
    
    // Component kaldırıldığında interval'ı temizle
    return () => clearInterval(interval);
  }, []);
  
  // Gösterilecek oturumları hesapla (sayfalama)
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = activeSessions.slice(indexOfFirstSession, indexOfLastSession);
  
  // Toplam sayfa sayısını hesapla
  const totalPages = Math.ceil(activeSessions.length / sessionsPerPage);
  
  // Sayfa değiştirme fonksiyonu
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  return (
    <div className="page-container">
      {/* Son Oturumlar Bölümü */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Son Oturumlarım</h2>
        </div>
          
          {sessionError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
              {sessionError}
            </div>
          )}
          
          {loadingSessions ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Oturumlar yükleniyor...</p>
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-md text-center">
              <p className="text-lg text-blue-700 mb-4">Henüz hiç oturum başlatmamışsınız.</p>
              <p className="text-sm text-blue-600">Quiz'lerden birini başlatarak ilk oturumunuzu oluşturun.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentSessions.map(session => (
                  <ActiveSessionCard key={session._id} session={session} />
                ))}
              </div>
              
              {/* Sayfalama */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="inline-flex rounded-md shadow-sm">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white border border-gray-300 text-sm font-medium rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`px-3 py-1 border-t border-b border-gray-300 text-sm font-medium ${
                          number === currentPage ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {number}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-white border border-gray-300 text-sm font-medium rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      
      {/* Quiz'lerim Bölümü */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Quiz'lerim</h1>
        <Link 
          to="/create"
          className="btn btn-primary"
        >
          Yeni Quiz Oluştur
        </Link>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Quizler yükleniyor...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-md text-center">
          <p className="text-lg text-blue-700 mb-4">Henüz hiç quiz oluşturmadınız.</p>
          <Link to="/create" className="btn btn-primary">
            İlk Quiz'inizi Oluşturun
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <div key={quiz._id} className="card bg-white hover:shadow-lg transition-shadow">
              <div className="relative pb-4">
                {/* Kapak resmi */}
                {quiz.coverImage ? (
                  <img 
                    src={quiz.coverImage} 
                    alt={quiz.title + " kapak görseli"}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-t-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">{quiz.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <span className="mr-2">
                      {quiz.questions?.length || 0} Soru
                    </span>
                    <span>•</span>
                    <span className="ml-2">
                      {quiz.defaultQuestionDuration} saniye/soru
                    </span>
                  </div>
                  
                  <div className="flex mt-6 space-x-2">
                    <Link
                      to={`/quiz/${quiz._id}`}
                      className="flex-1 btn btn-secondary text-center text-sm"
                    >
                      Düzenle
                    </Link>
                    <button
                      onClick={() => openDeleteModal(quiz)}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 text-sm"
                    >
                      Sil
                    </button>
                    <Link
                      to={`/session/start/${quiz._id}`}
                      className="flex-1 btn btn-primary text-center text-sm"
                    >
                      Başlat
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    
      {/* Quiz Silme Onay Modalı */}
      <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={closeDeleteModal} 
        title="Quiz Silme Onayı"
      >
        {quizToDelete && (
          <div className="p-4">
            <p className="mb-4 text-gray-700">
              <strong>"{quizToDelete.title}"</strong> isimli quizi silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz ve tüm sorular da silinecektir.
            </p>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={closeDeleteModal}
                className="bg-gray-300 text-gray-800 hover:bg-gray-400 px-4 py-2 rounded-md transition-colors duration-200"
              >
                İptal
              </button>
              <button 
                onClick={deleteQuiz}
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

export default Dashboard;
