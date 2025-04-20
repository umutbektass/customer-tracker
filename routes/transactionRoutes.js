const express = require('express');
const {
    addTransaction,
    getAllTransactions
} = require('../controllers/transactionController');

const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.use(protect);

router.post('/', protect,addTransaction);    

router.get('/',protect, getAllTransactions);   

module.exports = router;