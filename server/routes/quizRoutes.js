import express from 'express';
import { getRandomQuizQuestions, submitQuiz } from '../controllers/quizController.js';

const router = express.Router();

router.get('/start', getRandomQuizQuestions);
router.post('/submit', submitQuiz);

export default router;
