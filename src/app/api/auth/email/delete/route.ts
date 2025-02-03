import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import bcrypt from 'bcrypt';
import { sendDeletionConfirmationEmail } from '@/utils/emailService';
import { Op } from 'sequelize';

export async function DELETE(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: '사용자 ID와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!EmailUser.sequelize) throw new Error('Sequelize 인스턴스를 찾을 수 없습니다');
    const transaction = await EmailUser.sequelize.transaction();

    try {
      const user = await EmailUser.findOne({
        where: { userId },
        transaction
      });

      if (!user) {
        await transaction.rollback();
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        await transaction.rollback();
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        );
      }

      await user.destroy({ transaction });
      await transaction.commit();

      // 삭제 확인 이메일 전송
      await sendDeletionConfirmationEmail(user.email);

      return NextResponse.json(
        { message: '계정이 성공적으로 삭제되었습니다.' },
        { status: 200 }
      );

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('계정 삭제 오류:', error);
    return NextResponse.json(
      { error: '계정 삭제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 