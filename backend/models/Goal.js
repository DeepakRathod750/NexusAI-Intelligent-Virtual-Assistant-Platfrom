const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Work', 'Personal', 'Health', 'Learning', 'Other'],
        default: 'Work'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'on-hold'],
        default: 'active'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    deadline: Date,
    description: String,
    neural_milestones: {
        type: Map,
        of: {
            tip: String,
            motivation: String,
            generatedAt: { type: Date, default: Date.now }
        },
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
