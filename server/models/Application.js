import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['quiz_pending', 'quiz_failed', 'pending_mentor', 'mentor_approved', 'mentor_rejected', 'shortlisted', 'interview_scheduled', 'selected', 'rejected', 'offer_made', 'offer_accepted'],
    default: 'quiz_pending'
  },
  quizScore: {
    type: Number,
    min: 0,
    max: 100
  },
  quizAttemptedAt: {
    type: Date
  },
  interviewDate: {
    type: Date
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mentorApprovedAt: {
    type: Date
  },
  mentorNotes: {
    type: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
