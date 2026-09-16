const dbService = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await dbService.getDashboardStats(userId);
        successResponse(res, 'Dashboard stats retrieved', stats);
    } catch (err) {
        errorResponse(res, 500, 'Failed to fetch dashboard stats', err.message);
    }
};

const getLogs = async (req, res) => {
    try {
        const logs = await dbService.getRecentLogs(10);
        successResponse(res, 'Recent system logs retrieved', logs);
    } catch (err) {
        errorResponse(res, 500, 'Failed to fetch system logs', err.message);
    }
};

module.exports = {
    getStats,
    getLogs
};
