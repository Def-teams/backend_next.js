import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';

/**
 * Next.js의 요청 객체를 Node.js 호환 스트림으로 변환
 * @param req NextRequest 객체
 * @returns IncomingMessage와 유사한 스트림 객체
 */
export async function convertToNodeStream(req: NextRequest): Promise<IncomingMessage> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error('Request body is not readable');

  const stream = new Readable({
    objectMode: false,
    highWaterMark: 5 * 1024 * 1024, // 5MB 버퍼 설정
    
    read(size: number) {
      reader.read().then(({ done, value }) => {
        if (done) return this.push(null);
        
        if (value && value.byteLength > 5 * 1024 * 1024) {
          this.destroy(new Error('FILE_SIZE_EXCEEDED'));
          return;
        }

        this.push(Buffer.from(value));
      }).catch(err => this.destroy(err));
    }
  });

  stream.on('error', (err) => {
    console.error('Stream Error:', err);
    reader.cancel();
  });

  return Object.assign(stream, {
    headers: {},
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1
  }) as IncomingMessage;
} 