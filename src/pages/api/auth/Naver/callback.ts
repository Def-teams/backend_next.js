import { NextApiRequest, NextApiResponse } from 'next';
import { naverCallback } from '../../../../controllers/auth/naverAuthController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  await naverCallback(req, res);
}