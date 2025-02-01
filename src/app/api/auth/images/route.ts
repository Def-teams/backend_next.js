import { NextRequest, NextResponse } from 'next/server';
import { imageUploader } from './config';
import { uploadImage, deleteImage } from '@/controllers/auth/imageController';

export async function POST(req: NextRequest) {
  const clonedReq = req.clone(); // 요청 복제
  try {
    // 헤더 로깅
    console.log('Received headers:', Object.fromEntries(clonedReq.headers));

    // FormData 파싱
    const formData = await clonedReq.formData();
    console.log('FormData:', Object.fromEntries(formData));

    // 파일 처리
    const file = formData.get('profileImage') as File;
    if (!file) {
      throw new Error('FILE_REQUIRED');
    }

    // 이미지 업로드 처리
    const result = await uploadImage(clonedReq);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Full error stack:', error.stack);
    return NextResponse.json(
      { error: error.message },
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