const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'doc', 'brainstorm', 'live', 'writing', 'task', 'email', 'meeting', 'resume'],
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
  response: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster searching and sorting
HistorySchema.index({ user: 1, createdAt: -1 });
HistorySchema.index({ type: 1 });

module.exports = mongoose.model('History', HistorySchema);
