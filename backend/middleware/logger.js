const dbService = require('../services/db.service');

/**
 * Middleware to log every API request to the database.
 */
const systemLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const level = status >= 400 ? 'error' : (status >= 300 ? 'warning' : 'info');
        
        // Log asynchronously to avoid blocking
        dbService.logEvent({
            user_id: req.user ? req.user.id : null,
            event: `${req.method} ${req.originalUrl}`,
            level: level,
            method: req.method,
            path: req.originalUrl,
            status: status,
            metadata: {
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            }
        }).catch(err => console.error('Failed to save system log:', err.message));
    });
    
    next();
};


module.exports = systemLogger;
