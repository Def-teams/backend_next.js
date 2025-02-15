import { NextRequest, NextResponse } from 'next/server';
import passport from '@/config/passport';

export async function GET(req: NextRequest) {
  console.log('Google 인증 시작', process.env.GOOGLE_SIGNUP_ID);
  return new Promise((resolve, reject) => {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false
    })(req, new NextResponse(), (err) => {
      err ? reject(NextResponse.json({ error: '인증 초기화 실패' }, { status: 500 })) : resolve(NextResponse.redirect('/'));
    });
  });
} 