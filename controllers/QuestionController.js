const { StatusCodes } = require('http-status-codes');
const Question = require('./../models/QuestionModel');
const Vote = require('../models/VoteModel');
const { default: mongoose } = require('mongoose');

const addQuestion = async (req, res) => {
    const user_id = req.user.id;

    try {
        const newQuestion = new Question({ ...req.body, author: user_id });
        await newQuestion.save();
        return res.status(StatusCodes.CREATED).json({
            message: 'New question posted successfully',
            questionId: newQuestion._id
        });
    } catch (error) {
        console.error('Error saving question:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: 'Server error when posting question'
        });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find({});
        return res
            .status(StatusCodes.OK)
            .json({ count: questions.length, questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: 'Server error while fetching questions' });
    }
};

const voteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { voteType } = req.body; // 'upvote' or 'downvote'
        const userId = req.user.id; // assuming you have user auth middleware

        // Validate vote type
        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        // Check if question exists
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Check if user already voted
        const existingVote = await Vote.findOne({ user: userId, question: questionId });

        let voteAction = null;

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                // Same vote type - remove vote (toggle off)
                await Vote.deleteOne({ _id: existingVote._id });
                voteAction = 'removed';

                // Update question counts
                if (voteType === 'upvote') {
                    question.upvotes = Math.max(0, question.upvotes - 1);
                } else {
                    question.downvotes = Math.max(0, question.downvotes - 1);
                }
            } else {
                // Different vote type - update existing vote
                existingVote.voteType = voteType;
                await existingVote.save();
                voteAction = 'updated';

                // Update question counts (remove old vote, add new vote)
                if (voteType === 'upvote') {
                    question.upvotes += 1;
                    question.downvotes = Math.max(0, question.downvotes - 1);
                } else {
                    question.downvotes += 1;
                    question.upvotes = Math.max(0, question.upvotes - 1);
                }
            }
        } else {
            // New vote
            await Vote.create({ user: userId, question: questionId, voteType });
            voteAction = 'created';

            // Update question counts
            if (voteType === 'upvote') {
                question.upvotes += 1;
            } else {
                question.downvotes += 1;
            }
        }

        // Update total score
        question.totalScore = question.upvotes - question.downvotes;
        await question.save();

        res.json({
            success: true,
            action: voteAction,
            voteType: voteAction === 'removed' ? null : voteType,
            upvotes: question.upvotes,
            downvotes: question.downvotes,
            totalScore: question.totalScore
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'You have already voted on this question' });
        }
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

const deleteQuestion = async (req, res) => {
    const { questionId } = req.params;
    const userId = req.user.id;

    try {
        const question = await Question.findById(questionId);

        if (!question) {
            return res
                .status(StatusCodes.NOT_FOUND)
                .json({ message: 'Question not found' });
        }

        if (question.user.toString() !== userId) {
            return res
                .status(StatusCodes.FORBIDDEN)
                .json({ message: 'Forbidden: You cannot delete this question' });
        }

        await Question.findByIdAndDelete(questionId);

        return res
            .status(StatusCodes.OK)
            .json({ message: 'Question deleted successfully', questionId });
    } catch (error) {
        console.error('Error deleting question:', error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: 'Server error during deletion' });
    }
};

const getQuestionWithStatus = async (req, res) => {
    try {
        const userId = req.user?.id; // optional user auth
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Aggregation pipeline to get questions with vote information
        const pipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: '$author'
            }
        ];

        // If user is authenticated, add their vote information
        if (userId) {            
            pipeline.push({
                $lookup: {
                    from: 'votes',
                    let: { questionId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$question', '$$questionId'] },
                                        { $eq: ['$user', new mongoose.Types.ObjectId(userId)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'userVote'
                }
            });
        }

        pipeline.push(
            {
                $project: {
                    title: 1,
                    content: 1,
                    upvotes: 1,
                    downvotes: 1,
                    totalScore: 1,
                    createdAt: 1,
                    community: 1,
                    tags: 1,
                    answersCount: 1,
                    'author.username': 1,
                    'author._id': 1,
                    userVote: userId ? { $arrayElemAt: ['$userVote.voteType', 0] } : null
                }
            },
            { $sort: { totalScore: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        );

        const questions = await Question.aggregate(pipeline);

        res.json({
            questions,
            page,
            limit,
            hasNextPage: questions.length === limit
        });

    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = { addQuestion, getAllQuestions, deleteQuestion, voteQuestion, getQuestionWithStatus };
