const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const authenticateUser = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', knowledgeController.getItems);
router.post('/', knowledgeController.addItem);
router.delete('/:id', knowledgeController.removeItem);

module.exports = router;
