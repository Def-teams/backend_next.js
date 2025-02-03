import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { generateVerificationCode } from '@/utils/generateVerificationCode';
import { sendVerificationEmail } from '@/utils/emailService';
import { EmailUserAttributes } from '@/models/emailUser';


// GET 메소드 추가
export async function GET() {
  return NextResponse.json(
    { message: 'Email auth endpoint is working' },
    { status: 200 }
  );
}

async function generateUniqueUserId(baseId: string) {
  let newId = baseId;
  let count = 1;

  while (await EmailUser.findOne({ where: { userId: newId } })) {
    newId = `${baseId}_${count}`;
    count++;
  }

  return newId;
}

export async function POST(req: NextRequest) {
  try {
    if (!req.body) {
      return NextResponse.json(
        { error: '요청 본문이 비어 있습니다.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, password, userId } = body;

    if (!email || !password || !userId) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 그리고 사용자 ID를 입력해주세요.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '유효하지 않은 이메일 형식입니다.' },
        { status: 400 }
      );
    }

    const existingUser = await EmailUser.findOne({
      where: {
        [Op.or]: [{ email }, { userId }]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일 또는 사용자 ID입니다.' },
        { status: 409 }
      );
    }

    const verificationCode = generateVerificationCode();

    const userData = {
      email,
      password: password,
      userId,
      verificationCode: verificationCode.toString(),
      verificationExpires: new Date(Date.now() + 30 * 60 * 1000),
      isVerified: false,
      isLocked: false,
      profileImg: {
        desktop: '/uploads/desktop/default.jpg',
        mobile: '/uploads/mobile/default.jpg'
      },
      stylePreferences: [],
      size: 'M' as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
      hasCompletedPreferences: false
    };

    const newUser = await EmailUser.create(userData);
    await sendVerificationEmail(newUser.email, newUser.verificationCode!);

    return NextResponse.json({
      message: '사용자가 성공적으로 생성되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        userId: newUser.userId
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, password } = body;

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

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: '이메일 인증이 필요합니다.' },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

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


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
}