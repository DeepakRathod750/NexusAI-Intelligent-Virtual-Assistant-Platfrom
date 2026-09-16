const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    theme: {
        type: String,
        default: 'System'
    },
    ai_model: {
        type: String,
        default: 'gpt-4o-mini'
    },
    notifications: {
        app_updates: { type: Boolean, default: true },
        ai_suggestions: { type: Boolean, default: true },
        security_alerts: { type: Boolean, default: true },
        email_digest: { type: Boolean, default: false }
    },
    privacy: {
        data_collection: { type: Boolean, default: true },
        chat_history: { type: Boolean, default: true },
        show_status: { type: Boolean, default: true },
        read_receipts: { type: Boolean, default: true }
    },
    ai_preferences: {
        temperature: { type: Number, default: 0.7 },
        response_length: { type: String, default: 'balanced' },
        personality: { type: String, default: 'professional' },
        auto_summarize: { type: Boolean, default: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
