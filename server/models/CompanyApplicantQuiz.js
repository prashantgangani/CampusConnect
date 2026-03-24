import mongoose from 'mongoose';

const applicantQuizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function validator(value) {
        return Array.isArray(this.options) && this.options.includes(value);
      },
      message: 'correctAnswer must match one of the options.'
    }
  },
  marks: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: true });

const companyApplicantQuizSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'Company Round Quiz',
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  questions: [applicantQuizQuestionSchema],
  totalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  passingPercentage: {
    type: Number,
    default: 70,
    min: 1,
    max: 100
  },
  timeLimit: {
    type: Number,
    default: 30,
    min: 1
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  quizDeadline: {
    type: Date
  }
}, {
  timestamps: true
});

const CompanyApplicantQuiz = mongoose.model('CompanyApplicantQuiz', companyApplicantQuizSchema);

export default CompanyApplicantQuiz;
