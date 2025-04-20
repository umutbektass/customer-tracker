
const express = require('express');
const {
    getSummaryReport,        
    getTopCustomersReport     
} = require('../controllers/reportController'); 

const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.use(protect);

router.get('/summary', getSummaryReport);

router.get('/top-customers', getTopCustomersReport);

module.exports = router; 