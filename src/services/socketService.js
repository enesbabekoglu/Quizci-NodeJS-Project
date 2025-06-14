const Session = require('../models/Session');
const Question = require('../models/Question');

// Socket.io yönetim servisi
const socketService = (io) => {
  // Aktif quizleri tutacak nesne
  const activeQuizzes = {};
  
  // Socket bağlantıları
  io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı:', socket.id);
    
    // Kullanıcı ayrıldığında
    socket.on('disconnect', async () => {
      console.log('Kullanıcı ayrıldı:', socket.id, socket.data.nickname);
      
      try {
        // Eğer kullanıcı bir odaya bağlıysa, onu listeden çıkar
        if (socket.data && socket.data.pin) {
          const pin = socket.data.pin;
          const nickname = socket.data.nickname;
          
          console.log(`${nickname || 'Bilinmeyen kullanıcı'} (${socket.id}) ${pin} odasından ayrıldı`);
          
          // Odadaki diğer kullanıcılara bildir
          socket.to(pin).emit('user-left', { 
            nickname, 
            id: socket.id,
            message: `${nickname || 'Bilinmeyen kullanıcı'} odadan ayrıldı.` 
          });
          
          // Güncellenmiş katılımcı listesini al
          const socketsInRoom = await io.in(pin).fetchSockets();
          
          if (socketsInRoom.length > 0) {
            const participants = socketsInRoom.map(s => ({
              id: s.id,
              nickname: s.data.nickname,
              playerId: s.data.playerId || s.id
            }));
            
            console.log('Ayrılma sonrası güncel katılımcı listesi:', participants);
            
            // Odadaki tüm kullanıcılara güncellenmiş listeyi gönder
            io.to(pin).emit('participants:update', { participants });
          }
        }
      } catch (error) {
        console.error('Kullanıcı ayrılma işlemi sırasında hata:', error);
      }
    });
    
    // Kullanıcı bir odaya katılıyor (quiz PIN ile)
    socket.on('join-room', async ({ pin, nickname, playerId, sessionId, avatar }) => {
      console.log('join-room isteği alındı:', { pin, nickname, playerId, sessionId, avatar });
      
      if (!pin || !nickname) {
        console.error('join-room isteğinde pin veya nickname eksik:', { pin, nickname });
        socket.emit('error', { message: 'PIN ve kullanıcı adı gereklidir.' });
        return;
      }
      
      try {
        // Katılımcıyı kaydetmek için kullanıcı bilgilerini Socket ile ilişkilendir
        socket.data.pin = pin;
        socket.data.nickname = nickname;
        socket.data.playerId = playerId;
        socket.data.sessionId = sessionId;
        socket.data.avatar = avatar; // Avatar bilgisini sakla
        
        // Odaya katıl
        socket.join(pin);
        
        // Session varsa katılımcı listesini güncelle
        // NOT: Gerçek bir uygulamada burada sessionId ile veritabanından oturumu bulup güncellemek gerekir
        
        // Odadaki tüm kullanıcıları al
        const socketsInRoom = await io.in(pin).fetchSockets();
        
        // Katılımcı listesini oluştur
        const participants = socketsInRoom.map(s => ({
          id: s.id,
          nickname: s.data.nickname,
          playerId: s.data.playerId || s.id,
          avatar: s.data.avatar // Avatar bilgisini listede gönder
        }));
        
        console.log(`${nickname} kullanıcısı ${pin} odasına katıldı`);
        console.log('Güncel katılımcı listesi:', participants);
        
        // Tüm odaya yeni kullanıcının katıldığını bildir
        io.to(pin).emit('user-joined', { nickname, avatar });
        
        // Tüm odaya güncellenmiş katılımcı listesini gönder
        io.to(pin).emit('participants:update', { participants });
      } catch (error) {
        console.error('Odaya katılım sırasında hata oluştu:', error);
        socket.emit('error', { message: 'Odaya katılırken bir hata oluştu.' });
      }
    });
    
    // Quiz sahibi quizi başlatıyor
    socket.on('start-quiz', async ({ pin }) => {
      try {
        const session = await Session.findOne({ pin })
          .populate({
            path: 'quizId',
            populate: { path: 'questions' }
          });
        
        if (!session) {
          socket.emit('error', { message: 'Oturum bulunamadı' });
          return;
        }
        
        // Oturum durumunu güncelle
        session.status = 'active';
        session.currentQuestion = 0;
        await session.save();
        
        // Aktif quizler listesine ekle
        activeQuizzes[pin] = {
          session,
          currentQuestionIndex: 0,
          startedAt: Date.now()
        };
        
        // Tüm katılımcılara quizin başladığını bildir
        io.to(pin).emit('quiz-started', {
          message: 'Quiz başladı!',
          totalQuestions: session.quizId.questions.length
        });
        
        // İlk soruyu gönder
        setTimeout(() => {
          sendQuestion(pin);
        }, 3000);
      } catch (error) {
        console.error('Quiz başlatma hatası:', error.message);
        socket.emit('error', { message: 'Quiz başlatılırken bir hata oluştu' });
      }
    });
    
    // Katılımcı cevap gönderiyor
    socket.on('submit-answer', async ({ pin, nickname, answer }) => {
      try {
        if (!activeQuizzes[pin]) {
          socket.emit('error', { message: 'Bu quiz aktif değil' });
          return;
        }
        
        const { session, currentQuestionIndex } = activeQuizzes[pin];
        
        // Doğru soruyu ve katılımcıyı bul
        const currentQuestion = session.quizId.questions[currentQuestionIndex];
        const participantIndex = session.participants.findIndex(p => p.nickname === nickname);
        
        if (participantIndex === -1) {
          socket.emit('error', { message: 'Katılımcı bulunamadı' });
          return;
        }
        
        // Cevap doğru mu kontrol et
        const isCorrect = (answer === currentQuestion.correctIndex);
        
        // Skoru hesapla (doğru cevaplar için puan, yanıtlama hızına göre bonus)
        let score = 0;
        if (isCorrect) {
          // Temel puan: 1000
          score = 1000;
          
          // Hız bonusu: maksimum 1000 puan, soru süresi içinde azalır
          const timePassed = Date.now() - activeQuizzes[pin].questionStartedAt;
          const timeBonus = Math.max(0, 1000 - Math.floor(timePassed / 20)); // Her 20ms'de 1 puan azalır
          
          score += timeBonus;
        }
        
        // Katılımcıyı güncelle
        session.participants[participantIndex].answers.push(answer);
        session.participants[participantIndex].score += score;
        
        // Socket cevabı gönder
        socket.emit('answer-result', { 
          isCorrect,
          score,
          totalScore: session.participants[participantIndex].score
        });
      } catch (error) {
        console.error('Cevap gönderme hatası:', error.message);
        socket.emit('error', { message: 'Cevabınız işlenirken bir hata oluştu' });
      }
    });
    
    // Quiz'i ilerlet (bir sonraki soruya geç)
    socket.on('next-question', ({ pin }) => {
      if (!activeQuizzes[pin]) {
        socket.emit('error', { message: 'Bu quiz aktif değil' });
        return;
      }
      
      activeQuizzes[pin].currentQuestionIndex++;
      sendQuestion(pin);
    });
    
    // Quiz'i bitir
    socket.on('end-quiz', async ({ pin }) => {
      if (!activeQuizzes[pin]) {
        socket.emit('error', { message: 'Bu quiz aktif değil' });
        return;
      }
      
      try {
        // Oturumu tamamlandı olarak işaretle
        const session = activeQuizzes[pin].session;
        session.status = 'completed';
        session.endedAt = new Date();
        await session.save();
        
        // Aktif quizler listesinden kaldır
        delete activeQuizzes[pin];
        
        // Tüm katılımcılara quiz'in bittiğini bildir
        io.to(pin).emit('quiz-ended', {
          message: 'Quiz tamamlandı!',
          results: session.participants.map(p => ({
            nickname: p.nickname,
            avatar: p.avatar,
            score: p.score
          })).sort((a, b) => b.score - a.score)
        });
      } catch (error) {
        console.error('Quiz sonlandırma hatası:', error.message);
        socket.emit('error', { message: 'Quiz sonlandırılırken bir hata oluştu' });
      }
    });
  });
  
  // Soru gönderme yardımcı fonksiyonu
  const sendQuestion = async (pin) => {
    try {
      if (!activeQuizzes[pin]) {
        return;
      }
      
      const { session, currentQuestionIndex } = activeQuizzes[pin];
      
      // Son soru mu kontrol et
      if (currentQuestionIndex >= session.quizId.questions.length) {
        // Quiz bitti
        io.to(pin).emit('quiz-complete', {
          message: 'Tebrikler! Tüm soruları tamamladınız.'
        });
        
        // Oturumu tamamlandı olarak işaretle
        session.status = 'completed';
        session.endedAt = new Date();
        await session.save();
        
        // Aktif quizler listesinden kaldır
        delete activeQuizzes[pin];
        return;
      }
      
      // Soru bilgisini al
      const question = session.quizId.questions[currentQuestionIndex];
      
      // Session'ı güncelle
      session.currentQuestion = currentQuestionIndex;
      await session.save();
      
      // Soru başlangıç zamanını ayarla
      activeQuizzes[pin].questionStartedAt = Date.now();
      
      // Soruyu gönder (cevap içermeden)
      io.to(pin).emit('new-question', {
        index: currentQuestionIndex,
        total: session.quizId.questions.length,
        questionText: question.questionText,
        options: question.options,
        media: question.media
      });
      
      // Soru süresi (saniye başına 1000ms)
      const questionDuration = 30 * 1000;
      
      // Soru süresi bitince sonuçları göster
      setTimeout(async () => {
        if (!activeQuizzes[pin]) return;
        
        // Doğru cevabı gönder
        io.to(pin).emit('question-result', {
          correctIndex: question.correctIndex,
          scores: session.participants.map(p => ({
            nickname: p.nickname,
            score: p.score
          })).sort((a, b) => b.score - a.score)
        });
      }, questionDuration);
    } catch (error) {
      console.error('Soru gönderme hatası:', error.message);
      io.to(pin).emit('error', { message: 'Soru yüklenirken bir hata oluştu' });
    }
  };
};

module.exports = socketService;
