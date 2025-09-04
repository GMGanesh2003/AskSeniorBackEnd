const express = require('express');
const validateAuthToken = require("../middleware/AuthMiddleware");
const { voteAnswer } = require("./../controllers/AnswerController")
const { addComment, getComments } = require("./../controllers/CommentController")
const router = express.Router();

router.post('/:answerId/vote', validateAuthToken, voteAnswer);
router.post('/:answerId/comments', validateAuthToken, addComment);
router.get('/:answerId/comments', validateAuthToken, getComments);

// Like/unlike a comment
// router.post('/comments/:commentId/like', );


module.exports = router;
