const express = require('express');
const validateAuthToken = require("../middleware/AuthMiddleware");
const { getAllQuestions, addQuestion, voteQuestion, getQuestionWithStatus } = require('../controllers/QuestionController');
const { answerQuestion, getAnswers } = require('../controllers/AnswerController');

const router = express.Router();

router.get('/ques', validateAuthToken, getQuestionWithStatus);
router.get('/', validateAuthToken, getAllQuestions);
router.post('/', validateAuthToken, addQuestion);
router.post('/:questionId/vote', validateAuthToken, voteQuestion);
router.post('/:questionId/answer', validateAuthToken, answerQuestion);
router.get('/:questionId/answer', validateAuthToken, getAnswers);

module.exports = router;
