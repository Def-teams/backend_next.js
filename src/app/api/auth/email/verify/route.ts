import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/user';
import sequelize from '@/config/database';


export async function POST(req: NextRequest) {  
  try {
    const { userId, verificationCode } = await req.json();
    
    console.log('Request body:', { userId, verificationCode });

    const user = await EmailUser.findOne({ 
      where: { 
        userId: userId.toString(),
        provider: 'email'
      },
      attributes: { // 명시적 컬럼 지정
        exclude: ['googleId', 'kakaoId', 'naverId'] 
      },
      raw: true
    });
    
    console.log('Found user:', user);

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

    // 문자열로 변환하여 비교
    if (user.verificationCode !== verificationCode) {
      return NextResponse.json(
        { error: '잘못된 인증 코드입니다.' },
        { status: 400 }
      );
    }

    if (user.verificationExpires && new Date() > new Date(user.verificationExpires)) {
      return NextResponse.json(
        { error: '인증 코드가 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 인스턴스로 다시 조회하여 업데이트
    const userInstance = await EmailUser.findOne({ where: { userId } });
    if (!userInstance) {
      throw new Error('사용자 인스턴스를 찾을 수 없음');
    }

    const transaction = await sequelize.transaction();
    try {
      await userInstance.update({
        isVerified: true,
        verificationCode: null,
        verificationExpires: null
      }, { 
        transaction,
        fields: ['isVerified', 'verificationCode', 'verificationExpires'], // 명시적 필드 지정
        validate: false // 임시 유효성 검사 비활성화
      });
      await transaction.commit();
    } catch (updateError) {
      await transaction.rollback();
      throw updateError;
    }

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