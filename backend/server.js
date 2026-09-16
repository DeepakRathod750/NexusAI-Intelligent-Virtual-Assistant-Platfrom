const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables FIRST before importing any services
dotenv.config();

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

const systemLogger = require('./middleware/logger');
const authenticateUser = require('./middleware/auth');

const app = express();

app.use((req, res, next) => {
    if (req.originalUrl.includes('doc-analyze')) {
        console.log(`🔍 [TRACE] ${req.method} ${req.originalUrl}`);
        console.log(`   Headers: ${JSON.stringify(req.headers)}`);
    }
    next();
});


// ─── Security Middleware ──────────────────────────────────────────
app.use(helmet()); // Adds secure HTTP headers

// CORS — allow frontend origins (dev + production)
app.use(cors({
    origin: true, // allow all origins (safe for dev)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Body Parsers & Static Files ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Rate Limiting ────────────────────────────────────────────────
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, // Increased for dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' }
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100, // Increased for dev
    message: { success: false, message: 'AI rate limit reached.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased for dev
    message: { success: false, message: 'Too many auth attempts.' }
});

app.use(generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────
app.use(systemLogger); // Log all requests

// Authenticated routes (ordered specific first)
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat.routes'); // Keep original path for chat
const historyRoutes = require('./routes/history');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', aiLimiter, chatRoutes); 
app.use('/api/write', aiLimiter, require('./routes/write.routes'));
app.use('/api/ai', aiLimiter, require('./routes/ai.routes'));
app.use('/api/doc-analyze', aiLimiter, require('./routes/doc.routes'));
app.use('/api/history', historyRoutes);
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/knowledge', require('./routes/knowledge.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/goals', require('./routes/goal.routes'));
app.use('/api/sessions', require('./routes/session.routes'));




// ─── Health Check ─────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'NexusAI Backend is Running',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack || err.message);

    // Handle Multer upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ success: false, message: err.message });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ─── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ NexusAI Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`📡 API Base: http://localhost:${PORT}`);
});
