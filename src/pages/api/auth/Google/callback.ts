import { NextApiRequest, NextApiResponse } from 'next';
import { googleCallback } from '../../../../controllers/auth/googleAuthController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  await googleCallback(req, res);
}