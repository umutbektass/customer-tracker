// backend/controllers/customerController.js

const Customer = require('../models/Customer');
// const Transaction = require('../models/TransactionModel'); // Silme işleminde belki lazım olur




/**
 * @desc    Yeni bir müşteri ekler
 * @route   POST /api/customers
 * @access  Private (Admin)
 */
const addCustomer = async (req, res, next) => {
    const { name, phone, email, description } = req.body;

    // Gerekli alan kontrolü (Modeldeki 'required' bunu zaten yapar)
    // if (!name) {
    //     res.status(400);
    //     return next(new Error('Müşteri adı zorunludur.'));
    // }

    try {
        // Yeni müşteri dokümanını oluştur
        const customer = await Customer.create({
            name,
            phone,
            email,
            description,
            // registrationDate veya addedBy gibi alanlar modelde varsa eklenebilir
        });

        // Başarılı olursa 201 Created status kodu daha uygun
        res.status(201).json({
            success: true,
            message: 'Müşteri başarıyla eklendi.',
            customer: customer // Oluşturulan müşteriyi yanıtta döndür
        });

    } catch (error) {
        console.error('Müşteri Ekleme Hatası:', error);
        // Mongoose validasyon hatalarını yakalama
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            res.status(400); // Bad Request
            return next(new Error(messages.join(', ')));
        }
         // Duplicate key hatası (eğer email unique ise)
         if (error.code === 11000) {
             const field = Object.keys(error.keyValue)[0];
             res.status(400); // Bad Request
             return next(new Error(`Bu ${field} zaten kullanımda.`));
         }
        // Diğer hatalar için merkezi yöneticiye ilet
        next(new Error('Müşteri eklenirken bir sunucu hatası oluştu.'));
    }
};
/**
 * @desc    Belirli bir müşteriyi ID ile getirir
 * @route   GET /api/customers/:id
 * @access  Private (Admin)
 */
const getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            res.status(404);
            return next(new Error('Müşteri bulunamadı.'));
        }

        res.status(200).json({
            success: true,
            customer: customer
        });

    } catch (error) {
        console.error('Müşteri Getirme (ID) Hatası:', error);
        // Eğer ID formatı geçersizse Mongoose CastError verir
        if (error.name === 'CastError') {
             res.status(400);
             return next(new Error('Geçersiz müşteri ID formatı.'));
        }
        next(new Error('Müşteri getirilirken bir sunucu hatası oluştu.'));
    }
};

/**
 * @desc    Bir müşterinin bilgilerini günceller
 * @route   PUT /api/customers/:id
 * @access  Private (Admin)
 */
const updateCustomer = async (req, res, next) => {
    try {
        // Güncellenecek müşteriyi bul ve veriyi güncelle.
        // { new: true } -> güncellenmiş veriyi döndürmesini sağlar.
        // { runValidators: true } -> güncelleme sırasında modeldeki validasyonların çalışmasını sağlar.
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!customer) {
            res.status(404);
            return next(new Error('Güncellenecek müşteri bulunamadı.'));
        }

        res.status(200).json({
            success: true,
            message: 'Müşteri başarıyla güncellendi.',
            customer: customer
        });

    } catch (error) {
        console.error('Müşteri Güncelleme Hatası:', error);
        // Validasyon veya CastError hatalarını yakala
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            res.status(400);
            return next(new Error(messages.join(', ')));
        }
         if (error.name === 'CastError') {
             res.status(400);
             return next(new Error('Geçersiz müşteri ID formatı.'));
         }
         // Duplicate key hatası (eğer email unique ise ve değiştiriliyorsa)
         if (error.code === 11000) {
             const field = Object.keys(error.keyValue)[0];
             res.status(400);
             return next(new Error(`Bu ${field} zaten kullanımda.`));
         }
        next(new Error('Müşteri güncellenirken bir sunucu hatası oluştu.'));
    }
};

/**
 * @desc    Bir müşteriyi siler
 * @route   DELETE /api/customers/:id
 * @access  Private (Admin)
 */
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id); // Önce bulalım

        if (!customer) {
            res.status(404);
            return next(new Error('Silinecek müşteri bulunamadı.'));
        }

        await customer.deleteOne(); // VEYA await Customer.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Müşteri başarıyla silindi.'
            // Genellikle silme işleminden sonra veri döndürülmez (204 No Content de kullanılabilirdi)
            // data: {} // Veya boş bir obje
        });

    } catch (error) {
        console.error('Müşteri Silme Hatası:', error);
         if (error.name === 'CastError') {
             res.status(400);
             return next(new Error('Geçersiz müşteri ID formatı.'));
         }
        next(new Error('Müşteri silinirken bir sunucu hatası oluştu.'));
    }
};

const getCustomers = async (req, res, next) => {
    try {
        // Tüm müşterileri bul. Son ekleneni üste getirmek için sıralayabiliriz:
        const customers = await Customer.find({}).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: customers.length, // Toplam müşteri sayısı
            customers: customers   // Müşteri listesi
        });

    } catch (error) {
        console.error('Müşterileri Listeleme Hatası:', error);
        next(new Error('Müşteriler listelenirken bir sunucu hatası oluştu.'));
    }
};


// Fonksiyonları export etmeyi unutmayın:
module.exports = {
    addCustomer,
    getCustomers,
    getCustomerById, // Yeni eklendi
    updateCustomer,  // Yeni eklendi
    deleteCustomer   // Yeni eklendi
};