const mongoose = require('mongoose');

const avatarCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// İsim güncellemesi olduğunda updatedAt değerini güncelle
avatarCategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Eğer displayName belirtilmemişse, name'den oluştur
  if (!this.displayName && this.name) {
    // Alt çizgileri boşluğa dönüştür
    let displayName = this.name.replace(/_/g, ' ');
    // Kelimelerin ilk harflerini büyük yap
    this.displayName = displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  next();
});

const AvatarCategory = mongoose.model('AvatarCategory', avatarCategorySchema);

module.exports = AvatarCategory;
