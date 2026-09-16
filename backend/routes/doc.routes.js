const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const docController = require('../controllers/docController');
const authenticate = require('../middleware/auth');

// Configure Multer for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Increase to 5MB to be safe, we'll check properly in controller
    fileFilter: (req, file, cb) => {
        console.log(`📥 Multer receiving file: ${file.originalname} (${file.mimetype})`);
        cb(null, true); // Accept all for now, filter in controller
    }
});

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

router.use((req, res, next) => {
    console.log(`📡 Incoming Doc Analysis Request: ${req.method} ${req.originalUrl}`);
    next();
});

router.post('/analyze', authenticate, upload.single('file'), (req, res, next) => {
    console.log(`✅ Auth and Upload passed for: ${req.file ? req.file.originalname : 'No File'}`);
    next();
}, docController.analyzeDoc);

module.exports = router;
