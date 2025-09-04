const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true },
  likes: { type: Number, default: 0 },
  // Optional: reply functionality
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  repliesCount: { type: Number, default: 0 }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
