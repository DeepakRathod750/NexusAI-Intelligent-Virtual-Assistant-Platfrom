const { generateWritingResponse } = require('../services/ollama.service');
const { saveHistory } = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const Session = require('../models/Session');

const processWrite = async (req, res) => {
    try {
        const { type, text, sessionId } = req.body;
        const userId = req.user.id;

        if (!text || !type) {
            return errorResponse(res, 400, 'Text and type are required');
        }

        const validTypes = ['shorten', 'expand', 'grammar', 'translate', 'email', 'meeting', 'resume', 'draft', 'rewrite'];
        if (!validTypes.includes(type)) {
            return errorResponse(res, 400, 'Invalid writing tool type');
        }


        const result = await generateWritingResponse(type, text);

        // Save/Update Session
        let session;
        if (sessionId) {
            session = await Session.findOneAndUpdate(
                { _id: sessionId, user: userId },
                { 
                    content: { input: text, output: result },
                    updatedAt: Date.now() 
                },
                { new: true }
            );
        }

        if (!session) {
            session = new Session({
                user: userId,
                title: text.trim().slice(0, 40) + "...",
                type: type === 'shorten' || type === 'expand' || type === 'grammar' || type === 'translate' ? 'writing' : type,
                content: { input: text, output: result }
            });
            await session.save();
        }

        // Save to Legacy History
        await saveHistory(userId, {
            type: session.type, // Use specific type (email, meeting, resume, etc.)
            title: session.title,
            content: text,
            response: result
        });

        successResponse(res, 'Content processed', { result, sessionId: session._id });
    } catch (err) {
        console.error('[WRITE CONTROLLER ERROR]', err);
        errorResponse(res, 500, 'Writing tool failed', err.message);
    }
};

module.exports = {
    processWrite
};
