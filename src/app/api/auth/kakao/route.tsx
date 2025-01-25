import { NextApiRequest, NextApiResponse } from 'next';
import EmailUser from '@/models/emailUser';

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 요청에서 데이터 가져오기
    const { email, password } = req.body;

    // 예시 데이터 처리
    const user = await EmailUser.create({ email, password });

    // 응답 데이터
    const data = {
      message: 'User created successfully!',
      user: {
        id: user.id,
        email: user.email
      }
    };

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}