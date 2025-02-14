import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { generateVerificationCode } from '@/utils/generateVerificationCode';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/utils/emailService';
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
        attributes: ['id', 'email', 'userId'],
        where: {
          [Op.or]: [
            { email: email as string },
            { userId: userId as string }
          ]
        },
        raw: true
      });

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
    const { userId, accessToken } = await req.json();
    console.log('Received userId:', userId);
    console.log('Received accessToken:', accessToken);

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
      console.log('Decoded accessToken:', decoded);
    } catch (error) {
      console.error('Token Verification Error:', error);
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
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset_password?token=${resetToken}`;

    // 이메일 전송
    await sendPasswordResetEmail(user.email, resetLink);

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