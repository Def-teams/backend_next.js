import { NextApiRequest, NextApiResponse } from 'next';

export const errorHandler = (err: any, req: NextApiRequest, res: NextApiResponse) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }

  return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
};