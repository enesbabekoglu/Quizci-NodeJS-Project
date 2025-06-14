import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionService } from '../utils/api';
import io from 'socket.io-client';
import WaitingRoom from '../components/WaitingRoom';
import { QRCodeSVG } from 'qrcode.react';

const LiveSession = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Durum değişkenleri
  const [session, setSession] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isAvatarSelectionOpen, setIsAvatarSelectionOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timer, setTimer] = useState(0);
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'question', 'result', 'leaderboard', 'ended'
  const [leaderboard, setLeaderboard] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isHost, setIsHost] = useState(false);
  
  // URL parametrelerini al
  const { sessionId } = useParams();
  
  // Socket.io bağlantısı için ref
  const socketRef = useRef(null);
  
  // Oturum verilerini localStorage'dan al ve socket bağlantısını kur
  useEffect(() => {
    console.log('LiveSession sayfası yükleniyor, session ID:', sessionId);
    
    // Öncelikle localStorage'da bir oturum var mı kontrol et
    const sessionData = localStorage.getItem('quizci_session');
    
    // Oturum verisi yoksa ve URL'den session ID geliyorsa misafir kullanıcı olarak devam et
    if (!sessionData && sessionId) {
      console.log('Misafir kullanıcı, oturuma katılıyor...');
      
      // Misafir kullanıcı için geçici bir oyuncu oluştur
      const guestPlayer = {
        sessionId: sessionId,
        isHost: false,
        playerId: 'guest-' + Math.random().toString(36).substring(2, 9)
      };
      
      setPlayer(guestPlayer);
      setLoading(false);
      
      // Kullanıcıdan bir isim alıp oturuma katılmasını sağlayacak ekranı göster
      setGameState('join');
      return;
    } else if (!sessionData) {
      setError('Oturum bilgisi bulunamadı');
      setLoading(false);
      return;
    }
    
    try {
      const parsedSession = JSON.parse(sessionData);
      // Host durumunu kontrol et
      if (parsedSession.isHost) {
        setIsHost(true);
        console.log('Kullanıcı oturumun sahibidir (host)');
      }
      setPlayer(parsedSession);
      
      // Session pin kontrolü
      if (pin && pin !== parsedSession.pin) {
        setError('Oturum PIN kodu eşleşmiyor');
        setLoading(false);
        return;
      }
      
      // Socket bağlantısını kur
      // Backend sunucusu 5001 portunda çalışıyor, socket.io bağlantısını da aynı porta yapmalıyız
      const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      console.log('Socket bağlantı adresi:', SOCKET_URL);
      
      const socket = io(SOCKET_URL, {
        query: {
          sessionId: parsedSession.sessionId,
          playerId: parsedSession.playerId,
          pin: parsedSession.pin
        }
      });
      
      socketRef.current = socket;
      
      // Socket bağlantısı olayları
      socket.on('connect', () => {
        console.log('Socket bağlantısı kuruldu');
        
        // Bağlantı kurulduktan sonra odaya katılma isteği gönder (backend ile eşleştir)
        socket.emit('join-room', {
          pin: parsedSession.pin,
          nickname: parsedSession.nickname,
          playerId: parsedSession.playerId,
          sessionId: parsedSession.sessionId,
          avatar: parsedSession.avatar // Avatar yolunu gönderiyoruz
        });
        
        console.log('Odaya katılma isteği gönderildi:', {
          pin: parsedSession.pin,
          nickname: parsedSession.nickname,
          avatar: parsedSession.avatar
        });
      });
      
      socket.on('error', (error) => {
        console.error('Socket hatası:', error);
        setError(`Bağlantı hatası: ${error.message}`);
        setLoading(false);
      });
      
    } catch (err) {
      console.error('Oturum verisi parse edilemedi:', err);
      setError('Oturum bilgisi geçersiz');
    } finally {
      setLoading(false);
    }
    
    // Temizleme işlemi
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [pin]);
  
  // Socket olay dinleyicileri
  useEffect(() => {
    if (!socketRef.current) return;
    
    const socket = socketRef.current;
    
    // Oturum bilgilerini al
    socket.on('session:info', (data) => {
      setSession(data);
      setGameState(data.gameState || 'waiting');
    });
    
    // Yeni soru geldiğinde
    socket.on('question:new', (data) => {
      setCurrentQuestion(data.question);
      setTimer(data.duration);
      setSelectedAnswer(null);
      setGameState('question');
    });
    
    // Soru süre güncellemesi
    socket.on('question:timer', (data) => {
      setTimer(data.remainingTime);
    });
    
    // Katılımcı listesi güncellemesi
    socket.on('participants:update', (data) => {
      console.log('Katılımcı listesi güncellendi:', data.participants);
      // Avatar URL'leri için gerekli düzeltmeleri yapalım
      const updatedParticipants = data.participants.map(participant => {
        // Her katılımcı için detayları konsola yazdıralım
        console.log('Katılımcı düzeltme öncesi:', participant);
        
        // localStorage'dan avatar bilgisi alıyoruz (kendimizinki için)
        const sessionData = localStorage.getItem('quizci_session');
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          // Eğer bu bizim playerId'miz ise, localStorage'daki avatar bilgisini kullanalım
          if (participant.playerId === parsedData.playerId) {
            return {
              ...participant,
              avatar: parsedData.avatar,
              avatarDetails: parsedData.avatarDetails
            };
          }
        }
        
        return participant;
      });
      
      console.log('Düzenlenmiş katılımcı listesi:', updatedParticipants);
      setParticipants(updatedParticipants);
    });
    
    // Yeni kullanıcı katıldığında
    socket.on('user-joined', (data) => {
      console.log('Yeni kullanıcı katıldı:', data);
    });
    
    // Kullanıcı ayrıldığında
    socket.on('user-left', (data) => {
      console.log('Kullanıcı ayrıldı:', data);
    });
    
    // Soru sonuçları
    socket.on('question:result', (data) => {
      setCurrentQuestion({
        ...currentQuestion,
        correctAnswerIndex: data.correctAnswerIndex
      });
      setGameState('result');
    });
    
    // Liderlik tablosu güncellemesi
    socket.on('leaderboard:update', (data) => {
      setLeaderboard(data.leaderboard);
      setGameState('leaderboard');
    });
    
    // Oyun sonu
    socket.on('game:end', (data) => {
      setLeaderboard(data.finalLeaderboard);
      setGameState('ended');
    });
    
    // Oyun durumu güncellemesi
    socket.on('game:state', (data) => {
      setGameState(data.state);
    });
    
    return () => {
      socket.off('session:info');
      socket.off('question:new');
      socket.off('question:timer');
      socket.off('question:result');
      socket.off('leaderboard:update');
      socket.off('game:end');
      socket.off('game:state');
    };
  }, [currentQuestion]);
  
  // Oyunu başlat
  const handleStartGame = useCallback(() => {
    if (!socketRef.current || !isHost) return;
    
    setIsStartingGame(true);
    
    // Oyunu başlatma isteği gönder
    socketRef.current.emit('host:start_game', {});
    console.log('Oyunu başlatma isteği gönderildi');
  }, [isHost]);
  
  // Bir cevap seçildiğinde
  const handleAnswerSelect = useCallback((answerId) => {
    if (selectedAnswer || !socketRef.current) return;
    
    setSelectedAnswer(answerId);
    
    // Cevabı sunucuya gönder
    socketRef.current.emit('player:answer', {
      questionId: currentQuestion?._id,
      answerId
    });
  }, [currentQuestion, selectedAnswer]);
  
  // Tam ekran modunu aç/kapat
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Tam ekran moduna geçilemedi:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Oyundan çıkma işlevi
  const handleLeaveGame = () => {
    if (window.confirm('Oyundan çıkmak istediğinizden emin misiniz?')) {
      // Oturum bilgilerini temizle
      localStorage.removeItem('quizci_session');
      
      // Socket bağlantısını kapat
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Ana sayfaya dön
      navigate('/');
    }
  };
  
  // Yükleme ve hata durumları için yardımcı bileşenler
  const [guestName, setGuestName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Avatar yönetimi
  const fetchAvatars = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/avatars`);
      const data = await response.json();
      if (data.success && data.avatars) {
        setAvatars(data.avatars);
        // Rastgele bir avatar seç
        const randomIndex = Math.floor(Math.random() * data.avatars.length);
        setSelectedAvatar(data.avatars[randomIndex]);
      }
    } catch (error) {
      console.error('Avatarlar yüklenirken hata oluştu:', error);
    }
  };
  
  const selectAvatar = (avatarPath) => {
    setSelectedAvatar(avatarPath);
  };
  
  const changeAvatar = () => {
    setIsAvatarSelectionOpen(true);
  };
  
  // Component mount olduğunda avatarları getir
  useEffect(() => {
    if (gameState === 'join') {
      fetchAvatars();
    }
  }, [gameState]);
  
  // Misafir kullanıcının oturuma katılması için
  const handleGuestJoin = async (e) => {
    e.preventDefault();
    
    if (!guestName.trim()) {
      alert('Lütfen bir isim girin');
      return;
    }
    
    if (!selectedAvatar) {
      alert('Lütfen bir avatar seçin');
      return;
    }
    
    setIsJoining(true);
    
    try {
      // Misafir için socket bağlantısı kuruyoruz
      const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        query: {
          sessionId: player.sessionId,
          playerId: player.playerId,
          playerName: guestName,
          avatarPath: selectedAvatar
        }
      });
      
      socketRef.current = socket;
      
      // Socket olay dinleyicilerini ekle
      socket.on('connect', () => {
        console.log('Socket bağlantısı kuruldu!');
        
        // Katılım isteği gönder
        socket.emit('player:join', {
          name: guestName,
          sessionId: player.sessionId
        });
      });
      
      // Katılım onayını dinle
      socket.on('player:joined', (data) => {
        console.log('Oturuma katılım onaylandı', data);
        
        // Oturum bilgilerini güncelle
        const updatedPlayer = {
          ...player,
          name: guestName,
          avatar: data.avatar || 'default',
          pin: data.pin
        };
        
        setPlayer(updatedPlayer);
        localStorage.setItem('quizci_session', JSON.stringify(updatedPlayer));
        
        // Bekleme odası durumuna geç
        setGameState('waiting');
        setIsJoining(false);
      });
      
      // Hata durumlarını dinle
      socket.on('error', (error) => {
        console.error('Sunucu hatası:', error);
        setError('Oturuma katılırken bir hata oluştu: ' + error.message);
        setIsJoining(false);
      });
      
    } catch (err) {
      console.error('Bağlantı hatası:', err);
      setError('Oturuma bağlanırken bir hata oluştu.');
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-light to-primary-dark flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-4">Yükleniyor...</h2>
          <p className="text-gray-600">Quiz oturumuna bağlanılıyor, lütfen bekleyin.</p>
          <div className="mt-4 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-light to-primary-dark flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Hata!</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }
  
  // Misafir kullanıcı giriş formu
  if (gameState === 'join') {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Quizci Oturumuna Katıl</h1>
          
          <p className="text-gray-600 mb-6 text-center">
            Quiz oturumuna katılmak için lütfen bir kullanıcı adı girin.
          </p>
          
          <form onSubmit={handleGuestJoin} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                İsminiz
              </label>
              <input
                id="name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="İsminizi girin"
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isJoining}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Avatar Seçin
              </label>
              <div className="grid grid-cols-4 gap-2">
                {avatars.length > 0 ? (
                  avatars.map((avatar, index) => (
                    <div 
                      key={index} 
                      onClick={() => !isJoining && selectAvatar(avatar.path)}
                      className={`cursor-pointer p-2 rounded-lg border-2 ${selectedAvatar === avatar.path ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <img 
                        src={avatar.path} 
                        alt={`Avatar ${index + 1}`} 
                        className="w-full rounded-full"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-4 text-gray-500">
                    Avatarlar yükleniyor...
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isJoining}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ${isJoining ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Katılınıyor...
                  </div>
                ) : 'Oturuma Katıl'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-blue-600 hover:underline text-sm"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-md w-full">
          <p className="font-semibold">Hata</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="btn btn-primary"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark to-primary-darker text-white relative">
      {/* Tam ekran butonu - sol üst köşe */}
      <button 
        onClick={toggleFullscreen} 
        className="absolute top-3 left-3 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all z-50"
        title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a2 2 0 012-2h2V3H7a4 4 0 00-4 4v2h2zm10-2V5a2 2 0 00-2-2h-2V1h2a4 4 0 014 4v2h-2zm-2 8h2v-2h-2v-2h-2v2a2 2 0 002 2zm-8 0h2a2 2 0 002-2v-2H7v2H5v2z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* PIN kodu ve QR kodu - sağ üst köşe */}
      {isHost && gameState !== 'ended' && player?.pin && (
        <div className="absolute top-3 right-3 flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 z-50">
          <div className="text-center">
            <div className="text-3xl font-bold">{player.pin}</div>
            <div className="text-xs opacity-80">Katılım PIN Kodu</div>
          </div>
          <div className="bg-white p-1 rounded">
            <QRCodeSVG 
              value={`${window.location.origin}/join/${player.pin}`} 
              size={80} 
              bgColor="#FFFFFF" 
              fgColor="#000000" 
              level="L" 
              includeMargin={false}
            />
          </div>
        </div>
      )}

      {/* Katılımcıları bekleme ekranı */}
      {gameState === 'waiting' ? (
        <WaitingRoom 
          participants={participants} 
          pin={pin} 
          onStartGame={handleStartGame} 
          isHost={isHost} 
          isLoading={isStartingGame} 
        />
      ) : (
      <div className="container mx-auto px-4 py-6">
        {/* Üst bilgi çubuğu */}
        <div className="flex justify-between items-center mb-6 mt-12">
          <div>
            <h2 className="text-xl font-bold">
              {session?.quizTitle || 'Quiz Oturumu'}
            </h2>
          </div>
          
          <button
            onClick={handleLeaveGame}
            className="btn btn-outline-light btn-sm"
          >
            Çıkış
          </button>
        </div>
        
        {/* Oyun durumuna göre farklı içerikler */}
        
        {/* Bekleme durumu */}
        {gameState === 'waiting' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-lg w-full text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/50">
                  {player?.avatar && (
                    <img 
                      src={`/avatars/${session?.avatarCategory || 'hayvanlar'}/${player.avatar}`} 
                      alt="Oyuncu Avatarı" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  Hoş Geldin, {player?.nickname || 'Oyuncu'}
                </h2>
                <p className="text-lg opacity-80">
                  Quiz başlamak üzere, lütfen hazır ol!
                </p>
              </div>
              
              <div className="mb-4 py-3 px-4 bg-white/20 rounded-lg">
                <p className="text-base">
                  <strong>Katılımcı sayısı:</strong> {session?.players?.length || 0}
                </p>
              </div>
              
              <div className="animate-pulse">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-sm opacity-70">Quiz yöneticisinin quiz'i başlatması bekleniyor...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Soru durumu */}
        {gameState === 'question' && currentQuestion && (
          <div className="max-w-4xl mx-auto">
            {/* Süre ve puan bilgisi */}
            <div className="flex justify-between items-center mb-6">
              <div className="bg-white/20 rounded-lg px-5 py-2">
                <span className="text-lg font-bold">
                  {timer > 0 ? timer : 0} saniye
                </span>
              </div>
              <div className="bg-white/20 rounded-lg px-5 py-2">
                <span className="text-lg font-bold">
                  {currentQuestion.points || 100} puan
                </span>
              </div>
            </div>
            
            {/* Soru metni */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-bold mb-2">
                {currentQuestion.questionText}
              </h3>
              
              {/* Soru görseli (varsa) */}
              {currentQuestion.image && (
                <div className="my-4 rounded-lg overflow-hidden">
                  <img 
                    src={currentQuestion.image} 
                    alt="Soru görseli" 
                    className="w-full h-auto max-h-80 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
            
            {/* Cevap seçenekleri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.answers && currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={`p-4 rounded-xl text-left text-lg font-medium transition-all transform hover:scale-105 
                    ${selectedAnswer === index ? 'bg-primary-light text-white ring-4 ring-white' : 'bg-white/20 hover:bg-white/30'}
                    ${selectedAnswer !== null && selectedAnswer !== index ? 'opacity-70' : ''}
                  `}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-white/20 text-white">
                      {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                    </div>
                    <span>{answer.text}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Seçim yapıldı mesajı */}
            {selectedAnswer !== null && (
              <div className="mt-6 text-center">
                <p className="text-lg font-bold animate-pulse">
                  Cevabınız kaydedildi! Sonuçları bekliyoruz...
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Soru Sonuç durumu */}
        {gameState === 'result' && currentQuestion && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-bold mb-4">
                Soru Sonuçları
              </h3>
              
              <div className="mb-4 pb-4 border-b border-white/20">
                <h4 className="text-xl mb-2">
                  {currentQuestion.questionText}
                </h4>
                
                {/* Soru görseli (varsa) */}
                {currentQuestion.image && (
                  <div className="my-4 rounded-lg overflow-hidden">
                    <img 
                      src={currentQuestion.image} 
                      alt="Soru görseli" 
                      className="w-full h-auto max-h-60 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
              
              {/* Cevap seçenekleri ve sonuçlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion.answers && currentQuestion.answers.map((answer, index) => {
                  const isCorrect = index === currentQuestion.correctAnswerIndex;
                  const wasSelected = selectedAnswer === index;
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl text-left 
                        ${isCorrect ? 'bg-green-500/80' : wasSelected ? 'bg-red-500/80' : 'bg-white/20'}
                      `}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                          ${isCorrect ? 'bg-green-700' : wasSelected && !isCorrect ? 'bg-red-700' : 'bg-white/20'}`}>
                          {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                        </div>
                        <span className="font-medium">{answer.text}</span>
                        
                        {isCorrect && (
                          <svg className="w-6 h-6 ml-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        
                        {!isCorrect && wasSelected && (
                          <svg className="w-6 h-6 ml-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Sonuç mesajı */}
              <div className="text-center p-4 bg-white/20 rounded-lg">
                {selectedAnswer === currentQuestion.correctAnswerIndex ? (
                  <p className="text-lg font-bold text-green-300">
                    Tebrikler! Doğru cevap verdiniz.
                  </p>
                ) : (
                  <p className="text-lg font-bold text-red-300">
                    Üzgünüm, yanlış cevap verdiniz.
                  </p>
                )}
                <p className="mt-2">
                  Bir sonraki soruya hazırlanın...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Skor tablosu durumu */}
        {gameState === 'leaderboard' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Skor Tablosu
              </h3>
              
              <div className="overflow-hidden rounded-lg">
                <div className="bg-white/20 p-4 mb-1 rounded-t-lg">
                  <div className="grid grid-cols-12 gap-2 font-bold">
                    <div className="col-span-2 text-center">#</div>
                    <div className="col-span-5">Oyuncu</div>
                    <div className="col-span-2 text-center">Doğru</div>
                    <div className="col-span-3 text-right">Puan</div>
                  </div>
                </div>
                
                <div className="space-y-1 mb-4">
                  {leaderboard.map((item, index) => {
                    // Mevcut oyuncu vurgulanacak
                    const isCurrentPlayer = item.playerId === player?.playerId;
                    
                    return (
                      <div 
                        key={item.playerId} 
                        className={`p-3 ${index === 0 ? 'bg-yellow-500/30' : index === 1 ? 'bg-gray-400/30' : index === 2 ? 'bg-orange-700/30' : 'bg-white/10'} 
                          ${isCurrentPlayer ? 'ring-2 ring-white' : ''} rounded-lg`}
                      >
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-2 text-center font-bold">
                            {index + 1}
                          </div>
                          <div className="col-span-5 flex items-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 mr-2">
                              {item.avatar && (
                                <img 
                                  src={`/avatars/${session?.avatarCategory || 'hayvanlar'}/${item.avatar}`}
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <span className="truncate">{item.nickname}</span>
                          </div>
                          <div className="col-span-2 text-center">
                            {item.correctAnswers || 0}
                          </div>
                          <div className="col-span-3 text-right font-bold">
                            {item.score}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="text-center opacity-80 text-sm mt-4">
                <p>Bir sonraki soru için hazırlanın...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Oyun sonu durumu */}
        {gameState === 'ended' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-2 text-center">
                Quiz Tamamlandı!
              </h3>
              <p className="text-center mb-6 opacity-80">
                Teşekkürler {player?.nickname}, katılımın için teşekkürler!
              </p>
              
              <div className="bg-white/20 rounded-lg p-6 mb-6">
                <h4 className="text-xl font-bold mb-4 text-center">Son Skor Tablosu</h4>
                
                <div className="overflow-hidden rounded-lg">
                  <div className="bg-white/20 p-4 mb-1 rounded-t-lg">
                    <div className="grid grid-cols-12 gap-2 font-bold">
                      <div className="col-span-2 text-center">#</div>
                      <div className="col-span-5">Oyuncu</div>
                      <div className="col-span-2 text-center">Doğru</div>
                      <div className="col-span-3 text-right">Puan</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    {leaderboard.map((item, index) => {
                      // Mevcut oyuncu vurgulanacak
                      const isCurrentPlayer = item.playerId === player?.playerId;
                      // İlk 3 için özel ikonlar
                      const medals = [
                        <svg key="gold" className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" /></svg>,
                        <svg key="silver" className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" /></svg>,
                        <svg key="bronze" className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" /></svg>
                      ];

                      return (
                        <div 
                          key={item.playerId} 
                          className={`p-3 ${index === 0 ? 'bg-yellow-500/30' : index === 1 ? 'bg-gray-400/30' : index === 2 ? 'bg-orange-700/30' : 'bg-white/10'} 
                            ${isCurrentPlayer ? 'ring-2 ring-white' : ''} rounded-lg`}
                        >
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-2 text-center font-bold flex items-center justify-center">
                              {index < 3 ? (
                                <div className="flex items-center">
                                  {medals[index]}
                                  <span className="ml-1">{index + 1}</span>
                                </div>
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="col-span-5 flex items-center">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 mr-2">
                                {item.avatar && (
                                  <img 
                                    src={`/avatars/${session?.avatarCategory || 'hayvanlar'}/${item.avatar}`}
                                    alt="" 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <span className="truncate">{item.nickname}</span>
                            </div>
                            <div className="col-span-2 text-center">
                              {item.correctAnswers || 0}
                            </div>
                            <div className="col-span-3 text-right font-bold">
                              {item.score}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={handleLeaveGame} 
                  className="btn btn-primary"
                >
                  Ana Sayfaya Dön
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default LiveSession;
