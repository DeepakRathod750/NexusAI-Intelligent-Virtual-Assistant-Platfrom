const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
