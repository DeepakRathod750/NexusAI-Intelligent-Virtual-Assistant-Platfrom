const express = require('express');
const router = express.Router();
const writeController = require('../controllers/writeController');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, writeController.processWrite);

module.exports = router;
