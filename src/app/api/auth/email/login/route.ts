import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateVerificationCode } from '@/utils/generateVerificationCode';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, password } = body;

    console.log('Login attempt:', { userId });

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      where: { userId },
      attributes: ['id', 'userId', 'email', 'password', 'profileImg', 'stylePreferences', 'isVerified', 'hasCompletedPreferences', 'size']
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: '이메일 인증이 필요합니다.' },
        { status: 403 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    if (!user.hasCompletedPreferences) {
      return NextResponse.json(
        { error: '세부사항 설정이 필요합니다.' },
        { status: 428 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const accessToken = jwt.sign(
      { 
        userId: user.userId,
        stylePreferences: user.stylePreferences,
        size: user.size
      },
      secret,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.userId },
      secret,
      { expiresIn: '7d' }
    );

    // verificationCode 및 verificationExpires 초기화 (로그인 시에는 초기화)
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.verificationCode = null;
    user.verificationExpires = null;
    await user.save();

    return NextResponse.json({
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
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 