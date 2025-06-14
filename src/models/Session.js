const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  pin: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  currentQuestion: {
    type: Number,
    default: -1
  },
  participants: [{
    nickname: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    answers: [Number]
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
});

// PIN kodu oluşturma yardımcı fonksiyonu
sessionSchema.statics.generatePin = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
