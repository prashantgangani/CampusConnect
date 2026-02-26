import multer from 'multer';

const MAX_RESUME_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const originalName = (file.originalname || '').toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((extension) => originalName.endsWith(extension));
  const hasAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (!hasAllowedMime && !hasAllowedExtension) {
    callback(new Error('Only PDF, DOC, and DOCX files are allowed'));
    return;
  }

  callback(null, true);
};

const uploader = multer({
  storage,
  limits: {
    fileSize: MAX_RESUME_SIZE,
    files: 1
  },
  fileFilter
});

export const uploadResumeSingle = (req, res, next) => {
  uploader.single('resume')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Resume must be 2MB or smaller'
      });
    }

    return res.status(400).json({
      message: error.message || 'Invalid resume upload request'
    });
  });
};
