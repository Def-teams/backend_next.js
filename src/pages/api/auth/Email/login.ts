import { NextApiRequest, NextApiResponse } from 'next';
import { login } from '../../../../controllers/auth/emailAuthController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }
  
  await login(req, res);
}