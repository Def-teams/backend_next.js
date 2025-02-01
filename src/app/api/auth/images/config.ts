import { multerMiddleware } from '@/lib/multer-adapter';

export const config = {
  api: { bodyParser: false },
};

export const imageUploader = multerMiddleware({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    allowedTypes.includes(file.mimetype) 
      ? cb(null, true) 
      : cb(new Error('INVALID_FILE_TYPE'))
  }
});