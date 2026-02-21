import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import SuggestedJob from '../models/SuggestedJob.js';
import Application from '../models/Application.js';

// Get student profile
export const getStudentProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id })
      .populate('mentor', 'name email')
      .populate('mentorRequested', 'name email');
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Create or update student profile
export const updateStudentProfile = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      institution,
      department,
      cgpa,
      tenthMarks,
      twelfthMarks,
      skills,
      links,
      resume
    } = req.body;

    // Find existing profile or create new one
    let profile = await StudentProfile.findOne({ userId: req.user.id });
    
    if (profile) {
      // Update existing profile
      profile.fullName = fullName || profile.fullName;
      profile.phone = phone || profile.phone;
      profile.institution = institution || profile.institution;
      profile.department = department || profile.department;
      profile.cgpa = cgpa !== undefined ? cgpa : profile.cgpa;
      profile.tenthMarks = tenthMarks !== undefined ? tenthMarks : profile.tenthMarks;
      profile.twelfthMarks = twelfthMarks !== undefined ? twelfthMarks : profile.twelfthMarks;
      profile.skills = skills || profile.skills;
      profile.links = { ...profile.links, ...links };
      
      if (resume) {
        profile.resume = {
          ...resume,
          uploadedAt: new Date()
        };
      }
    } else {
      // Create new profile
      const user = await User.findById(req.user.id);
      profile = new StudentProfile({
        userId: req.user.id,
        fullName: fullName || user.name,
        email: user.email,
        phone,
        institution: institution || user.institution,
        department,
        cgpa,
        tenthMarks,
        twelfthMarks,
        skills: skills || [],
        links: links || {},
        resume: resume ? { ...resume, uploadedAt: new Date() } : null
      });
    }
    
    // Calculate profile completion
    profile.calculateCompletion();
    
    await profile.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Delete resume
export const deleteResume = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    profile.resume = null;
    profile.calculateCompletion();
    await profile.save();
    
    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resume',
      error: error.message
    });
  }
};

// Get mentor-suggested jobs for student
export const getSuggestedJobs = async (req, res) => {
  try {
    const appliedJobIds = await Application.distinct('jobId', { studentId: req.user._id });

    if (appliedJobIds.length > 0) {
      await SuggestedJob.deleteMany({
        student: req.user._id,
        job: { $in: appliedJobIds }
      });
    }

    const suggestions = await SuggestedJob.find({
      student: req.user._id,
      job: { $nin: appliedJobIds }
    })
      .populate('mentor', 'name email')
      .populate({
        path: 'job',
        populate: {
          path: 'company',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error fetching suggested jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggested jobs',
      error: error.message
    });
  }
};

export const searchMentors = async (req, res) => {
  try {
    const query = (req.query.q || '').trim().toLowerCase();

    if (query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters'
      });
    }

    const mentors = await User.find({
      role: 'mentor',
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
      .select('_id name email institution')
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      mentors
    });
  } catch (error) {
    console.error('Error searching mentors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search mentors',
      error: error.message
    });
  }
};

export const requestMentorByEmail = async (req, res) => {
  try {
    const mentorEmail = (req.body.mentorEmail || '').trim().toLowerCase();

    if (!mentorEmail) {
      return res.status(400).json({
        success: false,
        message: 'Mentor email is required'
      });
    }

    const mentor = await User.findOne({ email: mentorEmail, role: 'mentor' }).select('_id name email');
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'No mentor found with this email'
      });
    }

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new StudentProfile({
        userId: req.user.id,
        fullName: req.user.name,
        email: req.user.email,
        institution: req.user.institution || '',
        skills: [],
        links: {}
      });
    }

    const alreadyPendingSameMentor =
      profile.mentorRequestStatus === 'pending' &&
      profile.mentorRequested?.toString() === mentor._id.toString();

    if (alreadyPendingSameMentor) {
      return res.status(400).json({
        success: false,
        message: 'Request already pending for this mentor'
      });
    }

    profile.mentor = null;
    profile.mentorRequested = mentor._id;
    profile.mentorRequestedEmail = mentor.email;
    profile.mentorRequestStatus = 'pending';
    profile.mentorRequestedAt = new Date();
    profile.mentorReviewedAt = null;
    profile.mentorReviewNote = '';

    await profile.save();

    const refreshed = await StudentProfile.findOne({ userId: req.user.id })
      .populate('mentor', 'name email')
      .populate('mentorRequested', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Mentor request sent successfully. Please wait for verification.',
      data: refreshed
    });
  } catch (error) {
    console.error('Error requesting mentor by email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send mentor request',
      error: error.message
    });
  }
};