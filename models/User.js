const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Kullanıcı adı zorunludur.'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'E-posta zorunludur.'],
    unique: true,
    match: [ /^\S+@\S+\.\S+$/, 'Lütfen geçerli bir e-posta adresi girin.'],
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Şifre zorunludur.'],
    minlength: 6,
    select: false, 
  },
  isAdmin: {
    type: Boolean,
    default: true, 
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false, 
  },
  twoFactorSecret: { 
    type: String,
    select: false, 
  },
  twoFactorMethod: { 
    type: String,
    enum: ['email', 'authenticator', null], 
    default: null,
  },
  emailVerificationCode: {
      type: String,
      select: false
  },
  emailVerificationCodeExpires: {
      type: Date,
      select: false
  },
}, {
    timestamps: true
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; 
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);