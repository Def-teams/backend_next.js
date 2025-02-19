import jwt from 'jsonwebtoken';
import User from '@/models/user';
import bcrypt from 'bcrypt';

export const generateTokens = async (userId: string) => {
  const secret = process.env.JWT_SECRET!;
  
  // 액세스 토큰 (15분 유효)
  const accessToken = jwt.sign({ userId }, secret, { expiresIn: '15m' });
  
  // 리프레시 토큰 (7일 유효)
  const refreshToken = jwt.sign({ userId }, secret, { expiresIn: '7d' });
  
  // DB에 리프레시 토큰 저장
  await User.update(
    { 
      refreshToken: await bcrypt.hash(refreshToken, 10),
      accessToken,
      tokenExpiration: new Date(Date.now() + 15 * 60 * 1000) // 15분 후 만료
    },
    { where: { userId } }
  );

  return { accessToken, refreshToken };
}; 