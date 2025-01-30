import { NextApiRequest, NextApiResponse } from 'next';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import GoogleUser from '../../models/googleUser';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Passport Google passport
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URI,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await GoogleUser.findOne({ where: { googleId: profile.id } });
    
    if (!user) {
      user = await GoogleUser.create({
        email: profile.emails![0].value,
        userId: `google_${profile.id}`,
        googleId: profile.id,
        profileImg: {
          desktop: '/uploads/desktop/default.jpg',
          mobile: '/uploads/mobile/default.jpg'
        },
        accessToken,
        refreshToken,
        stylePreferences: [],
        isVerified: true  
      });

      
      if (profile.photos && profile.photos[0].value) {
        const imageResponse = await fetch(profile.photos[0].value);
        const imageBuffer = await imageResponse.arrayBuffer();

        // destop 170 X 170
        const desktopImagePath = path.join(process.cwd(), 'public/uploads/desktop', `${user.id}.jpg`);
        await sharp(Buffer.from(imageBuffer))
          .resize(170, 170)
          .jpeg({ quality: 90 })
          .toFile(desktopImagePath);

        // mobile 110 X 110
        const mobileImagePath = path.join(process.cwd(), 'public/uploads/mobile', `${user.id}.jpg`);
        await sharp(Buffer.from(imageBuffer))
          .resize(110, 110)
          .jpeg({ quality: 90 })
          .toFile(mobileImagePath);

        await user.update({
          profileImg: {
            desktop: `/uploads/desktop/${user.id}.jpg`,
            mobile: `/uploads/mobile/${user.id}.jpg`
          }
        });
      }
    }
    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}));

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

export const googleCallback = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    passport.authenticate('google', async (err: any, user: any) => {
      if (err) {
        console.error('Google 인증 에러:', err);
        return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
      }

      if (!user) {
        return res.status(401).json({ error: '인증에 실패했습니다.' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          userId: user.userId,
          profileImg: user.profileImg,
          stylePreferences: user.stylePreferences
        }
      });
    })(req, res);
  } catch (error) {
    console.error('Google 콜백 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};