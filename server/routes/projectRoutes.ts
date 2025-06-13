
import { Router } from 'express';
import multer from 'multer';
import { mixWithReference, downloadMix } from '../controllers/mixController';
import { UPLOAD_DIR } from '../config';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({ 
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 20 // Max 20 files total
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/flac',
      'audio/x-flac',
      'audio/aac',
      'audio/ogg',
      'application/octet-stream' // Some audio files may have this MIME type
    ];
    
    const allowedExtensions = ['.wav', '.mp3', '.flac', '.aac', '.ogg', '.m4a'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

// Mix with reference endpoint
router.post('/projects/:projectId/mix-with-reference', 
  upload.fields([
    { name: 'stems', maxCount: 10 },
    { name: 'reference', maxCount: 1 }
  ]), 
  mixWithReference
);

// Download rendered mix
router.get('/download/:filename', downloadMix);

// Error handling middleware for multer
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 100MB per file.' });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 20 files allowed.' });
    }
  }
  
  if (error.message && error.message.includes('Unsupported file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

export default router;
