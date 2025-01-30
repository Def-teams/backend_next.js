import { NextApiRequest, NextApiResponse } from 'next';
import { deleteImage } from '../../../../controllers/auth/imageController';
import { verifyToken } from '../../../../middlewares/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    // JWT 토큰 검증
    await verifyToken(req, res);
    // 이미지 삭제 처리
    await deleteImage(req, res);
  } catch (error) {
    console.error('이미지 삭제 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}