import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length === 4 &&
          value.every((option) => typeof option === 'string' && option.trim().length > 0),
        message: 'Options must contain exactly 4 non-empty strings.'
      }
    },
    correctAnswer: {
      type: String,
      required: true,
      validate: {
        validator: function validator(value) {
          return Array.isArray(this.options) && this.options.includes(value);
        },
        message: 'correctAnswer must match one of the options.'
      }
    },
    domain: {
      type: String,
      required: true,
      enum: ['fullstack', 'machinelearning', 'mobileapp', 'cloud', 'blockchain']
    }
  },
  {
    timestamps: true
  }
);

const Question = mongoose.model('Question', questionSchema);

export default Question;
