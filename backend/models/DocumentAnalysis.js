const mongoose = require('mongoose');

const DocumentAnalysisSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    original_text: {
        type: String,
        required: true
    },
    summary: String,
    key_points: [String],
    action_items: [String],
    file_type: String,
    file_size: Number
}, { timestamps: true });

module.exports = mongoose.model('DocumentAnalysis', DocumentAnalysisSchema);
