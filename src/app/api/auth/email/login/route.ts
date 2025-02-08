import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, password } = body;

    console.log('Login attempt:', { userId });

    // userId와 비밀번호가 모두 제공되었는지 확인
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

    const user = await User.findOne({ where: { userId } });
    
    // 사용자가 존재하지 않는 경우
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }  // Not Found
      );
    }

    // 이메일 인증이 되지 않은 경우
    if (!user.isVerified) {
      return NextResponse.json(
        { error: '이메일 인증이 필요합니다.' },
        { status: 403 }  // Forbidden
      );
    }

    // 비밀번호가 일치하지 않는 경우
    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }  // Unauthorized
      );
    }

    // 세부사항 설정이 되지 않은 경우
    if (!user.hasCompletedPreferences) {
      return NextResponse.json(
        { error: '세부사항 설정이 필요합니다.' },
        { status: 428 }  // Precondition Required
      );
    }

    // 서버 오류 조건 (예: 데이터베이스 연결 실패 등)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }  // Internal Server Error
      );
    }

    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn: '24h' }
    );

    // JWT를 데이터베이스에 저장
    user.accessToken = token; // accessToken 필드에 저장
    await user.save();

    return NextResponse.json({
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        userId: user.userId,
        profileImg: user.profileImg,
        stylePreferences: user.stylePreferences
      },
      token
    }, { status: 200 });  // OK

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }  // Internal Server Error
    );
  }
}

// OPTIONS 메소드 핸들러
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