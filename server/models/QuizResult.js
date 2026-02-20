import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    selectedAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    marksObtained: Number
  }],
  totalMarks: {
    type: Number,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

export default QuizResult;
