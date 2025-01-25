import { NextApiRequest, NextApiResponse } from 'next';
import { verifyEmail } from '../../../../controllers/auth/emailAuthController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }
  
  await verifyEmail(req, res);
}