const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Müşteri adı zorunludur.'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    match: [ /^\S+@\S+\.\S+$/, 'Lütfen geçerli bir e-posta adresi girin.'],
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
  },

  lastActivityDate: { 
      type: Date
  }

}, {
  timestamps: true 
});

module.exports = mongoose.model('Customer', CustomerSchema);