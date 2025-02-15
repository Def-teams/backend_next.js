import { NextRequest, NextResponse } from 'next/server';
import passport from '@/config/passport';

export async function GET(req: NextRequest) {
  if (!process.env.CLIENT_URL) {
    return NextResponse.json(
      { error: '서버 구성 오류가 발생했습니다' },
      { status: 500 }
    );
  }
  
  return new Promise((resolve, reject) => {
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/auth/google?error=auth_failed`
    })(req, new NextResponse(), async (err, user) => {
      if (err || !user) {
        return reject(NextResponse.redirect(`${process.env.CLIENT_URL}/auth/google?error=auth_failed`));
      }

      const redirectUrl = user.hasCompletedPreferences 
        ? `${process.env.CLIENT_URL}/?access_token=${user.accessToken}`
        : `${process.env.CLIENT_URL}/preferences?user_id=${user.userId}`;

      resolve(NextResponse.redirect(redirectUrl));
    });
  });
} 