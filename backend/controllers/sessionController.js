const Session = require('../models/Session');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const createSession = async (req, res) => {
    try {
        const { title, type, content, metadata } = req.body;
        const userId = req.user.id;

        if (!title || !type || !content) {
            return errorResponse(res, 400, 'Title, type, and content are required');
        }

        const session = new Session({
            user: userId,
            title,
            type,
            content,
            metadata: metadata || {}
        });

        await session.save();
        successResponse(res, 'Session created successfully', session);
    } catch (err) {
        errorResponse(res, 500, 'Failed to create session', err.message);
    }
};

const getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        const { type } = req.query;

        const filter = { user: userId };
        if (type) filter.type = type;

        const sessions = await Session.find(filter)
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('title type updatedAt content metadata'); // Included content for easier loading

        successResponse(res, 'Sessions retrieved', sessions);
    } catch (err) {

        errorResponse(res, 500, 'Failed to fetch sessions', err.message);
    }
};

const getSessionById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const session = await Session.findOne({ _id: id, user: userId });
        if (!session) {
            return errorResponse(res, 404, 'Session not found or unauthorized');
        }

        successResponse(res, 'Session loaded', session);
    } catch (err) {
        errorResponse(res, 500, 'Failed to load session', err.message);
    }
};

const updateSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { content, title } = req.body;

        const session = await Session.findOneAndUpdate(
            { _id: id, user: userId },
            { 
                ...(content && { content }), 
                ...(title && { title }),
                updatedAt: Date.now() 
            },
            { new: true }
        );

        if (!session) {
            return errorResponse(res, 404, 'Session not found or unauthorized');
        }

        successResponse(res, 'Session updated', session);
    } catch (err) {
        errorResponse(res, 500, 'Failed to update session', err.message);
    }
};

const deleteSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        await Session.deleteMany({ user: userId });
        successResponse(res, 'All sessions deleted successfully');
    } catch (err) {
        errorResponse(res, 500, 'Failed to delete sessions', err.message);
    }
};

module.exports = {
    createSession,
    getUserSessions,
    getSessionById,
    updateSession,
    deleteSessions
};
