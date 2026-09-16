const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['chat', 'email', 'meeting', 'resume', 'doc', 'writing', 'brainstorm', 'tasks'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });

// Index for faster user-specific queries and sorting
SessionSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Session', SessionSchema);
