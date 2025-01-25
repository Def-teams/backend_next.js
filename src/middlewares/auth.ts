import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export const verifyToken = async (req: NextApiRequest, res: NextApiResponse, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    
    return next();
  } catch (error) {
    console.error('인증 에러:', error);
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
};