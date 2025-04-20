const express = require('express');
const {
    addCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customerController');

const { getTransactionsByCustomer } = require('../controllers/transactionController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(addCustomer)     
    .get(getCustomers);   

router.route('/:id')
    .get(getCustomerById)  
    .put(updateCustomer)
    .delete(deleteCustomer); 


router.get('/:customerId/transactions', getTransactionsByCustomer);

module.exports = router;