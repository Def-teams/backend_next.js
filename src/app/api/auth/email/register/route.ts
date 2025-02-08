import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { generateVerificationCode } from '@/utils/generateVerificationCode';
import { sendVerificationEmail } from '@/utils/emailService';
import sequelize from '@/config/database';
import { Transaction } from 'sequelize';
import { Sequelize, DatabaseError } from 'sequelize';





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

  while (await User.findOne({ where: { userId: newId } })) {
    newId = `${baseId}_${count}`;
    count++;
  }


  return newId;
}

export async function POST(req: NextRequest) {
  let retryCount = 0;
  const MAX_RETRIES = 3;

  while (retryCount < MAX_RETRIES) {
    try {
      const transaction = await sequelize.transaction({ 
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED 
      });
      const { email, password, userId } = await req.json();

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

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email as string },
            { userId: userId as string },
            { snsId: email as string }
          ]
        },
        transaction
      }) as unknown as InstanceType<typeof User>;

      if (existingUser) {
        if (existingUser.provider === 'email' && existingUser.email === email) {
          return NextResponse.json(
            { error: '이미 등록된 이메일입니다.', exists: true },
            { status: 409 }
          );
        }
        if (existingUser.provider !== 'email') {
          return NextResponse.json(
            { 
              error: 'SNS 계정과 연동이 필요합니다.', 
              requiresLinking: true,
              existingProvider: existingUser.provider 
            },
            { status: 409 }
          );
        }
      }

      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash(password, salt);

      const userData = {
        email,
        password: password, // hashedPassword,
        userId,
        verificationCode: generateVerificationCode().toString(),
        verificationExpires: new Date(Date.now() + 30 * 60 * 1000),
        isVerified: false,
        profileImg: {
          desktop: '/public/uploads/User_profile/default/desktop_default.jpg',
          mobile: '/public/uploads/User_profile/default/mobile_default.jpg'
        },
        stylePreferences: [],
        size: 'M' as 'M',
        hasCompletedPreferences: false,
        failedAttempts: 0,
        isLocked: false
      };

      const newUser = await User.create({
        ...userData,
        provider: 'email',
        id: undefined
      }, { transaction });

      try {
        await sendVerificationEmail(email, userData.verificationCode);
      } catch (emailError) {
        await transaction.rollback();
        return NextResponse.json(
          { error: '이메일 전송에 실패했습니다.' },
          { status: 500 }
        );
      }

      await transaction.commit();
      return NextResponse.json({
        message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
        user: {
          id: newUser.id,
          email: newUser.email,
          userId: newUser.userId
        }
      }, { status: 201 });

    } catch (error) {
      if (error instanceof DatabaseError && (error.parent as any)?.errno === 1213) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error('Maximum retry attempts reached');
        }
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      } else {
        throw error;
      }
    }
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

    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      );
    }

    const isValidPassword = user.password ? await bcrypt.compare(password, user.password) : false;
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