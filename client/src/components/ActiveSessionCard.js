import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiClock, FiHelpCircle } from 'react-icons/fi';

// Oturum başlangıcından bu yana geçen süreyi hesaplayan yardımcı fonksiyon
const calculateTimeDifference = (startTime) => {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now - start;
  
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  
  return { hours, minutes, seconds };
};

// Oturum durumunu Türkçe olarak döndüren fonksiyon
const getStatusText = (status) => {
  switch (status) {
    case 'waiting': return 'Katılımcılar Bekleniyor';
    case 'active': return 'Devam Ediyor';
    case 'completed': return 'Tamamlandı';
    case 'paused': return 'Duraklatıldı';
    default: return 'Bilinmiyor';
  }
};

const ActiveSessionCard = ({ session }) => {
  const [timeElapsed, setTimeElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [timer, setTimer] = useState(null);
  
  // Her saniye geçen süreyi güncelle
  useEffect(() => {
    if (session.startedAt) {
      // İlk hesaplamayı yap
      setTimeElapsed(calculateTimeDifference(session.startedAt));
      
      // Her saniye güncelle
      const intervalId = setInterval(() => {
        setTimeElapsed(calculateTimeDifference(session.startedAt));
      }, 1000);
      
      setTimer(intervalId);
      
      // Bileşen kaldırıldığında timer'ı temizle
      return () => clearInterval(intervalId);
    }
  }, [session.startedAt]);
  
  // Kalan soru sayısını hesapla
  const calculateRemainingQuestions = () => {
    if (!session.quiz || !session.quiz.questions) return 0;
    
    const totalQuestions = session.quiz.questions.length;
    const currentQuestion = session.currentQuestion + 1; // -1'den başladığı için +1 ekliyoruz
    
    return totalQuestions - currentQuestion;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5 border-l-4 border-primary">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">
          {session.quiz?.title || 'Oturum'}
        </h3>
        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
          {getStatusText(session.status)}
        </span>
      </div>
      
      <div className="space-y-3 mb-4">
        {/* Aktif süre */}
        <div className="flex items-center text-gray-600">
          <FiClock className="mr-2 text-primary-600" />
          <span className="font-medium">Aktif Süre:</span>
          <span className="ml-2">{`${timeElapsed.hours.toString().padStart(2, '0')}:${timeElapsed.minutes.toString().padStart(2, '0')}:${timeElapsed.seconds.toString().padStart(2, '0')}`}</span>
        </div>
        
        {/* Katılımcı sayısı */}
        <div className="flex items-center text-gray-600">
          <FiUsers className="mr-2 text-primary-600" />
          <span className="font-medium">Katılımcılar:</span>
          <span className="ml-2">{session.participants?.length || 0} kişi</span>
        </div>
        
        {/* Pin kodu */}
        <div className="flex items-center text-gray-600">
          <span className="font-medium mr-2">Oturum Kodu:</span>
          <span className="bg-gray-100 px-2 py-1 rounded font-mono text-primary-700">{session.pin}</span>
        </div>
        
        {/* Kalan soru */}
        {session.status === 'active' && (
          <div className="flex items-center text-gray-600">
            <FiHelpCircle className="mr-2 text-primary-600" />
            <span className="font-medium">Kalan Soru:</span>
            <span className="ml-2">{calculateRemainingQuestions()}</span>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2 mt-4">
        {/* Oturum devam ediyorsa göster */}
        {session.status !== 'completed' && (
          <Link 
            to={`/session/${session._id}`}
            className="flex-1 btn btn-primary text-center text-sm"
          >
            Oturumu Yönet
          </Link>
        )}
        
        {/* Tamamlanmış oturumlar için sonuç sayfası */}
        {session.status === 'completed' && (
          <Link 
            to={`/session/results/${session._id}`}
            className="flex-1 btn btn-secondary text-center text-sm"
          >
            Sonuçları Görüntüle
          </Link>
        )}
      </div>
    </div>
  );
};

export default ActiveSessionCard;
