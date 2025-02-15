import { NextApiRequest, NextApiResponse } from 'next';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

export const googleLogin = (req: NextApiRequest, res: NextApiResponse) => {
  passport.authenticate('google', {
    session: false,
    state: JSON.stringify(req.query)
  })(req, res);
};

export const googleCallback = (req: NextApiRequest, res: NextApiResponse) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }

    // 선호도 설정 미완료 사용자 처리
    if (!user.hasCompletedPreferences) {
      const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '10m' });
      return res.redirect(`${process.env.CLIENT_URL}/preferences?token=${token}`);
    }

    // 정상 로그인 처리
    const accessToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.redirect(`${process.env.CLIENT_URL}/auth-redirect?access=${accessToken}`);
  })(req, res);
};