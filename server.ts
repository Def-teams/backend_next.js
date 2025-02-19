import { createServer as https } from 'https';
import { createServer as http } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import session from 'express-session';
import MemoryStore from 'memorystore';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const ports = {
  http: 80,   // 표준 HTTP 포트
  https: 443  // 표준 HTTPS 포트
};

// HTTPS 옵션 설정
const httpsOptions = {
  key: fs.readFileSync('../privkey1.pem'), // 개인 키 경로
  cert: fs.readFileSync('../fullchain1.pem'), // 합쳐진 인증서 경로
};

// 세션 미들웨어 적용
const sessionMiddleware = session({
  store: new (MemoryStore(session))({
    checkPeriod: 86400000, // prune expired entries every 24h - default
  }),
  secret: process.env.SESSION_SECRET || 'your-default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // 개발 환경에서도 HTTPS 강제
    maxAge: 86400000, // 쿠키 유효 기간: 1일
    domain: '.lookmate.kro.kr' // 모든 서브도메인 포함
  },
});

app.prepare().then(() => {
  const server = http((req, res) => {
    sessionMiddleware(req as any, res as any, () => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });
  });

  server.listen(ports.http, '0.0.0.0', () => {
    console.log(`> Ready on http://localhost:${ports.http}`);
  });

  // HTTPS 서버
  https(httpsOptions, (req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  }).listen(ports.https, '0.0.0.0', () => {
    console.log(`> HTTPS: Ready on https://lookmate.kro.kr`);
  });
});