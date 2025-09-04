const mongoose = require('mongoose');

const answerVoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer', required: true },
  voteType: { type: String, enum: ['upvote', 'downvote'], required: true }
}, { timestamps: true });

// Compound index to ensure one vote per user per answer
answerVoteSchema.index({ user: 1, answer: 1 }, { unique: true });

const AnswerVote = mongoose.model('AnswerVote', answerVoteSchema);

module.exports = AnswerVote
