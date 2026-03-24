import Application from '../models/Application.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import CompanyApplicantQuiz from '../models/CompanyApplicantQuiz.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import { seedQuestionsIfEmpty } from '../utils/quizQuestionsSeed.js';

const normalizeQuizPayload = (quizInput = {}) => {
  if (!quizInput || !Array.isArray(quizInput.questions) || quizInput.questions.length === 0) {
    return null;
  }

  const questions = quizInput.questions.map((question, index) => {
    const prompt = (question?.question || '').trim();
    const options = Array.isArray(question?.options)
      ? question.options.map((option) => (option || '').trim()).filter(Boolean)
      : [];
    const correctAnswer = (question?.correctAnswer || '').trim();
    const marks = Number(question?.marks) > 0 ? Number(question.marks) : 1;

    if (!prompt) {
      throw new Error(`Quiz question ${index + 1}: prompt is required.`);
    }
    if (options.length !== 4) {
      throw new Error(`Quiz question ${index + 1}: exactly 4 options are required.`);
    }
    if (!correctAnswer || !options.includes(correctAnswer)) {
      throw new Error(`Quiz question ${index + 1}: correct answer must match one of the options.`);
    }

    return {
      question: prompt,
      options,
      correctAnswer,
      marks
    };
  });

  const totalMarks = questions.reduce((sum, question) => sum + (Number(question.marks) || 1), 0);
  const passingPercentage = Number(quizInput.passingPercentage) > 0
    ? Number(quizInput.passingPercentage)
    : 70;
  const timeLimit = Number(quizInput.timeLimit) > 0 ? Number(quizInput.timeLimit) : 30;

  return {
    title: (quizInput.title || 'Company Round Quiz').trim(),
    description: (quizInput.description || '').trim(),
    questions,
    totalMarks,
    passingPercentage,
    timeLimit
  };
};

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
      .populate('jobId', 'title description salary location jobType company companyName')
      .populate('jobId.company', 'name institution')
      .sort({ createdAt: -1 });

    const uniqueByJob = [];
    const seenJobIds = new Set();

    for (const application of applications) {
      const jobId = application?.jobId?._id ? String(application.jobId._id) : null;
      if (!jobId) {
        uniqueByJob.push(application);
        continue;
      }

      if (seenJobIds.has(jobId)) {
        continue;
      }

      seenJobIds.add(jobId);
      uniqueByJob.push(application);
    }

    res.status(200).json({
      success: true,
      count: uniqueByJob.length,
      data: uniqueByJob
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

    // Check for existing application on same job
    const existingApp = await Application.findOne({
      studentId,
      jobId
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position. Re-application is not allowed.'
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

    if (!['quiz_pending', 'company_quiz_pending'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Quiz is not available for this application status.'
      });
    }

    if (application.status === 'company_quiz_pending') {
      const applicantQuiz = await CompanyApplicantQuiz.findOne({ jobId: application.jobId })
        .select('questions passingPercentage timeLimit title description quizDeadline')
        .lean();

      if (!applicantQuiz || !Array.isArray(applicantQuiz.questions) || applicantQuiz.questions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company applicant quiz is not configured for this job.'
        });
      }

      const now = new Date();
      const startTime = applicantQuiz.startTime ? new Date(applicantQuiz.startTime) : null;
      const endTime = applicantQuiz.endTime ? new Date(applicantQuiz.endTime) : applicantQuiz.quizDeadline ? new Date(applicantQuiz.quizDeadline) : null;

      if (startTime && now < startTime) {
        return res.status(400).json({
          success: false,
          message: 'Company applicant quiz has not started yet.'
        });
      }

      if (endTime && now > endTime) {
        return res.status(400).json({
          success: false,
          message: 'Company applicant quiz has ended.'
        });
      }

      const questions = applicantQuiz.questions.map((question) => ({
        _id: question._id,
        question: question.question,
        options: question.options,
        marks: question.marks || 1
      }));

      application.quizStartedAt = new Date();
      await application.save();

      return res.status(200).json({
        success: true,
        applicationId: application._id,
        quizType: 'company_applicant_round',
        passingPercentage: applicantQuiz.passingPercentage || 70,
        timeLimit: applicantQuiz.timeLimit || 30,
        title: applicantQuiz.title || 'Company Round Quiz',
        description: applicantQuiz.description || '',
        deadline: applicantQuiz.quizDeadline,
        questions
      });
    }

    const companyQuiz = await Quiz.findOne({ jobId: application.jobId })
      .select('questions passingPercentage timeLimit title description')
      .lean();

    let questions = [];

    if (companyQuiz && Array.isArray(companyQuiz.questions) && companyQuiz.questions.length > 0) {
      questions = companyQuiz.questions.map((question) => ({
        _id: question._id,
        question: question.question,
        options: question.options,
        marks: question.marks || 1
      }));

      application.quizStartedAt = new Date();
      await application.save();

      return res.status(200).json({
        success: true,
        applicationId: application._id,
        quizType: 'job_specific',
        passingPercentage: companyQuiz.passingPercentage || 70,
        timeLimit: companyQuiz.timeLimit || 30,
        title: companyQuiz.title || 'Screening Quiz',
        description: companyQuiz.description || '',
        questions
      });
    }

    await seedQuestionsIfEmpty();

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
      quizType: 'static_question_bank',
      passingPercentage: 70,
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
    const { applicationId, answers } = req.body;
    const studentId = req.user._id;

    // Find application
    const application = await Application.findOne({ _id: applicationId, studentId });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!['quiz_pending', 'company_quiz_pending'].includes(application.status)) {
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

    const normalizedAnswers = Array.isArray(answers) ? answers : [];

    if (application.status === 'company_quiz_pending') {
      const applicantQuiz = await CompanyApplicantQuiz.findOne({ jobId: application.jobId }).lean();
      if (!applicantQuiz || !Array.isArray(applicantQuiz.questions) || applicantQuiz.questions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company applicant quiz is not configured for this job.'
        });
      }

      const now = new Date();
      const startTime = applicantQuiz.startTime ? new Date(applicantQuiz.startTime) : null;
      const endTime = applicantQuiz.endTime ? new Date(applicantQuiz.endTime) : applicantQuiz.quizDeadline ? new Date(applicantQuiz.quizDeadline) : null;

      if (startTime && now < startTime) {
        return res.status(400).json({
          success: false,
          message: 'Company applicant quiz has not started yet.'
        });
      }

      if (endTime && now > endTime) {
        return res.status(400).json({
          success: false,
          message: 'Company applicant quiz has ended.'
        });
      }

      const answerMap = new Map(
        normalizedAnswers
          .filter((answer) => answer?.questionId)
          .map((answer) => [String(answer.questionId), answer?.selectedAnswer])
      );

      totalMarks = applicantQuiz.questions.reduce((sum, question) => sum + (Number(question.marks) || 1), 0);

      resultAnswers = applicantQuiz.questions.map((question) => {
        const questionId = String(question._id);
        const selectedAnswer = answerMap.has(questionId)
          ? String(answerMap.get(questionId)).trim()
          : null;
        const correctAnswer = typeof question.correctAnswer === 'string'
          ? question.correctAnswer.trim()
          : question.correctAnswer;
        const marks = Number(question.marks) || 1;
        const isCorrect = !!selectedAnswer && selectedAnswer === correctAnswer;
        if (isCorrect) {
          marksObtained += marks;
        }

        return {
          questionId: question._id,
          selectedAnswer,
          isCorrect,
          marksObtained: isCorrect ? marks : 0
        };
      });

      percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
      passed = percentage >= (Number(applicantQuiz.passingPercentage) || 70);

      application.status = passed ? 'company_quiz_passed' : 'company_quiz_failed';
      application.companyQuizScore = percentage;
      application.companyQuizAttemptedAt = new Date();

      await application.save();

      return res.status(200).json({
        success: true,
        message: passed
          ? 'You passed the company round quiz. Wait for company approval after deadline.'
          : 'You did not pass the company round quiz.',
        passed,
        percentage,
        passingPercentage: applicantQuiz.passingPercentage || 70,
        nextStatus: application.status
      });
    }

    const companyQuiz = await Quiz.findOne({ jobId: application.jobId }).lean();

    if (companyQuiz && Array.isArray(companyQuiz.questions) && companyQuiz.questions.length > 0) {
      const answerMap = new Map(
        normalizedAnswers
          .filter((answer) => answer?.questionId)
          .map((answer) => [String(answer.questionId), answer?.selectedAnswer])
      );

      quizId = companyQuiz._id;
      totalMarks = companyQuiz.questions.reduce((sum, question) => sum + (Number(question.marks) || 1), 0);

      resultAnswers = companyQuiz.questions.map((question) => {
        const questionId = String(question._id);
        const selectedAnswer = answerMap.has(questionId)
          ? String(answerMap.get(questionId)).trim()
          : null;
        const correctAnswer = typeof question.correctAnswer === 'string'
          ? question.correctAnswer.trim()
          : question.correctAnswer;
        const marks = Number(question.marks) || 1;
        const isCorrect = !!selectedAnswer && selectedAnswer === correctAnswer;
        if (isCorrect) {
          marksObtained += marks;
        }

        return {
          questionId: question._id,
          selectedAnswer,
          isCorrect,
          marksObtained: isCorrect ? marks : 0
        };
      });

      percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
      passed = percentage >= (Number(companyQuiz.passingPercentage) || 70);
    } else if (application.quizQuestionIds && application.quizQuestionIds.length > 0) {
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

      // Allow partial submissions - student can answer any number of questions (0-10)
      // No minimum requirement - can submit with 0, 1, 2, ... up to 10 answers

      const questions = await Question.find({ _id: { $in: questionIds } }).lean();
      if (questions.length !== requiredAnswerCount) {
        return res.status(400).json({
          success: false,
          message: 'Quiz question set is invalid. Please restart quiz.'
        });
      }

      const correctMap = new Map(questions.map((question) => [String(question._id), question.correctAnswer]));

      // totalMarks should be based on total questions, not submitted answers
      totalMarks = requiredAnswerCount;

      // Handle both empty and non-empty answers arrays
      if (Array.isArray(answers) && answers.length > 0) {
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
      } else {
        // Empty submission - no answers provided (0 answers)
        resultAnswers = [];
        marksObtained = 0;
      }

      // Calculate percentage based on total questions (not submitted answers)
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
      return res.status(400).json({
        success: false,
        message: 'No quiz questions are configured for this application.'
      });
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
      passingPercentage: companyQuiz?.passingPercentage || 70,
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

// Get applications awaiting mentor approval
export const getMentorAwaitingApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      status: { $in: ['pending_mentor', 'Awaiting Mentor Approval'] }
    })
      .populate('studentId', 'name')
      .populate('jobId', 'title')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching mentor awaiting applications',
      error: error.message
    });
  }
};

// Get mentor approved applications for company
export const getCompanyApprovedApplications = async (req, res) => {
  try {
    const companyId = req.user._id;

    const companyJobs = await Job.find({ company: companyId }).select('_id title').lean();
    const companyJobIds = companyJobs.map((job) => job._id);

    if (companyJobIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        pendingApplicants: [],
        passedApplicants: []
      });
    }

    const applicantQuizzes = await CompanyApplicantQuiz.find({ jobId: { $in: companyJobIds } })
      .select('jobId quizDeadline')
      .lean();

    const jobQuizMap = new Map(
      applicantQuizzes.map((quiz) => [
        String(quiz.jobId),
        {
          deadline: quiz.quizDeadline ? new Date(quiz.quizDeadline) : null
        }
      ])
    );

    const applications = await Application.find({
      jobId: { $in: companyJobIds },
      status: { $in: ['mentor_approved', 'company_quiz_pending', 'company_quiz_passed'] }
    })
      .populate('studentId', 'name email')
      .populate('jobId', 'title')
      .sort({ updatedAt: -1 });

    const now = new Date();
    const pendingApplicants = [];
    const passedApplicants = [];

    for (const application of applications) {
      const jobId = String(application.jobId?._id || application.jobId);
      const quizConfig = jobQuizMap.get(jobId);

      if (application.status === 'company_quiz_passed') {
        if (quizConfig?.deadline && now >= quizConfig.deadline) {
          passedApplicants.push(application);
        }
        continue;
      }

      pendingApplicants.push(application);
    }

    return res.status(200).json({
      success: true,
      count: pendingApplicants.length,
      data: pendingApplicants,
      pendingApplicants,
      passedApplicants
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching company approved applications',
      error: error.message
    });
  }
};

// Get company applicant quiz details for a job (company users)
export const getCompanyApplicantQuiz = async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user._id;

    const job = await Job.findById(jobId).select('company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (String(job.company) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view quiz for this job' });
    }

    const applicantQuiz = await CompanyApplicantQuiz.findOne({ jobId }).lean();
    if (!applicantQuiz) {
      return res.status(404).json({ success: false, message: 'Company applicant quiz not found' });
    }

    return res.status(200).json({ success: true, data: applicantQuiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching company applicant quiz', error: error.message });
  }
};

// Reassign an applicant to company quiz round (company action)
export const reassignCompanyApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user._id;

    const application = await Application.findById(id).populate('jobId', 'company');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (!application.jobId || String(application.jobId.company) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to reassign this applicant' });
    }

    application.status = 'company_quiz_pending';
    application.companyQuizScore = null;
    application.companyQuizAttemptedAt = null;
    await application.save();

    return res.status(200).json({ success: true, message: 'Applicant reassigned to company quiz round', data: application });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error reassigning applicant', error: error.message });
  }
};

// Fetch active / company quiz items for authenticated student
export const getStudentCompanyQuizzes = async (req, res) => {
  try {
    const studentId = req.user._id;

    const applications = await Application.find({
      studentId,
      status: { $in: ['company_quiz_pending', 'company_quiz_failed', 'company_quiz_passed'] }
    })
      .populate('jobId', 'title company')
      .lean();

    if (!applications.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const jobIds = [...new Set(applications.map((app) => String(app.jobId?._id)).filter(Boolean))];
    const quizzes = await CompanyApplicantQuiz.find({ jobId: { $in: jobIds } }).lean();
    const quizMap = new Map(quizzes.map((quiz) => [String(quiz.jobId), quiz]));

    // Fetch company information for jobs
    const companyIds = [...new Set(applications.map((app) => String(app.jobId?.company)).filter(Boolean))];
    const companies = await User.find({ _id: { $in: companyIds } }).select('_id name companyName').lean();
    const companyMap = new Map(companies.map((comp) => [String(comp._id), comp]));

    const now = new Date();

    const payload = applications.map((app) => {
      const quiz = quizMap.get(String(app.jobId?._id));
      const startTime = quiz?.startTime ? new Date(quiz.startTime) : null;
      const endTime = quiz?.endTime ? new Date(quiz.endTime) : quiz?.quizDeadline ? new Date(quiz.quizDeadline) : null;

      const canAttempt = app.status === 'company_quiz_pending' && (!startTime || now >= startTime) && (!endTime || now <= endTime);
      const companyInfo = companyMap.get(String(app.jobId?.company));

      return {
        applicationId: app._id,
        jobId: app.jobId?._id,
        jobTitle: app.jobId?.title,
        companyName: companyInfo?.companyName || companyInfo?.name || 'Company',
        status: app.status,
        companyQuizScore: app.companyQuizScore,
        quizTitle: quiz?.title || 'Company Applicant Quiz',
        quizDescription: quiz?.description || '',
        quizPassingPercentage: quiz?.passingPercentage,
        quizTimeLimit: quiz?.timeLimit,
        startTime: startTime?.toISOString() || null,
        endTime: endTime?.toISOString() || null,
        isWithinWindow: canAttempt,
        uploadedAt: quiz?.createdAt || null
      };
    });

    return res.status(200).json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching assigned company quizzes', error: error.message });
  }
};

// Get all company applicant quizzes for a company
export const getCompanyQuizzes = async (req, res) => {
  try {
    const companyId = req.user._id;

    const companyJobs = await Job.find({ company: companyId }).select('_id title').lean();
    const jobIds = companyJobs.map((job) => job._id);

    if (jobIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const quizzes = await CompanyApplicantQuiz.find({ jobId: { $in: jobIds } })
      .populate('jobId', 'title')
      .lean();

    const quizData = quizzes.map((quiz) => ({
      _id: quiz._id,
      jobId: quiz.jobId?._id,
      jobTitle: quiz.jobId?.title || 'Unknown Job',
      title: quiz.title,
      description: quiz.description,
      passingPercentage: quiz.passingPercentage,
      timeLimit: quiz.timeLimit,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      quizDeadline: quiz.quizDeadline,
      totalMarks: quiz.totalMarks,
      questionsCount: quiz.questions?.length || 0,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    }));

    return res.status(200).json({ success: true, data: quizData });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching company quizzes', error: error.message });
  }
};

// Delete a company applicant quiz
export const deleteCompanyApplicantQuiz = async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user._id;

    const job = await Job.findById(jobId).select('company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (String(job.company) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete quiz for this job' });
    }

    const deletedQuiz = await CompanyApplicantQuiz.findOneAndDelete({ jobId });

    if (!deletedQuiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Reset applications to mentor_approved status
    await Application.updateMany(
      { jobId, status: { $in: ['company_quiz_pending', 'company_quiz_failed', 'company_quiz_passed'] } },
      { $set: { status: 'mentor_approved', companyQuizScore: null, companyQuizAttemptedAt: null } }
    );

    return res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting company applicant quiz', error: error.message });
  }
};

// Reassign company quiz to a specific student by email
export const reassignCompanyQuizToStudent = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { studentEmail } = req.body;
    const companyId = req.user._id;

    if (!studentEmail) {
      return res.status(400).json({ success: false, message: 'Student email is required' });
    }

    const job = await Job.findById(jobId).select('company');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (String(job.company) !== String(companyId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to reassign quiz for this job' });
    }

    // Find student by email
    const student = await User.findOne({ email: studentEmail, role: 'student' }).select('_id');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found with this email' });
    }

    // Find application for this student and job
    const application = await Application.findOne({
      studentId: student._id,
      jobId,
      status: { $in: ['mentor_approved', 'company_quiz_failed'] }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'No eligible application found for this student' });
    }

    // Check if quiz exists
    const quiz = await CompanyApplicantQuiz.findOne({ jobId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Company quiz not found for this job' });
    }

    // Update application status
    application.status = 'company_quiz_pending';
    application.companyQuizScore = null;
    application.companyQuizAttemptedAt = null;
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Quiz reassigned successfully to ${studentEmail}`,
      data: { applicationId: application._id, studentId: student._id }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error reassigning quiz to student', error: error.message });
  }
};

// Upload/update company applicant quiz for a specific job
export const upsertCompanyApplicantQuiz = async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user._id;

    const job = await Job.findById(jobId).select('_id company title');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (String(job.company) !== String(companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload quiz for this job'
      });
    }

    const normalizedQuiz = normalizeQuizPayload(req.body);
    if (!normalizedQuiz) {
      return res.status(400).json({
        success: false,
        message: 'At least one quiz question is required'
      });
    }

    const now = new Date();
    const startTimeInput = req.body?.startTime;
    const endTimeInput = req.body?.endTime;

    const startTime = startTimeInput ? new Date(startTimeInput) : null;
    const endTime = endTimeInput ? new Date(endTimeInput) : null;

    if (!startTime || Number.isNaN(startTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'A valid startTime is required'
      });
    }

    if (!endTime || Number.isNaN(endTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'A valid endTime is required'
      });
    }

    if (startTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Quiz startTime must be now or in the future'
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'Quiz endTime must be after startTime'
      });
    }

    const applicantQuiz = await CompanyApplicantQuiz.findOneAndUpdate(
      { jobId: job._id },
      {
        $set: {
          ...normalizedQuiz,
          jobId: job._id,
          startTime,
          endTime,
          quizDeadline: endTime
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    await Application.updateMany(
      {
        jobId: job._id,
        status: 'mentor_approved'
      },
      {
        $set: {
          status: 'company_quiz_pending'
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Company applicant quiz saved successfully',
      data: applicantQuiz
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error saving company applicant quiz',
      error: error.message
    });
  }
};

// Approve (hire) a passed applicant
export const hireApplicationByCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user._id;

    const application = await Application.findById(id).populate('jobId', 'company');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!application.jobId || String(application.jobId.company) !== String(companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this applicant'
      });
    }

    if (application.status !== 'company_quiz_passed') {
      return res.status(400).json({
        success: false,
        message: 'Only passed company-quiz applicants can be approved for hiring'
      });
    }

    application.status = 'selected';
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Applicant approved and marked as hired',
      data: application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error approving applicant for hiring',
      error: error.message
    });
  }
};

// Reject application by company (from mentor-approved pool)
export const rejectApplicationByCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user._id;

    const application = await Application.findById(id).populate('jobId', 'company');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!application.jobId || String(application.jobId.company) !== String(companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this application'
      });
    }

    if (!['mentor_approved', 'company_quiz_passed'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only eligible applicant pools can be rejected by company'
      });
    }

    application.status = 'rejected';
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Application rejected by company',
      data: application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error rejecting application by company',
      error: error.message
    });
  }
};

// Approve application by mentor
export const approveApplicationByMentor = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!['pending_mentor', 'Awaiting Mentor Approval'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only awaiting applications can be approved by mentor'
      });
    }

    const applicantQuiz = await CompanyApplicantQuiz.findOne({ jobId: application.jobId })
      .select('quizDeadline')
      .lean();

    const shouldMoveToCompanyQuiz = !!(
      applicantQuiz?.quizDeadline && new Date(applicantQuiz.quizDeadline) > new Date()
    );

    application.status = shouldMoveToCompanyQuiz ? 'company_quiz_pending' : 'mentor_approved';
    application.mentorId = req.user._id;
    application.mentorApprovedAt = new Date();
    await application.save();

    return res.status(200).json({
      success: true,
      message: shouldMoveToCompanyQuiz
        ? 'Approved by Mentor and moved to company quiz round'
        : 'Approved by Mentor',
      data: application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error approving application',
      error: error.message
    });
  }
};

// Reject application by mentor
export const rejectApplicationByMentor = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!['pending_mentor', 'Awaiting Mentor Approval'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only awaiting applications can be rejected by mentor'
      });
    }

    application.status = 'mentor_rejected';
    application.mentorId = req.user._id;
    application.mentorApprovedAt = null;
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Rejected by Mentor',
      data: application
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error rejecting application',
      error: error.message
    });
  }
};
