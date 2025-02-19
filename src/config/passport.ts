import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Profile as GooglePassportProfile } from 'passport';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as NaverStrategy } from 'passport-naver-v2';
import User from '../models/user';
import { Op } from 'sequelize';
import MemoryStore from 'memorystore';

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

// Google 전략 프로필 타입 명시
interface GoogleProfile extends passport.Profile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

// Naver 전략 프로필 타입 명시
interface NaverProfile extends passport.Profile {
  id: string;
  email: string;
  photos?: { value: string }[];
}

const initializeGoogleStrategy = () => {
  return new GoogleStrategy({
    clientID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile: GoogleProfile, done) => {
    try {
      const emailDomain = profile.emails?.[0]?.value.split('@')[1];
      if (emailDomain !== 'https://lookmate.kro.kr') {
        return done(null, false, { message: '허용되지 않은 도메인' });
      }

      const [existingUser] = await User.findOrCreate({
        where: { 
          [Op.or]: [
            { googleId: profile.id },
            { email: profile.emails?.[0]?.value }
          ]
        },
        defaults: {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          userId: `google_${profile.id}`,
          profileImg: {
            desktop: profile.photos?.[0]?.value?.replace('=s96-c', '=s170-c') || '/default-google.jpg',
            mobile: profile.photos?.[0]?.value?.replace('=s96-c', '=s110-c') || '/default-google.jpg'
          },
          provider: 'google',
          isVerified: true,
          hasCompletedPreferences: false
        }
      });

      done(null, existingUser);
    } catch (error) {
      console.error('인증 프로세스 실패:', {
        프로필_ID: profile.id,
        에러_메시지: error.message,
        스택: error.stack
      });
      done(error, false, { 
        message: '서버 내부 오류',
        code: 'AUTH_SERVER_ERROR' 
      });
    }
  });
};

export const configurePassport = () => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
  passport.use(initializeGoogleStrategy());
};

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