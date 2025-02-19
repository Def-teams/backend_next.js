import { NextRequest, NextResponse } from 'next/server';
import passport from '@/config/passport';

export async function GET(req: NextRequest) {
  return new Promise((resolve, reject) => {
    passport.authenticate('google', {
      session: false,
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent'
    })(req, new NextResponse(), (error, user) => {
      if (error || !user) {
        return reject(
          NextResponse.redirect(
            `${process.env.CLIENT_URL}/auth/google?error=auth_failed`
          )
        );
      }
      resolve(NextResponse.redirect(`${process.env.CLIENT_URL}/dashboard`));
    });
  });
} 