const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    community: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        required: true
    },
    whoCanAnswer: {
        type: [String]
    },
    askAnonymously: {
        type: Boolean,
        default: false
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    },
    answersCount: { type: Number, default: 0 },
    hasAcceptedAnswer: { type: Boolean, default: true }
}, {
    timestamps: true
});


const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
