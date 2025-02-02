import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';
import { uploadImage, deleteImage } from '@/controllers/auth/imageController';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb' // Next.js 기본 파서 크기 제한 설정
    }
  }
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

// 클라이언트-서버 파라미터명 통일을 위한 상수 정의
const PARAM_USER_ID = 'userid'; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // 파일 크기 사전 검증
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '최대 5MB까지 업로드 가능합니다' },
        { status: 413 }
      );
    }

    const file = formData.get('profileImage') as File;
    const userId = formData.get(PARAM_USER_ID)?.toString().trim();

    if (!file || !userId) {
      return NextResponse.json(
        { error: '필수 파라미터 누락' },
        { status: 400 }
      );
    }

    const result = await uploadImage({
      userId,
      buffer: Buffer.from(await file.arrayBuffer()),
      originalFileName: file.name,
      contentType: file.type
    });

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