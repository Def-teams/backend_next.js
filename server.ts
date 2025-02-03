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
  http: 80
};

// HTTPS 옵션 주석 처리 (인증서 없음)
// const httpsOptions = {
//   key: fs.readFileSync('./localhost.key'),
//   cert: fs.readFileSync('./localhost.crt'),
// };

app.prepare().then(() => {
  // HTTP 서버
  http((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  }).listen(ports.http, '0.0.0.0', () => { // 모든 IP에서 접근 가능
    console.log(`> Ready on http://lookmate.kro.kr`);
  });

  // HTTPS 서버
  // https(httpsOptions, (req: IncomingMessage, res: ServerResponse) => {
  //   const parsedUrl = parse(req.url || '', true);
  //   handle(req, res, parsedUrl);
  // }).listen(ports.https, '0.0.0.0', () => { // 모든 IP에서 접근 가능
  //   console.log(`> HTTPS: Ready on https://localhost:${ports.https}`);
  // });
});