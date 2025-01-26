import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    const user = await EmailUser.findOne({ where: { email: decoded.email } });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: '이미 인증된 계정입니다.' },
        { status: 400 }
      );
    }

    await user.update({ isVerified: true });

    return NextResponse.json({
      message: '이메일 인증이 완료되었습니다.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 