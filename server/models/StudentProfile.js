import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  institution: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  
  // Academic Information
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  tenthMarks: {
    type: Number,
    min: 0,
    max: 100
  },
  twelfthMarks: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Resume (stored as base64 string or GridFS reference)
  resume: {
    fileName: String,
    fileData: String, // Base64 encoded file data
    fileType: String,
    uploadedAt: Date
  },
  
  // Social & Coding Links
  links: {
    linkedin: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    portfolio: {
      type: String,
      trim: true
    },
    leetcode: {
      type: String,
      trim: true
    },
    codechef: {
      type: String,
      trim: true
    },
    codeforces: {
      type: String,
      trim: true
    },
    hackerrank: {
      type: String,
      trim: true
    },
    other: {
      type: String,
      trim: true
    }
  },
  
  // Skills
  skills: [{
    type: String,
    trim: true
  }],

  // Mentor Assignment
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  mentorRequested: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  mentorRequestedEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  mentorRequestStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none'
  },
  mentorRequestedAt: {
    type: Date,
    default: null
  },
  mentorReviewedAt: {
    type: Date,
    default: null
  },
  mentorReviewNote: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Profile completion percentage
  profileCompletion: {
    type: Number,
    default: 0
  },
  
  // Profile Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate profile completion percentage
studentProfileSchema.methods.calculateCompletion = function() {
  let completion = 0;
  const fields = [
    this.fullName, this.email, this.phone, this.institution,
    this.department, this.cgpa, this.tenthMarks, this.twelfthMarks,
    this.resume?.fileData, this.skills?.length > 0
  ];
  
  fields.forEach(field => {
    if (field) completion += 10;
  });
  
  this.profileCompletion = completion;
  return completion;
};

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

export default StudentProfile;