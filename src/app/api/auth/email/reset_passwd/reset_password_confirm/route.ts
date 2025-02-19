import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { userId, token: accessToken, newPassword } = await req.json();
    
    if (!userId || !accessToken) {
      return NextResponse.json({ error: '인증 정보가 부족합니다.' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: '새 비밀번호가 필요합니다.' }, { status: 400 });
    }

    // 액세스 토큰 검증
    let decoded;
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return NextResponse.json({ error: '서버 오류: 비밀 키가 설정되지 않았습니다.' }, { status: 500 });
      }
      decoded = jwt.verify(accessToken, secret) as { userId: string };
      if(String(decoded.userId) !== String(userId)) {
        return NextResponse.json({ error: '잘못된 접근입니다.' }, { status: 401 });
      }
    } catch (error) {
      console.error('Token Verification Error:', error);
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const user = await User.findOne({ 
      where: { userId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    user.password = newPassword;
    await user.save();

    console.log('Password updated for user:', user.userId);
    return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' }, { status: 200 });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}