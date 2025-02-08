import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import sequelize from '@/config/database';
import { sendDeletionConfirmationEmail } from '@/utils/emailService';

export async function DELETE(req: NextRequest) {
  const transaction = await sequelize.transaction();
  
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'userId와 password가 필요합니다.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      where: { userId },
      attributes: ['id', 'email', 'password'],
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (user.password && await bcrypt.compare(password, user.password)) {
      // soft delete 대신 실제 삭제 수행
      await User.destroy({
        where: { id: user.id },
        transaction
      });

      if (user.email) {
        // 이메일 전송을 비동기로 처리
        const emailPromise = sendDeletionConfirmationEmail(user.email).catch(error => {
          console.error('이메일 전송 실패:', error);
        });

        await transaction.commit();
        await emailPromise;
      }

      return NextResponse.json(
        { message: '계정이 성공적으로 삭제되었습니다.' },
        { status: 200 }
      );
    } else {
      await transaction.rollback();
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

  } catch (error) {
    await transaction.rollback();
    console.error('계정 삭제 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 