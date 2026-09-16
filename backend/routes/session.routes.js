const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', sessionController.getUserSessions);
router.post('/', sessionController.createSession);
router.delete('/', sessionController.deleteSessions);
router.get('/:id', sessionController.getSessionById);
router.put('/:id', sessionController.updateSession);

module.exports = router;
