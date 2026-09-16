const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'general'
    },
    tags: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
