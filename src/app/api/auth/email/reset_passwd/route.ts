import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { sendPasswordResetEmail } from '@/utils/emailService';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  const { userId } = await req.json(); // userId를 요청 본문에서 가져옴

  // 사용자 찾기
  const user = await User.findOne({ where: { userId } });
  if (!user) {
    return NextResponse.json(
      { error: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 비밀번호 재설정 토큰 생성
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: '서버 오류: 비밀 키가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
  console.log('Generated Token:', token); // 디버깅 로그 추가

  // 비밀번호 재설정 이메일 전송
  await sendPasswordResetEmail(user.email, token); // 토큰을 함께 전달

  return NextResponse.json(
    { message: '비밀번호 재설정 이메일이 전송되었습니다.' },
    { status: 200 }
  );
}

export async function PUT(req: NextRequest) {
  const { token, newPassword } = await req.json(); // 토큰과 새로운 비밀번호를 요청 본문에서 가져옴
  console.log('Received Token:', token); // 디버깅 로그 추가

  // 토큰 검증
  let decoded;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: '서버 오류: 비밀 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }
    decoded = jwt.verify(token, secret) as { userId: string };
  } catch (error) {
    console.error('Token Verification Error:', error); // 에러 로그 추가
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다.' },
      { status: 400 }
    );
  }

  // 사용자 찾기
  const user = await User.findByPk(decoded.userId);
  if (!user) {
    return NextResponse.json(
      { error: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 비밀번호 해시화
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save(); // 해시화된 비밀번호를 데이터베이스에 저장

  return NextResponse.json(
    { message: '비밀번호가 성공적으로 변경되었습니다.' },
    { status: 200 }
  );
} 