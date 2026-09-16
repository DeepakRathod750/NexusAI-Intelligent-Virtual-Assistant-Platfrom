const mongoose = require('mongoose');

const BrainstormIdeaSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    ideas: {
        type: [String],
        default: []
    },
    category: String,
    tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('BrainstormIdea', BrainstormIdeaSchema);
