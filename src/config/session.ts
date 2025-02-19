import session from 'express-session';
import createMemoryStore from 'memorystore';
const MemoryStore = createMemoryStore(session);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000,
    max: 100 // 최대 세션 수 제한 추가
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000 // 1시간
  }
});

export default sessionMiddleware; 