import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateVerificationCode } from '@/utils/generateVerificationCode';

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    console.log('Login attempt:', { userId });

    // CORS 헤더 설정
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400, headers }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호가 필요합니다.' },
        { status: 400, headers }
      );
    }

    const user = await User.findOne({
      where: { userId },
      attributes: ['id', 'userId', 'email', 'password', 'profileImg', 'stylePreferences', 'isVerified', 'hasCompletedPreferences', 'size']
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404, headers }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: '이메일 인증이 필요합니다.' },
        { status: 403, headers }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401, headers }
      );
    }

    if (!user.hasCompletedPreferences) {
      return NextResponse.json(
        { error: '세부사항 설정이 필요합니다.' },
        { status: 428, headers }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500, headers }
      );
    }

    const accessToken = jwt.sign(
      { userId: user.userId, stylePreferences: user.stylePreferences, size: user.size },
      secret,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      secret,
      { expiresIn: '7d' }
    );

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    return NextResponse.json(
      {
        message: '로그인 성공',
        user: {
          id: user.id,
          email: user.email,
          userId: user.userId,
          profileImg: user.profileImg,
          stylePreferences: user.stylePreferences,
          size: user.size
        },
        accessToken,
        refreshToken
      },
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new NextResponse(null, { status: 204, headers });
}