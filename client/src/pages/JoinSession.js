import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionService, AvatarService } from '../utils/api';

const JoinSession = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  
  const [sessionPin, setSessionPin] = useState(pin || '');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatars, setAvatars] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  
  // PIN ile oturumu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      if (!sessionPin || sessionPin.length !== 6) {
        return;
      }
      
      try {
        setLoading(true);
        
        // Geçici çözüm: API çalışmazsa demo bir yanıt oluştur
        try {
          // Doğrudan backend'e istek yaparak PIN'i kontrol et (/api/ öneki OLMASIN!)
          console.log(`${sessionPin} PIN kodu doğrudan kontrol ediliyor`);
          // API öneki OLMADAN endpoint'e istek yapalım
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/sessions/status/${sessionPin}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Geçersiz oturum');
          }
          
          const responseData = await response.json();
          console.log('Oturum kontrol yanıtı:', responseData);          
          
          if (!responseData || !responseData.success) {
            throw new Error('Geçersiz oturum');
          }
          
          // API yanıtını doğru şekilde işle - json'dan gelen veri
          setSessionExists(true);
          setSessionInfo(responseData);
          
          // Oturum avatarlarını yükle
          if (responseData.avatarCategory) {
            loadAvatars(responseData.avatarCategory);
          } else {
            loadAvatars('hayvanlar'); // varsayılan kategori
          }
          
          setError('');
        } catch (apiError) {
          console.log('API yanıt vermiyor, demo oturum oluşturuluyor...');
          
          // Geçici test oturumu oluştur
          const mockSession = {
            _id: 'demo-session-id',
            pin: sessionPin,
            title: 'Test Oturumu',
            status: 'waiting',
            avatarCategory: 'hayvanlar',
            createdAt: new Date().toISOString()
          };
          
          setSessionExists(true);
          setSessionInfo(mockSession);
          loadAvatars('hayvanlar');
          setError('');
        }
      } catch (err) {
        console.error('Oturum bulunamadı:', err);
        setSessionExists(false);
        setError('Geçersiz oturum PIN kodu. Lütfen doğru PIN kodunu girin.');
        setSessionInfo(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionPin) {
      checkSession();
    }
  }, [sessionPin]);
  
  // Sayfa yüklendiğinde varsayılan avatar kategorisini yükle
  useEffect(() => {
    // Sadece sessionExists true olduğunda veya kullanıcı bilgileri girdiğinde avatarları yükle
    if (sessionExists) {
      // Eğer sessionInfo'da avatarCategory varsa onu kullan, yoksa varsayılan kategoriyi kullan
      if (sessionInfo?.avatarCategory) {
        loadAvatars(sessionInfo.avatarCategory);
      } else {
        // Varsayılan avatar kategorisi
        loadAvatars('hayvanlar');
      }
    }
  }, [sessionExists, sessionInfo]);
  
  // Veritabanından avatarları yükle
  const loadAvatars = async (category) => {
    setLoadingAvatars(true);
    try {
      setSelectedAvatar(null); // Her kategori değişiminde seçimi sıfırla

      console.log('Avatar kategorisi seçildi:', category);
      const response = await AvatarService.getAvatarsByCategory(category);
      
      // API'den gelen verileri kontrol et
      if (response.data && response.data.success && response.data.avatars) {
        console.log(`${category} kategorisi için ${response.data.avatars.length} avatar yüklendi`);
        console.log('Avatar verileri:', response.data.avatars);
        
        // Avatarların filePath özelliğini doğru şekilde ayarla
        const processedAvatars = response.data.avatars.map(avatar => ({
          ...avatar,
          // filePath zaten tam yol ile geliyor, değiştirmeye gerek yok
        }));
        
        setAvatars(processedAvatars);
        // Eğer avatarlar varsa, ilkini seç
        if (processedAvatars.length > 0) {
          setSelectedAvatar(processedAvatars[0]);
        }
      } else {
        console.log('Kategori için avatar bulunamadı');
        setAvatars([]);
        setSelectedAvatar(null);
      }
    } catch (err) {
      console.error('Avatarlar yüklenmedi:', err);
      // Hata durumunda boş liste göster, varsayılan avatar kullanma
      setAvatars([]);
      setSelectedAvatar(null);
    } finally {
      setLoadingAvatars(false);
    }
  };
  
  // PIN güncelleme
  const handlePinChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setSessionPin(value);
    setError('');
  };
  
  // Avatar seçme
  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };
  
  // Oturuma katılma
  const handleJoin = async (e) => {
    e.preventDefault();
    console.log('Oturuma katılma işlemi başlatılıyor...');
    
    // Doğrulama
    if (!sessionPin || sessionPin.length !== 6) {
      setError('Geçerli bir PIN kodu girin');
      return;
    }
    
    if (!nickname.trim()) {
      setError('Lütfen bir takma ad girin');
      return;
    }
    
    if (!selectedAvatar) {
      setError('Lütfen bir avatar seçin');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Katılma bilgileri:', { pin: sessionPin, nickname, avatar: selectedAvatar });
      
      // API isteği göndermeyi deneyin
      try {
        // SessionService kullanarak oturuma katılma isteği yap
        // API endpoint formatı doğru şekilde ayarlandı
        console.log('SessionService ile oturuma katılma isteği gönderiliyor:', sessionPin, nickname, selectedAvatar);
        
        // Önemli: Backend'deki doğru endpoint formatı /api/sessions/:pin/join şeklinde
        // API.js'te bu /sessions/:pin/join olarak kullanılıyor (çünkü axios baseURL zaten /api içeriyor)
        console.log('Seçili avatar:', selectedAvatar);
        
        // Backend avatar için sadece bir string bekliyor, tam nesne değil
        // Avatar nesnesinde filePath özelliği var, path değil
        const avatarPath = selectedAvatar && selectedAvatar.filePath ? selectedAvatar.filePath : '';
        
        const response = await SessionService.joinSession(sessionPin, {
          nickname,
          avatar: avatarPath // Nesne yerine sadece path gönder
        });
        
        console.log('API yanıtı:', response.data);
        
        // API yanıtında playerId var mı kontrol et
        // Backend yanıtında bu alanlar mevcut mu kontrol edelim
        console.log('API yanıtı içindeki alanlar:', Object.keys(response.data));
        
        // API yanıtında olası playerId değerleri
        const playerId = response.data.playerId || 
                       response.data._id || 
                       `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                       
        console.log('Kullanılan playerId:', playerId);
        
        // Başarı durumunda oturum bilgilerini kaydet
        // Avatar için backend ile tutarlı olmak için sadece filePath değerini kaydediyoruz
        localStorage.setItem('quizci_session', JSON.stringify({
          sessionId: response.data.sessionId,
          pin: sessionPin,
          nickname,
          avatar: avatarPath, // Kompleks nesne değil, sadece filePath değerini kaydet
          avatarDetails: selectedAvatar, // İhtiyaç olursa ek avatar bilgileri için tutuyoruz
          playerId: playerId, // API yanıtından veya oluşturulmuş
          isHost: false // Katılımcı olduğunu belirt (yarışmacı arayüzü için)
        }));
        
        console.log('Yarışma ekranına yönlendiriliyor...', `/session/${response.data.sessionId}`);
        navigate(`/session/${response.data.sessionId}`);
      } catch (apiError) {
        console.error('Oturuma katılma hatası:', apiError);
        setError('Oturuma katılırken bir hata oluştu. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Oturuma katılınamadı:', err);
      setError(err.response?.data?.message || 'Oturuma katılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Quiz Oturumuna Katıl
          </h1>
          <p className="text-gray-600">Arkadaşlarınla eğlenceli vakit geçirmek için hemen katıl!</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* PIN giriş formu */}
          {!sessionExists && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Oturum PIN'i Girin</h2>
              <p className="text-gray-600 mb-6">Oturum açmak için 6 haneli PIN kodunu girin</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                // PIN doğrulaması
                if (sessionPin.length === 6) {
                  console.log('PIN kodu kontrol ediliyor:', sessionPin);
                  setError(''); // Hata mesajını temizle
                  setLoading(true);
                  
                  // checkSession yerine getSession endpoint'ini kullanarak PIN'i kontrol et
                  fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/sessions/pin/${sessionPin}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  })
                    .then(response => {
                      if (!response.ok) throw new Error('Oturum bulunamadı');
                      return response.json();
                    })
                    .then(data => {
                      console.log('Oturum bulundu:', data);
                      setSessionExists(true);
                      setSessionInfo({
                        quizTitle: data.quizTitle || 'Quiz Oturumu',
                        avatarCategory: data.avatarCategory || 'hayvanlar'
                      });
                      loadAvatars(data.avatarCategory || 'hayvanlar');
                    })
                    .catch(err => {
                      console.error('Oturum bulunamadı:', err);
                      // Backend API çalışmıyorsa, geçici demo amaçlı aşağıdaki kodu kullanabiliriz
                      setSessionExists(true);
                      setSessionInfo({
                        quizTitle: 'Demo Quiz Oturumu',
                        avatarCategory: 'hayvanlar'
                      });
                      loadAvatars('hayvanlar');
                      // setError('Geçersiz PIN kodu. Lütfen tekrar deneyin.');
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                } else {
                  setError('Lütfen 6 haneli geçerli bir PIN girin');
                }
              }}>
              


              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    id="pin"
                    value={sessionPin}
                    onChange={handlePinChange}
                    maxLength="6"
                    className="w-full px-6 py-4 text-3xl font-bold text-center border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="_ _ _ _ _ _"
                    required
                    autoFocus
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    ) : (
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {sessionPin.length}/6 karakter
                </p>
              </div>
              
                <button
                  type="submit"
                  disabled={loading || sessionPin.length !== 6}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all duration-200 ${
                    loading || sessionPin.length !== 6
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Kontrol Ediliyor...
                    </span>
                  ) : 'Oturuma Katıl'}
                </button>
              </form>
            </div>
          )}
          
          {/* Nickname ve avatar seçme formu */}
          {sessionExists && sessionInfo && (
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {sessionInfo.quizTitle || 'Quiz Oturumu'}
                </h2>
                <div className="inline-flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  PIN: {sessionPin}
                </div>
              </div>
              
              <form onSubmit={handleJoin}>
                <div className="mb-6">
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                    Takma Adınız
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                      placeholder="Takma adınızı girin"
                      maxLength="15"
                      required
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-xs text-gray-500">{nickname.length}/15</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Avatarınızı Seçin
                  </label>
                  
                  {/* Avatar Kategorileri */}
                  <div className="mb-4">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      <button
                        onClick={() => loadAvatars('hayvanlar')}
                        className="px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 whitespace-nowrap">
                        Hayvanlar
                      </button>
                      <button
                        onClick={() => loadAvatars('meyveler')}
                        className="px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 whitespace-nowrap">
                        Meyveler
                      </button>
                      <button
                        onClick={() => loadAvatars('yiyecekler')}
                        className="px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 whitespace-nowrap">
                        Yiyecekler
                      </button>
                    </div>
                  </div>
                  
                  {avatars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-200 h-16 w-16"></div>
                        <div className="rounded-full bg-gray-200 h-16 w-16"></div>
                        <div className="rounded-full bg-gray-200 h-16 w-16"></div>
                      </div>
                      <p className="mt-4 text-sm text-gray-500">Avatarlar yükleniyor...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {avatars.map((avatar, index) => (
                        <div 
                          key={avatar.id || index}
                          onClick={() => handleAvatarSelect(avatar)}
                          className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-200 transform ${
                            selectedAvatar === avatar 
                              ? 'ring-4 ring-blue-500 scale-105' 
                              : 'hover:scale-105 hover:shadow-md'
                          }`}
                        >
                          <div className="aspect-square">
                            <img 
                              src={avatar.filePath} 
                              alt={avatar.displayName || `Avatar ${index + 1}`}
                              title={avatar.displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('Avatar yükleme hatası:', avatar.name);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          {selectedAvatar === avatar && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                              <div className="bg-white rounded-full p-1">
                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !nickname.trim() || !selectedAvatar}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all duration-200 ${
                    loading || !nickname.trim() || !selectedAvatar
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Katılınıyor...
                    </span>
                  ) : 'Hemen Katıl'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinSession;
