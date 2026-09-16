const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authenticateUser = require('../middleware/auth');

router.use(authenticateUser);

router.post('/brainstorm', aiController.brainstorm);
router.post('/analyze', aiController.analyze);
router.post('/tasks/ai', aiController.decompose);
router.post('/live-interaction/save', aiController.saveLiveInteraction);

module.exports = router;

