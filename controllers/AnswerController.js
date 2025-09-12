const { default: mongoose } = require("mongoose");
const Answer = require("../models/AnswerModel");
const Question = require("../models/QuestionModel");
const { StatusCodes } = require("http-status-codes");
const AnswerVote = require("../models/AnswerVoteSchema");

const answerQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Check if question exists
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Question not found' });
        }

        // Create answer
        const answer = await Answer.create({
            content,
            author: userId,
            question: questionId
        });

        question.answersCount += 1;
        await question.save();

        await answer.populate('author', 'username');

        res.status(StatusCodes.CREATED).json({
            success: true,
            answer: {
                ...answer.toObject(),
                userVote: null,
                hasUserLiked: false
            }
        });

    } catch (error) {
        console.error('Create answer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

const getAnswers = async (req, res) => {
    try {
        const { questionId } = req.params;
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: { question: new mongoose.Types.ObjectId(questionId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: '$author' }
        ];

        // Add user vote information if authenticated
        if (userId) {
            pipeline.push({
                $lookup: {
                    from: 'answervotes',
                    let: { answerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$answer', '$$answerId'] },
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
                    content: 1,
                    upvotes: 1,
                    downvotes: 1,
                    totalScore: 1,
                    isAccepted: 1,
                    commentsCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'author.username': 1,
                    'author._id': 1,
                    userVote: userId ? { $arrayElemAt: ['$userVote.voteType', 0] } : null
                }
            },
            { $sort: { isAccepted: -1, totalScore: -1, createdAt: 1 } },
            { $skip: skip },
            { $limit: limit }
        );

        const answers = await Answer.aggregate(pipeline);

        res.json({
            answers,
            page,
            limit,
            hasNextPage: answers.length === limit
        });

    } catch (error) {
        console.error('Get answers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

const voteAnswer = async (req, res) => {
    try {
        const { answerId } = req.params;
        const { voteType } = req.body;
        const userId = req.user.id;

        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        const answer = await Answer.findById(answerId);
        if (!answer) {
            return res.status(404).json({ error: 'Answer not found' });
        }

        // Check existing vote
        const existingVote = await AnswerVote.findOne({ user: userId, answer: answerId });

        let voteAction = null;

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                // Remove vote
                await AnswerVote.deleteOne({ _id: existingVote._id });
                voteAction = 'removed';

                if (voteType === 'upvote') {
                    answer.upvotes = Math.max(0, answer.upvotes - 1);
                } else {
                    answer.downvotes = Math.max(0, answer.downvotes - 1);
                }
            } else {
                // Update vote
                existingVote.voteType = voteType;
                await existingVote.save();
                voteAction = 'updated';

                if (voteType === 'upvote') {
                    answer.upvotes += 1;
                    answer.downvotes = Math.max(0, answer.downvotes - 1);
                } else {
                    answer.downvotes += 1;
                    answer.upvotes = Math.max(0, answer.upvotes - 1);
                }
            }
        } else {
            // Create new vote
            await AnswerVote.create({ user: userId, answer: answerId, voteType });
            voteAction = 'created';

            if (voteType === 'upvote') {
                answer.upvotes += 1;
            } else {
                answer.downvotes += 1;
            }
        }

        answer.totalScore = answer.upvotes - answer.downvotes;
        await answer.save();

        res.json({
            success: true,
            action: voteAction,
            voteType: voteAction === 'removed' ? null : voteType,
            upvotes: answer.upvotes,
            downvotes: answer.downvotes,
            totalScore: answer.totalScore
        });

    } catch (error) {
        console.error('Vote answer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = { answerQuestion, getAnswers, voteAnswer }
