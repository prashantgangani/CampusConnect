import 'dotenv/config';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const requiredKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingKeys = requiredKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  throw new Error(`Missing Cloudinary environment variables: ${missingKeys.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const extensionFromMimeType = (mimeType = '') => {
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'application/msword') return '.doc';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
  return '';
};

export const uploadResumeToCloudinary = ({ buffer, userId, originalName = '', mimeType = '' }) =>
  new Promise((resolve, reject) => {
    const extension = path.extname(originalName).toLowerCase() || extensionFromMimeType(mimeType);
    const publicId = `resume_${userId}_${Date.now()}${extension}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'resumes',
        resource_type: 'raw',
        public_id: publicId,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

export const deleteResumeFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
  } catch (error) {
    console.error('Error deleting resume from Cloudinary:', error.message);
  }
};
