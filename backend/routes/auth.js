const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');

// Public endpoints (Note: Firebase handles registration/login on frontend)
// These routes are now mostly for profile synchronization via the 'authenticate' middleware

// Protected endpoints
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, authController.updateProfile);
router.delete('/profile', authenticate, authController.deleteProfile);

module.exports = router;
