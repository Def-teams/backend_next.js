import { createServer as https } from 'https';
import { createServer as http } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const ports = {
  http: 8080,
  https: 443 // HTTPS 포트 추가
};

// HTTPS 옵션 설정
const httpsOptions = {
  key: fs.readFileSync('../privkey1.pem'), // 개인 키 경로
  cert: fs.readFileSync('../fullchain1.pem'), // 합쳐진 인증서 경로
};



app.prepare().then(() => {
  // HTTP 서버
  http((req, res) => {
    handle(req, res);
  }).listen(ports.http, '0.0.0.0', () => {
    console.log(`> Ready on http://lookmate.kro.kr`);
  });

  // HTTPS 서버
  https(httpsOptions, (req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  }).listen(ports.https, '0.0.0.0', () => {
    console.log(`> HTTPS: Ready on https://lookmate.kro.kr`);
  });
});