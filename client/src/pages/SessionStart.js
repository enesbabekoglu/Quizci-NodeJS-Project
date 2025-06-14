import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionService, QuizService } from '../utils/api';
import { FiArrowLeft, FiPlay } from 'react-icons/fi';

const SessionStart = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  // İlk girişte token kontrolü yap
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Token yoksa test tokenı ekle (sadece geliştirme aşamasında)
      const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MjYzYjBiMGQxODE4MzAwMTViZDQ5ZDAiLCJpYXQiOjE2MjY3ODAyMDAsImV4cCI6MTY4NzQxNzYwMH0.Kp0YH-vKafDSgFBCSGKeJtYQcSYvJK5xKnK2GNmVvHE";
      localStorage.setItem('token', testToken);
      console.log('Test token eklendi');
    }
  }, []);
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);

  // Quiz detaylarını getir
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError(null); // Her yeni istek için hata durumunu sıfırla
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token bulunamadı');
          setError('Oturum açılmamış. Lütfen giriş yapın.');
          setLoading(false);
          return;
        }
        
        console.log('QuizID:', quizId);
        console.log('Token:', token ? `${token.substring(0, 15)}...` : 'yok');
        
        const response = await QuizService.getQuiz(quizId);
        console.log('Quiz API yanıtı:', response);
        
        if (response && response.data) {
          console.log('API verisi:', JSON.stringify(response.data, null, 2));
          
          // Daha detaylı kontroller ekleyelim
          console.log('QUIZ DATA YAPISI:');
          console.log('- creator:', response.data.creator);
          console.log('- createdBy:', response.data.createdBy);
          console.log('- user:', response.data.user);
          console.log('- author:', response.data.author);
          console.log('- category:', response.data.category);
          console.log('- createdAt:', response.data.createdAt);
          console.log('- description:', response.data.description);
          console.log('- TİMER:', response.data.timer);
          console.log('- SETTINGS:', response.data.settings);
          console.log('- GAME PROPS:', response.data.gameProps);
          
          // Quiz alt nesnesi varsa onu da kontrol edelim
          if (response.data.quiz) {
            console.log('- QUIZ ALT NESNE:');
            console.log('  - creator:', response.data.quiz.creator);
            console.log('  - createdBy:', response.data.quiz.createdBy);
            console.log('  - user:', response.data.quiz.user);
            console.log('  - author:', response.data.quiz.author);
            console.log('  - category:', response.data.quiz.category);
            console.log('  - createdAt:', response.data.quiz.createdAt);
            console.log('  - description:', response.data.quiz.description);
          }
          
          // API yanıtında quiz alt nesnesi varsa birleştirelim, yoksa olduğu gibi kullanalım
          if (response.data.quiz) {
            // Quiz alt nesnesi ile ana veriyi birleştir
            const mergedData = {
              ...response.data,
              ...response.data.quiz,
              // Alt nesnede olmayan ana nesnedeki bilgileri koru
              creator: response.data.quiz.creator || response.data.creator,
              createdBy: response.data.quiz.createdBy || response.data.createdBy,
              user: response.data.quiz.user || response.data.user,
              author: response.data.quiz.author || response.data.author,
              category: response.data.quiz.category || response.data.category,
              createdAt: response.data.quiz.createdAt || response.data.createdAt,
              description: response.data.quiz.description || response.data.description
            };
            console.log('Birleştirilmiş veri kullanılıyor:', mergedData);
            setQuizData(mergedData);
          } else {
            setQuizData(response.data);
          }
        } else {
          console.error('Quiz yanıtında veri yok');
          setError('Quiz bilgileri alınamadı');
        }
      } catch (err) {
        console.error('Quiz verisi alınırken hata:', err);
        console.error('Hata detayları:', JSON.stringify(err.response || err.message, null, 2));
        
        if (err.response?.status === 401) {
          setError('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
        } else {
          setError(`Quiz bilgileri yüklenirken bir hata oluştu: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);
  
  // Canlı oturumu başlat
  const startLiveSession = async () => {
    try {
      // Token kontrolü
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Oturum açılmamış: Token bulunamadı');
        setError('Oturum açılmamış. Lütfen giriş yapın.');
        return;
      }
      
      setCreatingSession(true);
      console.log('Oturum başlatma isteği gönderiliyor:', quizId);
      
      const response = await SessionService.startSession(quizId);
      
      console.log('API yanıtı:', JSON.stringify(response.data, null, 2));
      
      // Yanıtta session bilgisi veya direkt mesaj + session objesi kontrolü
      if (response && response.data) {
        // Yanıt formatını kontrol et
        let sessionId;
        let pin;
        
        if (response.data.sessionId) {
          // Eski format
          sessionId = response.data.sessionId;
          pin = response.data.pin;
          console.log('Eski format yanıt:', {sessionId, pin});
        } 
        else if (response.data.session && response.data.session._id) {
          // Yeni format: { message: "...", session: { _id: "...", pin: "..." } }
          sessionId = response.data.session._id;
          pin = response.data.session.pin;
          console.log('Yeni format yanıt:', {sessionId, pin});
        }
        
        if (sessionId) {
          console.log('Oturum başarıyla başlatıldı. Session ID:', sessionId);
          
          // Oturum bilgilerini aktif oturum olarak hafızaya kaydet
          localStorage.setItem('quizci_session', JSON.stringify({
            sessionId: sessionId,
            pin: pin,
            isHost: true,
            quizId
          }));
          
          // Oturum geçmişini kaydet (Dashboard için)
          const sessionData = {
            _id: sessionId,
            pin: pin,
            startedAt: new Date().toISOString(),
            status: 'waiting', // Başlangıçta bekleme durumunda
            participants: [], // Başlangıçta boş katılımcı listesi
            currentQuestion: -1,
            quizId: quizId,
            // Quiz bilgilerini ekle (varsa)
            quiz: quizData ? {
              _id: quizData._id,
              title: quizData.title,
              questions: quizData.questions || []
            } : null
          };
          
          // Yerel depolamaya kaydet
          SessionService.saveSession(sessionData);
          console.log('Oturum yerel depolamaya kaydedildi:', sessionData);
          
          // Canlı oturum sayfasına yönlendir
          navigate(`/session/${sessionId}`);
          return; // Başarılı durumda fonksiyonu sonlandır
        }
      }
      
      // Buraya kadar geldiyse yanıt doğru şekilde işlenememiş demektir
      console.error('Oturum yanıtında gerekli alanlar eksik veya format hatalı:', response?.data);
      setError('Oturum başlatılırken bir hata oluştu');
      setCreatingSession(false);
    } catch (err) {
      console.error('Oturum başlatma hatası:', err);
      
      if (err.response?.status === 401) {
        setError('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
      } else if (err.response?.data?.message) {
        setError(`Oturum hatası: ${err.response.data.message}`);
      } else {
        setError('Oturum başlatılırken bir hata oluştu');
      }
      
      setCreatingSession(false);
    }
  };

  // Yükleme durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-6 max-w-sm w-full flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Quiz bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-center mt-2 text-lg font-semibold">Hata</p>
          </div>
          <p className="text-gray-700 text-center mb-4">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Kontrol Paneline Dön
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Geri Dön Butonu */}
        <div className="mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="mr-1" /> Geri Dön
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Quiz Başlığı */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">{quizData?.title || 'Quiz Oturumu'}</h1>
          </div>

          {/* Quiz Bilgileri */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-white shadow-md rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-4">Quiz Detayları</h2>
                
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Soru Sayısı:</span> 
                    {quizData?.questions?.length || 0}
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Oluşturan:</span> 
                    {quizData?.creator?.username || quizData?.createdBy?.username || quizData?.author || quizData?.user?.username || 'Bilinmiyor'}
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Kategori:</span> 
                    {quizData?.category || quizData?.gameProps?.category || quizData?.settings?.category || 'Genel'}
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Oluşturulma:</span> 
                    {quizData?.createdAt ? new Date(quizData.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Açıklama:</span> 
                    {quizData?.description || quizData?.gameProps?.description || '-'}
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-700">Oyun Ayarları</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Soru Başına Puan:</span> 
                    {quizData?.pointsPerQuestion || quizData?.defaultQuestionPoints || quizData?.gameProps?.pointsPerQuestion || quizData?.settings?.pointsPerQuestion || 10} puan
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Soru Süresi:</span> 
                    {quizData?.timer || quizData?.defaultQuestionDuration || quizData?.gameProps?.timer || quizData?.timePerQuestion || quizData?.settings?.timePerQuestion || 30} saniye
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Soru Tipi:</span> 
                    {
                      (quizData?.type || quizData?.gameProps?.type || quizData?.settings?.type) ? (
                        (quizData?.type || quizData?.gameProps?.type || quizData?.settings?.type) === 'multiple_choice' ? 'Çoktan Seçmeli' : 
                        (quizData?.type || quizData?.gameProps?.type || quizData?.settings?.type) === 'true_false' ? 'Doğru/Yanlış' : 
                        quizData?.type || quizData?.gameProps?.type || quizData?.settings?.type
                      ) : 'Çoktan Seçmeli'
                    }
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium mr-2">Zorluk:</span> 
                    {quizData?.difficulty || quizData?.gameProps?.difficulty || quizData?.settings?.difficulty || 'Normal'}
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-700">
                <span className="font-bold">Not:</span> Oturumu başlattığınızda, katılımcılar için bir PIN kodu ve QR kod oluşturulacaktır.
                Katılımcılar bu PIN kodunu veya QR kodu kullanarak oturuma katılabileceklerdir.
              </p>
            </div>

            {/* Butonlar */}
            <div className="flex flex-col space-y-4 mt-8">
              <button
                onClick={startLiveSession}
                disabled={creatingSession}
                className={`bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg shadow-md transition duration-300 flex items-center justify-center ${creatingSession ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {creatingSession ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-3"></div>
                    Oturum Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Oturumu Başlat
                  </>
                )}
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                İptal Et
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStart;
