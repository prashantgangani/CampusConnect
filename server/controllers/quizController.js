import Question from '../models/Question.js';
import { seedQuestionsIfEmpty } from '../utils/quizQuestionsSeed.js';

const fisherYatesShuffle = (items) => {
	const array = [...items];
	for (let i = array.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

export const getRandomQuizQuestions = async (req, res) => {
	try {
		await seedQuestionsIfEmpty();

		const allQuestions = await Question.find({}, { question: 1, options: 1, domain: 1 }).lean();

		if (!allQuestions.length) {
			return res.status(404).json({
				success: false,
				message: 'No quiz questions found.'
			});
		}

		const randomized = fisherYatesShuffle(allQuestions).slice(0, 10);

		return res.status(200).json({
			success: true,
			total: randomized.length,
			questions: randomized
		});
	} catch (error) {
		console.error('Error in getRandomQuizQuestions:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to load quiz questions.'
		});
	}
};

export const submitQuiz = async (req, res) => {
	try {
		const { answers } = req.body;

		if (!Array.isArray(answers) || answers.length !== 10) {
			return res.status(400).json({
				success: false,
				message: 'answers must be an array of exactly 10 items.'
			});
		}

		const questionIds = answers.map((item) => item?.questionId).filter(Boolean);
		if (questionIds.length !== 10) {
			return res.status(400).json({
				success: false,
				message: 'Each answer must include a valid questionId.'
			});
		}

		const questions = await Question.find({ _id: { $in: questionIds } }, { correctAnswer: 1 }).lean();
		if (questions.length !== 10) {
			return res.status(400).json({
				success: false,
				message: 'Some question IDs are invalid.'
			});
		}

		const answerMap = new Map(questions.map((question) => [String(question._id), question.correctAnswer]));

		let score = 0;
		for (const item of answers) {
			const key = String(item.questionId);
			const correct = answerMap.get(key);
			if (correct && item.selectedAnswer === correct) {
				score += 1;
			}
		}

		const percentage = Math.round((score / 10) * 100);
		const passed = percentage >= 70;

		return res.status(200).json({
			success: true,
			result: {
				score,
				percentage,
				passed
			}
		});
	} catch (error) {
		console.error('Error in submitQuiz:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to submit quiz.'
		});
	}
};
