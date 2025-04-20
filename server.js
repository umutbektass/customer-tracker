require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware'); // Hata yöneticisini import et

connectDB();

const app = express();
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 


app.get('/', (req, res) => {
  res.send('Müşteri Takip Sistemi Backend API Çalışıyor!');
});

// API Rotalarını Tanımla (ileride ekleyeceğiz)
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor...`));