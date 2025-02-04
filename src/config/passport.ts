// import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as KakaoStrategy } from 'passport-kakao';
// import { Strategy as NaverStrategy } from 'passport-naver-v2';
// import GoogleUser from '../models/googleUser';
// import KakaoUser from '../models/kakaoUser';
// import NaverUser from '../models/naverUser';

// passport.serializeUser((user: any, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id: number, done) => {
//   try {
//     const user = await GoogleUser.findByPk(id);
//     done(null, user);
//   } catch (error) {
//     done(error);
//   }
// });

// // Google Strategy
// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID!,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//   callbackURL: process.env.GOOGLE_CALLBACK_URI,
//   scope: ['profile', 'email']
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     let user = await GoogleUser.findOne({ where: { googleId: profile.id } });
    
//     if (!user) {
//       user = await GoogleUser.create({
//         email: profile.emails![0].value,
//         userId: `google_${profile.id}`,
//         googleId: profile.id,
//         profileImg: { desktop: '', mobile: '' },
//         accessToken: accessToken,
//         refreshToken: refreshToken,
//         isVerified: true,
//         stylePreferences: []
//       });
//     }
//     return done(null, user);
//   } catch (error) {
//     return done(error as Error);
//   }
// }));

// export default passport;