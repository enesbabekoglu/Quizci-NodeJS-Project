import React, { useState, useEffect } from 'react';

const QuestionForm = ({ question, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    questionText: '',
    duration: 30,
    points: 100,
    answers: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    image: ''
  });
  
  const [error, setError] = useState('');

  // Düzenleme modunda ise mevcut soru verilerini form'a yükle
  useEffect(() => {
    if (question) {
      console.log('Düzenleme için gelen soru:', question);
      
      // Backend'den gelen options ve correctIndex formatını answers formatına dönüştür
      let answersArray;
      if (question.options && Array.isArray(question.options)) {
        // Backend formatı: options dizisi ve correctIndex
        answersArray = question.options.map((option, index) => ({
          text: option,
          isCorrect: index === question.correctIndex
        }));
        console.log('Options ve correctIndex formatından answers oluşturuldu:', answersArray);
      } else if (question.answers && Array.isArray(question.answers)) {
        // Frontend formatı: answers dizisi
        answersArray = question.answers;
        console.log('Mevcut answers kullanılıyor:', answersArray);
      } else {
        // Varsayılan boş format
        answersArray = [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ];
        console.log('Boş answers oluşturuldu');
      }
      
      // En az 4 cevap seçeneği olmasını sağla
      while (answersArray.length < 4) {
        answersArray.push({ text: '', isCorrect: false });
      }
      
      setFormData({
        questionText: question.questionText || '',
        duration: question.duration || 30,
        points: question.points || 100,
        answers: answersArray,
        image: question.image || ''
      });
    }
  }, [question]);
  
  // Form alanı değişikliğini izle
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    console.log(`Form alanı değişti: ${name} = ${value} (${type})`);
    
    const newValue = type === 'number' ? parseInt(value, 10) : value;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: newValue
      };
      console.log('Güncellenen form verileri:', updatedData);
      return updatedData;
    });
    
    setError('');
  };
  
  // Cevap metnini güncelle
  const handleAnswerTextChange = (index, text) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = { ...newAnswers[index], text };
    setFormData(prev => ({ ...prev, answers: newAnswers }));
    setError('');
  };
  
  // Doğru cevabı işaretle
  const handleCorrectAnswerChange = (index) => {
    const newAnswers = formData.answers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index
    }));
    setFormData(prev => ({ ...prev, answers: newAnswers }));
    setError('');
  };
  
  // Formu kaydet
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form gönderim başladı');
    console.log('Form verileri:', JSON.stringify(formData, null, 2));
    
    // Formun geçerliliğini kontrol et
    if (!formData.questionText.trim()) {
      setError('Soru metni gereklidir');
      console.log('HATA: Soru metni boş');
      return;
    }
    
    // En az iki cevap seçeneği olmalı ve boş olmamalı
    const validAnswers = formData.answers.filter(answer => answer.text.trim() !== '');
    if (validAnswers.length < 2) {
      setError('En az iki cevap seçeneği girmelisiniz');
      return;
    }
    
    // En az bir doğru cevap olmalı
    const hasCorrectAnswer = formData.answers.some(answer => answer.isCorrect && answer.text.trim() !== '');
    if (!hasCorrectAnswer) {
      setError('Bir doğru cevap seçmelisiniz');
      return;
    }
    
    // Geçerli cevapları filtrele ve kaydet
    const filteredAnswers = formData.answers
      .filter(answer => answer.text.trim() !== '')
      .map((answer, index) => ({ 
        text: answer.text,
        isCorrect: answer.isCorrect 
      }));
    
    // Süre, puan ve görsel URL değerlerini açıkça belirtiyoruz - Özel değerleri loglama
    console.log('Dönüştürmeden önce değerler:', {
      duration: formData.duration,
      durationType: typeof formData.duration,
      points: formData.points,
      pointsType: typeof formData.points,
      image: formData.image,
      imageType: typeof formData.image
    });
    
    // Değerleri dönüştür - Number constructor kullanalım
    // Önce Number ile deneyelim, eğer NaN olursa parseInt kullanalım
    let numericDuration = Number(formData.duration);
    if (isNaN(numericDuration)) {
      numericDuration = parseInt(formData.duration) || 30;
    }
    
    let numericPoints = Number(formData.points);
    if (isNaN(numericPoints)) {
      numericPoints = parseInt(formData.points) || 100;
    }
    
    // Eğer hala NaN iseler, varsayılan değerleri kullan
    if (isNaN(numericDuration)) numericDuration = 30;
    if (isNaN(numericPoints)) numericPoints = 100;
    
    const imageUrl = formData.image || '';
    
    // Dönüşüm sonrası değerleri loglama
    console.log('Dönüştürmeden sonra değerler:', {
      numericDuration,
      numericPoints,
      imageUrl,
      durationConverted: typeof numericDuration,
      pointsConverted: typeof numericPoints
    });
    
    // Son form verilerini oluştur
    const finalFormData = {
      questionText: formData.questionText,
      duration: numericDuration,
      points: numericPoints,
      image: imageUrl,
      answers: filteredAnswers
    };
    
    console.log('Kaydetmek için gönderilen form verileri:', finalFormData);
    
    // Form verilerini kaydedecek fonksiyonu çağır
    onSave(finalFormData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="card bg-white p-6 mb-6">
      <h3 className="text-xl font-bold mb-4 text-secondary">
        {question ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
      </h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-2">
          Soru Metni*
        </label>
        <textarea
          id="questionText"
          name="questionText"
          rows="3"
          value={formData.questionText}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary"
          placeholder="Soru metni girin"
          required
        ></textarea>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Süre (saniye)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            min="5"
            max="120"
            value={formData.duration}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
            Puan Değeri
          </label>
          <input
            type="number"
            id="points"
            name="points"
            min="10"
            max="1000"
            step="10"
            value={formData.points}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
          Resim URL (opsiyonel)
        </label>
        <input
          type="text"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary"
          placeholder="https://"
        />
      </div>
      
      <div className="mb-6">
        <p className="block text-sm font-medium text-gray-700 mb-3">
          Cevap Seçenekleri*
        </p>
        
        {formData.answers.map((answer, index) => (
          <div key={index} className="flex items-center mb-3">
            <input
              type="radio"
              name="correctAnswer"
              checked={answer.isCorrect}
              onChange={() => handleCorrectAnswerChange(index)}
              className="h-5 w-5 text-primary border-gray-300 focus:ring-primary mr-3"
            />
            <input
              type="text"
              value={answer.text}
              onChange={(e) => handleAnswerTextChange(index, e.target.value)}
              placeholder={`Seçenek ${index + 1}`}
              className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-primary focus:border-primary flex-grow"
            />
          </div>
        ))}
        <p className="text-xs text-gray-500 mt-2 italic">
          Doğru cevabın yanındaki butonu işaretleyin. En az 2 seçenek girilmeli.
        </p>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
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

export default QuestionForm;
