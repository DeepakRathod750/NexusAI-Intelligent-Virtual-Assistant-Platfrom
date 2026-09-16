const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, historyController.getAllHistory);
router.get('/:type', authenticate, historyController.getHistoryByType);

module.exports = router;
