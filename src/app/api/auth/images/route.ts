import { NextApiRequest, NextApiResponse } from 'next';
import { uploadImage } from '@/controllers/auth/imageController';

export const config = {
  api: {
    bodyParser: false, // Multer가 직접 body 파싱
  },
};

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    await uploadImage(req, res);
    res.status(200).json({ message: '파일 업로드 성공' });
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
} 