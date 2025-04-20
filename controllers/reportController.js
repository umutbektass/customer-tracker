const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const mongoose = require('mongoose'); // ObjectId kontrolü için gerekebilir


const getSummaryReport = async (req, res, next) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        res.status(400);
        return next(new Error('Başlangıç (startDate) ve bitiş (endDate) tarihleri gereklidir. Format: YYYY-MM-DD'));
    }

    try {
        const start = new Date(startDate); 
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
             res.status(400);
             return next(new Error('Geçersiz tarih formatı. Format: YYYY-MM-DD'));
        }

        const summary = await Transaction.aggregate([
            {
                $match: {
                    date: {
                        $gte: start,
                        $lt: end    
                    }
                }
            },
            {
                $group: {
                    _id: '$type', 
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        let totalIncoming = 0;
        let totalOutgoing = 0;

        summary.forEach(item => {
            if (item._id === 'gelen') {
                totalIncoming = item.totalAmount;
            } else if (item._id === 'giden') {
                totalOutgoing = item.totalAmount;
            }
        });

        const netProfit = totalIncoming - totalOutgoing;

        res.status(200).json({
            success: true,
            report: {
                startDate: startDate,
                endDate: endDate,
                totalIncoming: totalIncoming,
                totalOutgoing: totalOutgoing,
                netProfit: netProfit
            }
        });

    } catch (error) {
        console.error('Özet Rapor Hatası:', error);
        next(new Error('Rapor oluşturulurken bir sunucu hatası oluştu.'));
    }
};



const getTopCustomersReport = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 5;
    const { startDate, endDate } = req.query;

    try {
        const matchStage = {}; // Tarih filtresi için boş match objesi

        if (startDate && endDate) {
             const start = new Date(startDate);
             const end = new Date(endDate);
             end.setDate(end.getDate() + 1);

             if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                 matchStage.date = { $gte: start, $lt: end };
             } else {
                 console.warn('Top Customers: Geçersiz tarih formatı, tarih filtresi uygulanmadı.');
             }
        }


        const topCustomers = await Transaction.aggregate([
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
            {
                $group: {
                    _id: '$customerId', 
                    transactionCount: { $sum: 1 } 
                }
            },
            {
                $sort: {
                    transactionCount: -1 
                }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'customers', 
                    localField: '_id', 
                    foreignField: '_id', 
                    as: 'customerInfo' 
                }
            },
            {
               $unwind: {
                   path: '$customerInfo',
                   preserveNullAndEmptyArrays: true 
               }
            },
            {
                $project: {
                    _id: 0, 
                    customerId: '$_id', 
                    name: '$customerInfo.name', 
                    email: '$customerInfo.email', 
                    transactionCount: 1 
                }
            }
        ]);

        res.status(200).json({
            success: true,
            report: topCustomers
        });

    } catch (error) {
        console.error('Top Müşteriler Rapor Hatası:', error);
        next(new Error('Rapor oluşturulurken bir sunucu hatası oluştu.'));
    }
};


module.exports = {
    getSummaryReport,
    getTopCustomersReport
};