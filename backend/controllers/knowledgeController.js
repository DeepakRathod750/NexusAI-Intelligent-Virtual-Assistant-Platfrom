const { getKnowledgeItems, createKnowledgeItem, deleteKnowledgeItem } = require('../services/db.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const ollamaService = require('../services/ollama.service');

const getItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await getKnowledgeItems(userId);
        successResponse(res, 'Knowledge items retrieved', items);
    } catch (err) {
        errorResponse(res, 500, 'Failed to retrieve knowledge items', err.message);
    }
};

const addItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, tags: manualTags } = req.body;

        if (!title || !content) {
            return errorResponse(res, 400, 'Title and content are required');
        }

        // Auto-generate tags if not provided
        let tags = manualTags || [];
        if (tags.length === 0) {
            const aiTags = await ollamaService.generateKnowledgeTags(title, content);
            tags = aiTags;
        }

        const item = await createKnowledgeItem(userId, {
            title: title.trim(),
            content: content.trim(),
            category: req.body.category || req.body.type || 'general',
            tags: tags
        });

        successResponse(res, 'Knowledge item created', item);
    } catch (err) {
        errorResponse(res, 500, 'Failed to create knowledge item', err.message);
    }
};

const removeItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await deleteKnowledgeItem(id, userId);
        successResponse(res, 'Knowledge item deleted');
    } catch (err) {
        errorResponse(res, 500, 'Failed to delete knowledge item', err.message);
    }
};

module.exports = {
    getItems,
    addItem,
    removeItem
};
