import mongoose from 'mongoose';

const suggestedJobSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

suggestedJobSchema.index({ mentor: 1, student: 1, job: 1 }, { unique: true });

const SuggestedJob = mongoose.model('SuggestedJob', suggestedJobSchema);

export default SuggestedJob;
