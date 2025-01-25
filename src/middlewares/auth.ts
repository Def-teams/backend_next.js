import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export const verifyToken = (req: NextApiRequest, res: NextApiResponse, next: Function) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: '토큰이 만료되었습니다.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};