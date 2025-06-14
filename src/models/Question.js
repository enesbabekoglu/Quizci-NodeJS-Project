const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    validate: {
      validator: function(options) {
        return options.length >= 2 && options.length <= 5;
      },
      message: 'Sorular en az 2 en fazla 5 seçenek içermelidir'
    },
    required: true
  },
  correctIndex: {
    type: Number,
    required: true,
    min: 0
  },
  // Puan alanı ekle
  points: {
    type: Number, 
    default: 100,
    min: 0
  },
  // Süre alanı ekle (saniye cinsinden)
  duration: {
    type: Number,
    default: 30,
    min: 5,
    max: 300
  },
  // Görsel URL alanı ekle
  image: {
    type: String,
    default: ''
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video', null],
      default: null
    },
    url: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Düzgün doğru cevap kontrolü
questionSchema.pre('save', function(next) {
  if (this.correctIndex >= this.options.length) {
    return next(new Error('Doğru cevap indeksi, seçenek sayısından büyük olamaz'));
  }
  next();
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
