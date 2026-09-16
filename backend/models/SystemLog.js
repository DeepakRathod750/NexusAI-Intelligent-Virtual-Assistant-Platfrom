const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Some logs might be anonymous (e.g. login failures)
    },
    event: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    method: String,
    path: String,
    status: Number,
    error_detail: String,
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('SystemLog', SystemLogSchema);
