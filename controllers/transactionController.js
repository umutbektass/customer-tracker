const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer'); 


const addTransaction = async (req, res, next) => {
    const { customerId, type, amount, date, description } = req.body;

    if (!customerId || !type || !amount) {
        res.status(400);
        return next(new Error('Müşteri ID, işlem tipi ve tutar zorunludur.'));
    }

    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            res.status(404);
            return next(new Error('İşlem eklenmek istenen müşteri bulunamadı.'));
        }

        const transaction = await Transaction.create({
            customerId,
            type,
            amount,
            date, 
            description
          
        });

        customer.lastActivityDate = transaction.date || Date.now();
        await customer.save();

        res.status(201).json({
            success: true,
            message: 'İşlem başarıyla eklendi.',
            transaction: transaction
        });

    } catch (error) {
        console.error('İşlem Ekleme Hatası:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            res.status(400);
            return next(new Error(messages.join(', ')));
        }
         if (error.name === 'CastError' && error.path === 'customerId') {
             res.status(400);
             return next(new Error('Geçersiz müşteri ID formatı.'));
         }
        next(new Error('İşlem eklenirken bir sunucu hatası oluştu.'));
    }
};


const getTransactionsByCustomer = async (req, res, next) => {
    try {
         const customerExists = await Customer.findById(req.params.customerId);
         if (!customerExists) {
             res.status(404);
             return next(new Error('Müşteri bulunamadı.'));
         }

        const transactions = await Transaction.find({ customerId: req.params.customerId })
                                           .sort({ date: -1 }); 

        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions: transactions
        });

    } catch (error) {
        console.error('Müşteriye Ait İşlemleri Listeleme Hatası:', error);
        if (error.name === 'CastError') {
             res.status(400);
             return next(new Error('Geçersiz müşteri ID formatı.'));
         }
        next(new Error('İşlemler listelenirken bir sunucu hatası oluştu.'));
    }
};



const getAllTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({})
                                           .populate('customerId', 'name email') 
                                           .sort({ date: -1 }); 
        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions: transactions
        });

    } catch (error) {
        console.error('Tüm İşlemleri Listeleme Hatası:', error);
        next(new Error('Tüm işlemler listelenirken bir sunucu hatası oluştu.'));
    }
};


module.exports = {
    addTransaction,
    getTransactionsByCustomer,
    getAllTransactions
};