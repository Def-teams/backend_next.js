import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';
import { uploadImage, deleteImage } from '@/controllers/auth/imageController';
import fs from 'fs/promises';

export const config = {
  api: { bodyParser: false }
};

// NextRequest를 Node.js 스트림으로 변환
const convertToNodeStream = async (req: NextRequest) => {
  const chunks = [];
  const reader = req.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // IncomingMessage 호환 객체 생성
  const incomingMsg = new Readable() as any;
  incomingMsg.push(Buffer.concat(chunks));
  incomingMsg.push(null);
  
  // 필수 속성 추가
  incomingMsg.headers = {};
  incomingMsg.httpVersion = '1.1';
  incomingMsg.httpVersionMajor = 1;
  incomingMsg.httpVersionMinor = 1;
  
  return incomingMsg;
};

export async function POST(req: NextRequest) {
  try {
    const form = new IncomingForm({
      uploadDir: process.cwd() + '/public/temp',
      keepExtensions: true
    });
    
    // 스트림 변환
    const nodeStream = await convertToNodeStream(req);
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(nodeStream, (err, fields, files) => {
        if (err) return reject(err);
        
        // 필드 값 검증 추가
        if (!fields.userId?.[0]) {
          return reject(new Error('USER_ID_REQUIRED'));
        }
        
        resolve([fields, files]);
      });
    });

    const file = files.profileImage?.[0];
    if (!file) throw new Error('FILE_REQUIRED');

    const buffer = await fs.readFile(file.filepath);
    const userId = fields.userId?.[0];
    if (!userId) throw new Error('USER_ID_REQUIRED');
    
    const result = await uploadImage({
      userId,
      buffer,
      originalFileName: file.originalFilename || '',
      contentType: file.mimetype || ''
    });

    await fs.unlink(file.filepath);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('File Upload Error:', error);
    return NextResponse.json(
      { error: error.message || '파일 업로드 실패' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { error: '파일명이 필요합니다' },
        { status: 400 }
      );
    }

    const result = await deleteImage(req);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '서버 오류 발생' },
      { status: error.status || 500 }
    );
  }
} 