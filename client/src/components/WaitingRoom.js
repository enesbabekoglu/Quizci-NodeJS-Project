import React from 'react';

const WaitingRoom = ({ 
  participants = [], 
  pin, 
  onStartGame, 
  isHost = false, 
  isLoading = false 
}) => {
  // console.log kullanarak katılımcı verilerini kontrol edelim
  console.log('WaitingRoom - Katılımcılar:', participants);
  
  return (
    <div className="max-w-3xl mx-auto p-4" style={{color: '#333'}}>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden" style={{backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'}}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6" style={{color: '#1a365d'}}>Katılımcılar Bekleniyor</h2>
          
          <div className="flex justify-center mb-6">
            <div className="text-center px-8 py-4 rounded-lg" style={{backgroundColor: '#ebf8ff'}}>
              <div className="text-sm font-medium" style={{color: '#2b6cb0'}}>OYUN KODU</div>
              <div className="text-4xl font-bold" style={{color: '#2c5282'}}>{pin}</div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg mb-6" style={{backgroundColor: '#f7fafc'}}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold" style={{color: '#2d3748'}}>Katılımcılar ({participants.length})</h3>
              {isHost && (
                <button 
                  onClick={onStartGame}
                  disabled={isLoading || participants.length === 0}
                  style={{
                    backgroundColor: participants.length === 0 ? '#A0AEC0' : '#48bb78',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontWeight: '500',
                    cursor: participants.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Başlatılıyor...' : 'Oyunu Başlat'}
                </button>
              )}
            </div>
            
            {participants.length === 0 ? (
              <div className="text-center py-8" style={{color: '#718096'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" style={{color: '#A0AEC0'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p style={{color: '#4A5568'}}>Henüz katılımcı yok</p>
                <p className="text-sm mt-2" style={{color: '#718096'}}>Katılımcılar oyun kodunu girdikçe burada görünecek</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {participants.map((participant, index) => {
                  console.log('Katılımcı detayları:', participant);
                  // Avatar URL'si direkt socket'ten gelen veriyi kullanıyor
                  // Socket'ten gelen avatar formatı: "/avatars/animals/turtle_c6c225c9.jpeg"
                  const socketAvatarUrl = participant.avatar || null;
                  console.log('Socket\'ten gelen avatar URL:', socketAvatarUrl);
                  
                  // Socket'ten gelen avatar URL'sine API URL'sini ekleyerek tam URL oluştur
                  const finalAvatarUrl = socketAvatarUrl 
                    ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${socketAvatarUrl}` 
                    : null;
                    
                  console.log('Oluşturulan tam avatar URL:', finalAvatarUrl);
                  
                  return (
                    <div key={index} style={{
                      backgroundColor: 'white',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      margin: '0.5rem',
                      width: '100px'
                    }}>
                      {socketAvatarUrl ? (
                        // Avatar resmi varsa onu göster
                        <div style={{
                          width: '4rem',  // Daha büyük avatar
                          height: '4rem', // Daha büyük avatar
                          marginBottom: '0.5rem', // Altında nickname olacağı için alt margin
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '3px solid #4299e1'
                        }}>
                          <img 
                            src={finalAvatarUrl} 
                            alt="Avatar" 
                            style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                            onError={(e) => {
                              console.error('Avatar yükleme hatası:', e);
                              console.error('Yüklenemeyen avatar URL:', finalAvatarUrl);
                              
                              // Baş harfi göster yerine farklı bir varsayılan avatar göster
                              const nickname = participant.nickname || participant.name || 'Anonim';
                              const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=4299e1&color=ffffff&size=100&format=svg`;
                              
                              // Varsayılan avatara yönlendir
                              e.target.src = defaultAvatarUrl;
                              e.target.onerror = () => {
                                console.error('Yedek avatar da yüklenemedi, baş harf göster');
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<div style="
                                  width: 100%;
                                  height: 100%;
                                  background-color: #bee3f8;
                                  color: #3182ce;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  font-weight: bold;
                                  font-size: 1.5rem;
                                ">${(nickname?.charAt(0) || '?').toUpperCase()}</div>`;
                              };
                            }}
                          />
                        </div>
                      ) : (
                        // Avatar yoksa baş harfini göster
                        <div style={{
                          width: '4rem',  // Daha büyük avatar
                          height: '4rem', // Daha büyük avatar
                          marginBottom: '0.5rem', // Altında nickname olacağı için alt margin
                          backgroundColor: '#bee3f8',
                          color: '#3182ce',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '1.5rem',
                          border: '3px solid #4299e1'
                        }}>
                          {((participant.nickname || participant.name || '?')?.charAt(0) || '?').toUpperCase()}
                        </div>
                      )}
                      <div style={{
                        fontWeight: 'bold',
                        color: '#2d3748',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {(participant.nickname || participant.name || '?')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="text-center text-sm" style={{color: '#4A5568'}}>
            <p>Oyunu başlatmak için en az 1 katılımcı gereklidir.</p>
            {isHost && (
              <p className="mt-2" style={{color: '#4A5568'}}>
                Katılımcılar hazır olduğunda "Oyunu Başlat" düğmesine tıklayın.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
