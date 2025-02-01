import { NextApiRequest, NextApiResponse } from 'next';
import { multerMiddleware } from '@/lib/multer-adapter';
import { uploadImage } from '@/controllers/auth/imageController';

export const config = {
  api: {
    bodyParser: false, // Multer가 직접 body 파싱
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const upload = multerMiddleware({
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      allowedTypes.includes(file.mimetype) 
        ? cb(null, true) 
        : cb(new Error('INVALID_FILE_TYPE'))
    }
  });

  try {
    await upload(req, res);
    const result = await uploadImage(req);
    res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.message === 'FILE_REQUIRED' ? 400 : 500;
    res.status(statusCode).json({
      error: error.message,
      details: error.details
    });
  }
} 