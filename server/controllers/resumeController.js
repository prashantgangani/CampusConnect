import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import { uploadResumeToCloudinary, deleteResumeFromCloudinary, cloudinary } from '../config/cloudinary.js';
import https from 'https';
import http from 'http';

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Resume file is required'
      });
    }

    let profile = await StudentProfile.findOne({ userId: req.user.id });

    if (!profile) {
      const user = await User.findById(req.user.id).select('name email institution');

      if (!user) {
        return res.status(404).json({
          message: 'Student not found'
        });
      }

      profile = new StudentProfile({
        userId: req.user.id,
        fullName: user.name,
        email: user.email,
        institution: user.institution || '',
        skills: [],
        links: {}
      });
    }

    if (profile.resume?.publicId) {
      await deleteResumeFromCloudinary(profile.resume.publicId);
    }

    const uploaded = await uploadResumeToCloudinary({
      buffer: req.file.buffer,
      userId: req.user.id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    profile.resume = {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      uploadedAt: new Date()
    };

    profile.calculateCompletion();
    await profile.save();

    return res.status(200).json({
      message: 'Resume uploaded successfully',
      url: uploaded.secure_url,
      publicId: uploaded.public_id
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return res.status(500).json({
      message: error.message || 'Failed to upload resume'
    });
  }
};

export const downloadResume = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        message: 'PublicId is required'
      });
    }

    // Fetch resource details from Cloudinary
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'raw'
    });

    if (!resource || !resource.secure_url) {
      return res.status(404).json({
        message: 'Resume not found on Cloudinary'
      });
    }

    // Return the secure URL with proper headers
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Content-Type', 'application/json');
    
    return res.status(200).json({
      success: true,
      url: resource.secure_url
    });
  } catch (error) {
    console.error('Resume download error:', error);
    res.status(500).json({
      message: error.message || 'Failed to fetch resume'
    });
  }
};
