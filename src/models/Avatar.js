const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  // Admin kullanıcıya referans
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Dosya adından görünen ismi oluştur (büyük harfle başlama ve _ işaretlerini boşluğa dönüştürme)
avatarSchema.pre('save', function(next) {
  if (!this.displayName && this.name) {
    // Dosya uzantısını çıkar
    let baseName = this.name.split('.').slice(0, -1).join('.');
    // Alt çizgileri boşluğa dönüştür
    let displayName = baseName.replace(/_/g, ' ');
    // Kelimelerin ilk harflerini büyük yap
    this.displayName = displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  next();
});

const Avatar = mongoose.model('Avatar', avatarSchema);

module.exports = Avatar;
