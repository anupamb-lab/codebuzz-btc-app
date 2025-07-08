const express = require('express');
const {
  register,
  login,
  socialLogin,
  getMe,
  forgotPassword,
  resetPassword,
  updatePasswordDirect,
  logout
} = require('../controllers/authController');

const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/update-password-direct', updatePasswordDirect); // For testing purposes

// Protected routes
router.get('/me', auth, getMe);
router.get('/logout', auth, logout);

module.exports = router;
