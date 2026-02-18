import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  marks: {
    type: Number,
    default: 1
  }
});

const quizSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'Screening Quiz'
  },
  description: {
    type: String
  },
  questions: [quizQuestionSchema],
  totalMarks: {
    type: Number,
    default: 0
  },
  passingPercentage: {
    type: Number,
    default: 70
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
