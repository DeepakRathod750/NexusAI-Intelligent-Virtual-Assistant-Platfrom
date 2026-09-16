const { generateChatResponse } = require('../services/ollama.service');
const { saveChatMessage, getChatHistory, clearChatHistory, saveHistory } = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const Session = require('../models/Session');

const chat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user.id;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return errorResponse(res, 400, 'Message is required');
        }

        let session;
        let history = [];

        if (sessionId) {
            session = await Session.findOne({ _id: sessionId, user: userId });
            if (session) {
                history = session.content; // In chat sessions, content is the message array
            }
        }

        // 1. Generate AI Response using Ollama (pass formatted history)
        const combinedMessages = [
            { role: 'system', content: 'You are NexusAI, a high-performance enterprise AI assistant. Be concise, accurate, and professional.' },
            ...history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content })),
            { role: 'user', content: message.trim() }
        ];
        const aiResponseText = await generateChatResponse(combinedMessages);

        // 2. Prepare new message pair
        const newMessages = [
            ...history,
            { role: 'user', content: message.trim(), timestamp: new Date() },
            { role: 'assistant', content: aiResponseText, timestamp: new Date() }
        ];

        // 3. Save/Update Session
        if (session) {
            session.content = newMessages;
            session.updatedAt = Date.now();
            session.markModified('content'); // Fix: Required for Mixed type
            await session.save();
        } else {
            session = new Session({
                user: userId,
                title: message.trim().slice(0, 40) + (message.length > 40 ? '...' : ''),
                type: 'chat',
                content: newMessages
            });
            await session.save();
        }

        // 4. Also save to legacy history (optional for backward compatibility)
        await saveHistory(userId, {
            type: 'chat',
            title: session.title,
            content: message.trim(),
            response: aiResponseText
        });

        // 5. Save individual messages to ChatMessage model (for global history and stats)
        await saveChatMessage(userId, 'user', message.trim());
        await saveChatMessage(userId, 'assistant', aiResponseText);

        // 6. Return structured response
        successResponse(res, 'AI Response generated', {
            reply: aiResponseText,
            sessionId: session._id,
            role: 'assistant'
        });

    } catch (err) {
        errorResponse(res, 500, 'Failed to process chat message', err.message);
    }
};

const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await getChatHistory(userId, 50);
        successResponse(res, 'Chat history retrieved', history);
    } catch (err) {
        errorResponse(res, 500, 'Failed to retrieve chat history', err.message);
    }
};

const deleteHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        await clearChatHistory(userId); // Clean service-layer call — no inline DB logic
        successResponse(res, 'Chat history cleared');
    } catch (err) {
        errorResponse(res, 500, 'Failed to clear chat history', err.message);
    }
};

module.exports = {
    chat,
    getHistory,
    deleteHistory
};
