import { NextApiRequest, NextApiResponse } from 'next';
import passport from 'passport';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import jwt from 'jsonwebtoken';
import KakaoUser from '../../models/kakaoUser';
import sharp from 'sharp';
import path from 'path';

passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID!,
  clientSecret: process.env.KAKAO_CLIENT_SECRET!,
  callbackURL: process.env.KAKAO_CALLBACK_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await KakaoUser.findOne({ where: { kakaoId: profile.id } });

    if (!user) {
      user = await KakaoUser.create({
        email: profile._json.kakao_account.email,
        userId: `kakao_${profile.id}`,
        kakaoId: profile.id,
        profileImg: {
          desktop: '/uploads/desktop/default.jpg',
          mobile: '/uploads/mobile/default.jpg'
        },
        accessToken,
        refreshToken
      });

      // 카카오 프로필 이미지 처리
      if (profile._json.properties.profile_image) {
        const imageResponse = await fetch(profile._json.properties.profile_image);
        const imageBuffer = await imageResponse.arrayBuffer();

        // 데스크톱용 이미지 (170x170)
        const desktopPath = path.join(process.cwd(), 'public/uploads/desktop', `${user.id}.jpg`);
        await sharp(Buffer.from(imageBuffer))
          .resize(170, 170)
          .jpeg({ quality: 90 })
          .toFile(desktopPath);

        // 모바일용 이미지 (110x110)
        const mobilePath = path.join(process.cwd(), 'public/uploads/mobile', `${user.id}.jpg`);
        await sharp(Buffer.from(imageBuffer))
          .resize(110, 110)
          .jpeg({ quality: 90 })
          .toFile(mobilePath);

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
    return done(error as Error, undefined);
  }
}));

export const kakaoAuth = passport.authenticate('kakao');

export const kakaoCallback = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    passport.authenticate('kakao', async (err: any, user: any) => {
      if (err) {
        console.error('Kakao 인증 에러:', err);
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
    console.error('Kakao 콜백 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};