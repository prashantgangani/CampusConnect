import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import SuggestedJob from '../models/SuggestedJob.js';

// Get student profile
export const getStudentProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    
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
    const suggestions = await SuggestedJob.find({ student: req.user._id })
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