import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import User from '../models/User';
import { Profile } from 'passport-google-oauth20';
import { Op } from 'sequelize';

// Kakao 전략 프로필 타입 명시
interface KakaoProfile extends passport.Profile {
  id: string;
  _json: {
    kakao_account: {
      email: string;
    };
    properties?: {
      profile_image?: string;
    };
  };
  photos?: Array<{ value: string }>;
}

// Naver 전략 프로필 타입 명시
interface NaverProfile extends passport.Profile {
  id: string;
  email: string;
  photos?: { value: string }[];
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_SIGNUP_ID!,
  clientSecret: process.env.GOOGLE_SIGNUP_SECRET!,
  callbackURL: process.env.GOOGLE_SIGNUP_CALLBACK_URI || 'http://localhost:8080/api/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { googleId: profile.id },
          { email: profile.emails?.[0]?.value }
        ]
      }
    });

    // 기존 사용자 체크
    if (existingUser) {
      if (!existingUser.googleId) {
        existingUser.googleId = profile.id;
        await existingUser.save();
      }
      return done(null, existingUser);
    }

    // 신규 회원 생성
    const newUser = await User.create({
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      userId: `google_${profile.id}`,
      provider: 'google',
      profileImg: {
        desktop: profile.photos?.[0]?.value || '/default-profile.jpg',
        mobile: profile.photos?.[0]?.value || '/default-profile.jpg'
      },
      isVerified: true,
      hasCompletedPreferences: false
    });

    done(null, newUser);
  } catch (error) {
    done(error);
  }
}));

// Kakao Strategy
passport.use(new KakaoStrategy({
  clientID: process.env.KAKAO_CLIENT_ID!,
  clientSecret: process.env.KAKAO_CLIENT_SECRET!,
  callbackURL: process.env.KAKAO_CALLBACK_URI!,
}, async (accessToken, refreshToken, profile: KakaoProfile, done) => {
  try {
    const kakaoEmail = profile._json?.kakao_account?.email;
    const kakaoPhoto = profile.photos?.[0]?.value;
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { kakaoId: profile.id },
          { email: kakaoEmail }
        ]
      }
    });

    if (user) {
      if (!user.kakaoId) {
        user.kakaoId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    const newUser = await User.create({
      kakaoId: profile.id,
      email: kakaoEmail,
      userId: `kakao_${profile.id}`,
      provider: 'kakao',
      profileImg: {
        desktop: kakaoPhoto || '/default-kakao.jpg',
        mobile: kakaoPhoto || '/default-kakao.jpg'
      },
      isVerified: true,
      hasCompletedPreferences: false
    });

    done(null, newUser);
  } catch (error) {
    done(error);
  }
}));

// Naver Strategy
passport.use(new NaverStrategy({
  clientID: process.env.NAVER_CLIENT_ID!,
  clientSecret: process.env.NAVER_CLIENT_SECRET!,
  callbackURL: process.env.NAVER_CALLBACK_URI!,
  passReqToCallback: false
}, async (accessToken, refreshToken, profile: NaverProfile, done) => {
  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { naverId: profile.id },
          { email: profile.email }
        ]
      }
    });

    if (user) {
      if (!user.naverId) {
        user.naverId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    const newUser = await User.create({
      naverId: profile.id,
      email: profile.email,
      userId: `naver_${profile.id}`,
      provider: 'naver',
      profileImg: {
        desktop: profile.photos?.[0].value || '/default-naver.jpg',
        mobile: profile.photos?.[0].value || '/default-naver.jpg'
      },
      isVerified: true,
      hasCompletedPreferences: false
    });

    done(null, newUser);
  } catch (error) {
    done(error);
  }
}));

declare global {
  namespace Express {
    interface User {
      id: number;
      provider: string;
      googleId?: string;
      kakaoId?: string;
      naverId?: string;
    }
  }
}

export default passport;