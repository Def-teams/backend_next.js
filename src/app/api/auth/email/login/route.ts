import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, password } = body;

    console.log('Login attempt:', { userId }); 

    if (!userId || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const user = await EmailUser.findOne({ where: { userId } });
    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      );
    }

    console.log('Stored hash:', user.password);
    console.log('Input password:', password);

    if ((user.failedAttempts ?? 0) >= 10) {
      await user.update({ isLocked: true });
      return NextResponse.json(
        { 
          error: '계정이 잠겼습니다. 비밀번호 재설정이 필요합니다.',
          resetRequired: true 
        },
        { status: 423 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isValidPassword);
    if (!isValidPassword) {
      const remainingAttempts = 10 - (user.failedAttempts || 0);
      await user.increment('failedAttempts');
      return NextResponse.json(
        { 
          error: `비밀번호가 일치하지 않습니다. (남은 시도: ${remainingAttempts-1}회)`,
          remainingAttempts: remainingAttempts-1 
        },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: '이메일 인증이 필요합니다.' },
        { status: 403 }
      );
    }

    if (!user.hasCompletedPreferences) {
      return NextResponse.json(
        { error: '세부사항 설정이 필요합니다.' },
        { status: 403 }
      );
    }

    await user.update({ 
      failedAttempts: 0,
      isLocked: false 
    });

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET 환경 변수가 정의되지 않았습니다');
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return new NextResponse(
      JSON.stringify({
        message: '로그인 성공',
        user: {
          id: user.id,
          email: user.email,
          userId: user.userId,
          profileImg: user.profileImg,
          stylePreferences: user.stylePreferences
        },
        token
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
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