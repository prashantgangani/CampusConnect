import Application from '../models/Application.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import { seedQuestionsIfEmpty } from '../utils/quizQuestionsSeed.js';

const shuffleQuestions = (items) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Get all applications for a student
export const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const applications = await Application.find({ studentId })
      .populate('jobId', 'title description salary location jobType company')
      .populate('jobId.company', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// Create application and start quiz
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const studentId = req.user._id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active' || job.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This job is not available for student applications.'
      });
    }

    // Check for existing application
    const existingApp = await Application.findOne({
      studentId,
      jobId,
      status: { $ne: 'quiz_failed' }
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position'
      });
    }

    // Create application with quiz_pending status
    const application = new Application({
      studentId,
      jobId,
      status: 'quiz_pending'
    });

    await application.save();

    // Fetch quiz questions for this job
    let quiz = await Quiz.findOne({ jobId });

    if (!quiz) {
      // Generate quiz if not exists (can be done by an edge function in production)
      return res.status(200).json({
        success: true,
        message: 'Application created. Please wait for quiz to be generated.',
        applicationId: application._id,
        quizQuestions: null
      });
    }

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      applicationId: application._id,
      quizQuestions: quiz.questions.map(q => ({
        id: q._id,
        question: q.question,
        options: q.options,
        marks: q.marks
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating application',
      error: error.message
    });
  }
};

// Start quiz for a specific application
export const startQuiz = async (req, res) => {
  try {
    const applicationId = req.params.applicationId || req.body.applicationId || req.query.applicationId;
    const studentId = req.user._id;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'applicationId is required to start quiz.'
      });
    }

    const application = await Application.findOne({
      _id: applicationId,
      studentId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status !== 'quiz_pending') {
      return res.status(400).json({
        success: false,
        message: 'Quiz can only be started when status is quiz_pending'
      });
    }

    await seedQuestionsIfEmpty();

    let questions = [];

    if (application.quizQuestionIds && application.quizQuestionIds.length === 10) {
      questions = await Question.find(
        { _id: { $in: application.quizQuestionIds } },
        { question: 1, options: 1, domain: 1 }
      ).lean();
    }

    if (!questions.length || questions.length !== 10) {
      const allQuestions = await Question.find({}, { question: 1, options: 1, domain: 1 }).lean();
      if (allQuestions.length < 10) {
        return res.status(500).json({
          success: false,
          message: 'Not enough quiz questions available. Please contact admin.'
        });
      }

      const selectedQuestions = shuffleQuestions(allQuestions).slice(0, 10);

      application.quizQuestionIds = selectedQuestions.map((question) => question._id);
      application.quizStartedAt = new Date();
      await application.save();

      questions = selectedQuestions;
    }

    return res.status(200).json({
      success: true,
      applicationId: application._id,
      questions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error starting quiz',
      error: error.message
    });
  }
};

// Submit quiz answers
export const submitQuiz = async (req, res) => {
  try {
    const { applicationId, jobId, answers } = req.body;
    const studentId = req.user._id;

    // Find application
    const application = await Application.findOne({ _id: applicationId, studentId });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status !== 'quiz_pending') {
      return res.status(400).json({
        success: false,
        message: 'Quiz is not available for this application status.'
      });
    }

    let marksObtained = 0;
    let totalMarks = 0;
    let percentage = 0;
    let passed = false;
    let resultAnswers = [];
    let quizId = null;

    if (application.quizQuestionIds && application.quizQuestionIds.length > 0) {
      if (!Array.isArray(answers)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid answers payload.'
        });
      }

      const questionIds = application.quizQuestionIds;
      const requiredAnswerCount = questionIds.length;

      if (requiredAnswerCount !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Quiz is not initialized correctly. Please restart quiz.'
        });
      }

      if (answers.length !== requiredAnswerCount) {
        return res.status(400).json({
          success: false,
          message: `Please submit exactly ${requiredAnswerCount} answers.`
        });
      }

      const questions = await Question.find({ _id: { $in: questionIds } }).lean();
      if (questions.length !== requiredAnswerCount) {
        return res.status(400).json({
          success: false,
          message: 'Quiz question set is invalid. Please restart quiz.'
        });
      }

      const correctMap = new Map(questions.map((question) => [String(question._id), question.correctAnswer]));

      totalMarks = requiredAnswerCount;

      resultAnswers = answers.map((answer) => {
        if (!answer || !answer.questionId) {
          return {
            questionId: null,
            selectedAnswer: null,
            isCorrect: false,
            marksObtained: 0
          };
        }

        const questionId = String(answer.questionId);
        const selectedAnswer = typeof answer.selectedAnswer === 'string'
          ? answer.selectedAnswer.trim()
          : answer.selectedAnswer;
        const correctAnswer = correctMap.get(questionId);
        const isCorrect = correctAnswer === selectedAnswer;
        if (isCorrect) {
          marksObtained += 1;
        }

        return {
          questionId: answer.questionId,
          selectedAnswer,
          isCorrect,
          marksObtained: isCorrect ? 1 : 0
        };
      });

      percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
      passed = percentage >= 70;
    } else if (Array.isArray(answers) && answers.length > 0 && answers.every((answer) => answer?.questionId)) {
      // Fallback for older applications where quizQuestionIds were not stored properly
      const questionIds = answers.map((answer) => answer.questionId);
      const questions = await Question.find({ _id: { $in: questionIds } }).lean();

      if (!questions.length) {
        return res.status(404).json({
          success: false,
          message: 'Quiz questions not found for this attempt.'
        });
      }

      const correctMap = new Map(questions.map((question) => [String(question._id), question.correctAnswer]));
      totalMarks = answers.length;

      resultAnswers = answers.map((answer) => {
        const questionId = String(answer.questionId);
        const selectedAnswer = typeof answer.selectedAnswer === 'string'
          ? answer.selectedAnswer.trim()
          : answer.selectedAnswer;
        const correctAnswer = correctMap.get(questionId);
        const isCorrect = correctAnswer === selectedAnswer;

        if (isCorrect) {
          marksObtained += 1;
        }

        return {
          questionId: answer.questionId,
          selectedAnswer,
          isCorrect,
          marksObtained: isCorrect ? 1 : 0
        };
      });

      percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
      passed = percentage >= 70;

      if (!application.quizQuestionIds || application.quizQuestionIds.length === 0) {
        application.quizQuestionIds = questions.map((question) => question._id);
      }
    } else {
      // Backward-compatible job-specific quiz flow
      const quiz = await Quiz.findOne({ jobId });
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      totalMarks = 0;

      quiz.questions.forEach((question, index) => {
        totalMarks += question.marks;
        const studentAnswer = answers[index];
        const isCorrect = studentAnswer === question.correctAnswer;

        resultAnswers.push({
          questionId: question._id,
          selectedAnswer: studentAnswer,
          isCorrect,
          marksObtained: isCorrect ? question.marks : 0
        });

        if (isCorrect) {
          marksObtained += question.marks;
        }
      });

      percentage = Math.round((marksObtained / totalMarks) * 100);
      passed = percentage >= quiz.passingPercentage;
      quizId = quiz._id;
    }

    const existingResult = await QuizResult.findOne({ applicationId, studentId });
    if (existingResult) {
      await QuizResult.deleteOne({ _id: existingResult._id });
    }

    const quizResult = new QuizResult({
      applicationId,
      studentId,
      quizId,
      answers: resultAnswers,
      totalMarks,
      marksObtained,
      percentage,
      passed
    });

    await quizResult.save();

    // Update application status
    application.status = passed ? 'pending_mentor' : 'quiz_failed';
    application.quizScore = percentage;
    application.quizAttemptedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: passed ? 'Quiz passed! Application moved to mentor for verification.' : 'Quiz failed.',
      passed,
      percentage,
      passingPercentage: 70,
      nextStatus: application.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz',
      error: error.message
    });
  }
};

// Get application details
export const getApplicationDetail = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const studentId = req.user._id;

    const application = await Application.findOne({
      _id: applicationId,
      studentId
    })
      .populate('jobId')
      .populate('mentorId', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get quiz result if exists
    const quizResult = await QuizResult.findOne({ applicationId });

    res.status(200).json({
      success: true,
      data: {
        ...application.toObject(),
        quizResult
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
};

// Withdraw application
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const studentId = req.user._id;

    const application = await Application.findOneAndUpdate(
      { _id: applicationId, studentId },
      { status: 'withdrawn' },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error withdrawing application',
      error: error.message
    });
  }
};

// Get quiz result
export const getQuizResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const studentId = req.user._id;

    const quizResult = await QuizResult.findOne({ applicationId })
      .populate('quizId');

    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quizResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz result',
      error: error.message
    });
  }
};
