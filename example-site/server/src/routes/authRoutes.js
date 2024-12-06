const express = require('express');
const router = express.Router();
const { register, initLogin, verifyLogin, getProtectedData } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login/init', initLogin);
router.post('/login/verify', verifyLogin);

// Protected routes
router.get('/protected', requireAuth, getProtectedData);

module.exports = router; 