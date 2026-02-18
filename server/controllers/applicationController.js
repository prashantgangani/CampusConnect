import Application from '../models/Application.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

// Get all applications for a student
export const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const applications = await Application.find({ studentId })
      .populate('jobId', 'title description salary location jobType')
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

// Submit quiz answers
export const submitQuiz = async (req, res) => {
  try {
    const { applicationId, jobId, answers } = req.body;
    const studentId = req.user._id;

    // Find application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Find quiz
    const quiz = await Quiz.findOne({ jobId });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Calculate score
    let marksObtained = 0;
    let totalMarks = 0;
    const resultAnswers = [];

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

    const percentage = Math.round((marksObtained / totalMarks) * 100);
    const passed = percentage >= quiz.passingPercentage;

    // Create quiz result
    const quizResult = new QuizResult({
      applicationId,
      studentId,
      quizId: quiz._id,
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
      message: passed ? 'Quiz passed! Application submitted for mentor approval.' : 'Quiz failed.',
      passed,
      percentage,
      passingPercentage: quiz.passingPercentage
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
