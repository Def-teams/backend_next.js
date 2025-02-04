import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import bcrypt from 'bcrypt';
import { sendPasswordResetEmail } from '@/utils/emailService';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const { email } = await req.json(); // 이메일을 요청 본문에서 가져옴

  // 비밀번호 재설정 로직
  const user = await EmailUser.findOne({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 비밀번호 재설정 토큰 생성
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

  // 비밀번호 해시화
  const newPassword = '새로운 비밀번호'; // 새로운 비밀번호를 생성하는 로직 추가 필요
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save(); // 해시화된 비밀번호를 데이터베이스에 저장

  // 비밀번호 재설정 이메일 전송
  await sendPasswordResetEmail(user.email, token); // 토큰을 함께 전달

  return NextResponse.json(
    { message: '비밀번호 재설정 이메일이 전송되었습니다.' },
    { status: 200 }
  );
}

export async function PUT(req: NextRequest) {
  // ... 기존 PUT 구현 내용 유지
} 