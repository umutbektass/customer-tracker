const express = require('express');
const {
    loginUser,
    setupTwoFactor,
    verifyAndEnableTwoFactor,
    verifyTwoFactorLogin,
    disableTwoFactor,
    getMe
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

router.post('/login', loginUser);
router.post('/verify-login-2fa', verifyTwoFactorLogin);


router.get('/me', protect, getMe); 
router.post('/setup-2fa', protect, setupTwoFactor);
router.post('/verify-enable-2fa', protect, verifyAndEnableTwoFactor); 
router.post('/disable-2fa', protect, disableTwoFactor); 

module.exports = router;