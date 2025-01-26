import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('Received registration request:', { email }); // 로깅

    // 입력값 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '유효하지 않은 이메일 형식입니다.' },
        { status: 400 }
      );
    }

    // 이미 존재하는 사용자 확인
    const existingUser = await EmailUser.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    // 새 사용자 생성
    const user = await EmailUser.create({
      email,
      password, // bcrypt는 모델의 beforeSave 훅에서 처리됨
      userId: `email_${Date.now()}`,
      profileImg: {
        desktop: '/uploads/desktop/default.jpg',
        mobile: '/uploads/mobile/default.jpg'
      },
      stylePreferences: [],
      isVerified: false
    });

    // 인증 토큰 생성
    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    console.log('User created successfully:', { userId: user.id }); // 로깅

    return NextResponse.json({
      message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
      user: {
        id: user.id,
        email: user.email,
        userId: user.userId
      },
      token
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 로그인 엔드포인트
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('Received login request:', { email }); // 로깅

    // 입력값 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = await EmailUser.findOne({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 이메일 인증 확인
    if (!user.isVerified) {
      return NextResponse.json(
        { error: '이메일 인증이 필요합니다.' },
        { status: 403 }
      );
    }

    // 로그인 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    console.log('User logged in successfully:', { userId: user.id }); // 로깅

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
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}