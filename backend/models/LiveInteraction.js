const mongoose = require('mongoose');

const LiveInteractionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Voice Interaction'
    },
    transcript: {
        type: [String],
        default: []
    },
    duration: Number,
    tokens_used: Number
}, { timestamps: true });

module.exports = mongoose.model('LiveInteraction', LiveInteractionSchema);
