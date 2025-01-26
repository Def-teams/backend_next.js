import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';

export async function POST(req: NextRequest) {
  try {
    const { userId, verificationCode } = await req.json();

    if (!userId || !verificationCode) {
      return NextResponse.json(
        { error: '사용자 ID와 인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    const user = await EmailUser.findOne({ where: { userId } });
    
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

    console.log('Received verification code:', verificationCode);
    console.log('Stored verification code:', user.verificationCode);

    if (user.verificationCode !== verificationCode.toString()) {
      return NextResponse.json(
        { error: '잘못된 인증 코드입니다.' },
        { status: 400 }
      );
    }

    if (user.verificationExpires && new Date() > user.verificationExpires) {
      return NextResponse.json(
        { error: '인증 코드가 만료되었습니다.' },
        { status: 400 }
      );
    }

    await user.update({ 
      isVerified: true,
      verificationCode: undefined,
      verificationExpires: undefined
    });

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