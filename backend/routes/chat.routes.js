const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateUser = require('../middleware/auth');

router.use(authenticateUser);

router.post('/', chatController.chat);
router.get('/history', chatController.getHistory);
router.delete('/history', chatController.deleteHistory); // Fixed: was clearHistory

module.exports = router;
