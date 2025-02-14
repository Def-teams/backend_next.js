import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '@/utils/emailService';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  const user = await User.findOne({ where: { userId } });
  if (!user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: '서버 오류: 비밀 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  const token = jwt.sign({ userId: user.userId }, secret, { expiresIn: '1h' });
  console.log('Generated Token:', token);

  // 비밀번호 재설정 이메일 전송
  const resetToken = jwt.sign({ userId: user.userId }, secret, { expiresIn: '1h' });
  const encodedToken = encodeURIComponent(resetToken).replace(/\./g, '%2E');
  await sendPasswordResetEmail(user.email, encodedToken);

  return NextResponse.json({ message: '비밀번호 재설정 이메일이 전송되었습니다.' }, { status: 200 });
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, accessToken } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: '액세스 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    // 액세스 토큰 검증
    let decoded;
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: '서버 오류: 비밀 키가 설정되지 않았습니다.' },
          { status: 500 }
        );
      }
      decoded = jwt.verify(accessToken, secret) as { userId: number };
    } catch (error) {
      console.error('Token Verification Error:', error);
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: '토큰이 만료되었습니다. 다시 시도해주세요.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 재설정 링크 생성
    const resetToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    const encodedToken = encodeURIComponent(resetToken).replace(/\./g, '%2E');
    await sendPasswordResetEmail(user.email, encodedToken);

    return NextResponse.json(
      { message: '비밀번호 재설정 이메일이 전송되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'GET 요청이 성공적으로 처리되었습니다.' }, { status: 200 });
} 