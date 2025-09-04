const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true }
}, { timestamps: true });

// Compound index to ensure one like per user per comment
commentLikeSchema.index({ user: 1, comment: 1 }, { unique: true });

const CommentLike = mongoose.model('CommentLike', commentLikeSchema);

module.exports = CommentLike;
