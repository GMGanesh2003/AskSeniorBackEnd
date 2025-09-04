const { default: mongoose } = require("mongoose");
const Answer = require("../models/AnswerModel");
const CommentLike = require("../models/CommentLikeSchema");
const Comment = require("../models/CommentSchema");

const addComment = async (req, res) => {
    try {
        const { answerId } = req.params;
        const { content, parentComment } = req.body;
        const userId = req.user.id;

        const answer = await Answer.findById(answerId);
        if (!answer) {
            return res.status(404).json({ error: 'Answer not found' });
        }

        // If replying to a comment, verify parent exists
        if (parentComment) {
            const parent = await Comment.findById(parentComment);
            if (!parent || parent.answer.toString() !== answerId) {
                return res.status(400).json({ error: 'Invalid parent comment' });
            }
        }

        const comment = await Comment.create({
            content,
            author: userId,
            answer: answerId,
            parentComment: parentComment || null
        });

        // Update counts
        answer.commentsCount += 1;
        await answer.save();

        if (parentComment) {
            await Comment.findByIdAndUpdate(parentComment, { $inc: { repliesCount: 1 } });
        }

        await comment.populate('author', 'username');

        res.status(201).json({
            success: true,
            comment: {
                ...comment.toObject(),
                hasUserLiked: false
            }
        });

    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

const getComments = async (req, res) => {
    try {
        const { answerId } = req.params;
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const pipeline = [
            {
                $match: {
                    answer: new mongoose.Types.ObjectId(answerId),
                    parentComment: null // Only top-level comments
                }
            },
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

        // Add user like information if authenticated
        if (userId) {
            pipeline.push({
                $lookup: {
                    from: 'commentlikes',
                    let: { commentId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$comment', '$$commentId'] },
                                        { $eq: ['$user', new mongoose.Types.ObjectId(userId)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'userLike'
                }
            });
        }

        pipeline.push(
            {
                $project: {
                    content: 1,
                    likes: 1,
                    repliesCount: 1,
                    createdAt: 1,
                    'author.username': 1,
                    'author._id': 1,
                    hasUserLiked: userId ? { $gt: [{ $size: '$userLike' }, 0] } : false
                }
            },
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit }
        );

        const comments = await Comment.aggregate(pipeline);

        res.json({
            comments,
            page,
            limit,
            hasNextPage: comments.length === limit
        });

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

const likeUnlikeComments = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const existingLike = await CommentLike.findOne({ user: userId, comment: commentId });

    let action = null;

    if (existingLike) {
      // Unlike
      await CommentLike.deleteOne({ _id: existingLike._id });
      comment.likes = Math.max(0, comment.likes - 1);
      action = 'unliked';
    } else {
      // Like
      await CommentLike.create({ user: userId, comment: commentId });
      comment.likes += 1;
      action = 'liked';
    }

    await comment.save();

    res.json({
      success: true,
      action,
      likes: comment.likes,
      hasUserLiked: action === 'liked'
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { addComment, getComments, likeUnlikeComments }

