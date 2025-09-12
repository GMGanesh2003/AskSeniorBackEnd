const express = require('express');
const validateAuthToken = require("../middleware/AuthMiddleware");
const { voteAnswer } = require("./../controllers/AnswerController")
const { addComment, getComments, getAllComments } = require("./../controllers/CommentController")
const router = express.Router();

router.post('/:questionId/vote', validateAuthToken, voteAnswer);
router.post('/:questionId/comments', validateAuthToken, addComment);
router.get('/:questionId/comments', validateAuthToken, getComments);
router.get('/comments', validateAuthToken, getAllComments);

// Like/unlike a comment
// router.post('/comments/:commentId/like', );


module.exports = router;
