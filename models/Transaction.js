const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', 
    required: [true, 'İşlem bir müşteriye ait olmalıdır.'],
    index: true, 
  },
  type: { 
    type: String,
    required: true,
    enum: ['gelen', 'giden'], 
  },
  amount: { // Tutar
    type: Number,
    required: [true, 'Tutar zorunludur.'],
    min: [0.01, 'Tutar pozitif olmalıdır.'],
  },
  date: {
    type: Date,
    required: [true, 'İşlem tarihi zorunludur.'],
    default: Date.now,
    index: true, 
  },
  description: { 
    type: String,
    trim: true,
  },

}, {
  timestamps: true 
});

module.exports = mongoose.model('Transaction', TransactionSchema);