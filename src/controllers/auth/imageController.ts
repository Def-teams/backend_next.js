import type { NextApiRequest, NextApiResponse } from 'next';
import type { Request } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import EmailUser from '@/models/emailUser';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Multer 구성
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(
        `허용되지 않는 파일 형식입니다 (${file.mimetype}). ` +
        `허용 형식: ${allowedTypes.join(', ')}. ` +
        `최대 파일 크기: 5MB`
      ));
    }
    cb(null, true);
  }
});

// 이미지 처리 함수
const processImage = async (userId: string, file: Buffer) => {
  const userDir = path.join(process.cwd(), 'public/uploads/User_profile', userId);
  try {
    await fs.mkdir(userDir, { recursive: true });
    console.log(`디렉토리 생성 성공: ${userDir}`);
  } catch (dirError) {
    console.error(`디렉토리 생성 실패: ${dirError}`);
    throw new Error('파일 저장소 생성에 실패했습니다');
  }

  const desktopPath = path.join(userDir, `desktop_${userId}.webp`);
  const mobilePath = path.join(userDir, `mobile_${userId}.webp`);

  try {
    await Promise.all([
      sharp(file)
        .resize(170, 170)
        .webp({ quality: 80 })
        .toFile(desktopPath),
      sharp(file)
        .resize(110, 110)
        .webp({ quality: 80 })
        .toFile(mobilePath)
    ]);
    console.log('이미지 처리 완료:', { desktopPath, mobilePath });
  } catch (processingError) {
    console.error('이미지 처리 실패:', processingError);
    await Promise.allSettled([deleteFile(desktopPath), deleteFile(mobilePath)]);
    throw new Error('이미지 변환에 실패했습니다');
  }

  return {
    desktop: `/uploads/${userId}/desktop_${userId}.webp`,
    mobile: `/uploads/${userId}/mobile_${userId}.webp`
  };
};

// 요청 객체를 Express 스타일로 변환
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const convertRequest = (req: NextApiRequest): MulterRequest => {
  return req as unknown as MulterRequest;
};

interface UploadParams {
  userId: string;
  buffer: Buffer;
  originalFileName: string;
  contentType: string;
}

export const uploadImage = async ({ 
  userId, 
  buffer,
  originalFileName,
  contentType 
}: UploadParams) => {
  // 버퍼 크기 검증 추가
  if (buffer.byteLength > 5 * 1024 * 1024) {
    throw new Error('FILE_SIZE_EXCEEDED');
  }
  
  // 파일 유효성 검사
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`INVALID_FILE_TYPE: ${contentType}`);
  }

  // 기존 로직 유지 (processImage 호출 등)
  const imagePaths = await processImage(userId, buffer);
  
  // DB 업데이트 로직
  const user = await EmailUser.findOne({ where: { userId } });
  if (user) {
    user.profileImg = imagePaths;
    await user.save();
  }

  return {
    message: '이미지 업로드 성공',
    paths: imagePaths
  };
};

// 파일 삭제 로직 개선 (Promise 기반)
const deleteFile = async (path: string) => {
  try {
    await fs.access(path);
    await fs.unlink(path);
    console.log(`파일 삭제 성공: ${path}`);
  } catch (error) {
    console.log('파일 삭제 시도 실패:', { path, error });
  }
};

export const deleteImage = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('AUTH_TOKEN_REQUIRED');

  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  const userId = (decoded as any).userId;

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');

  if (!filename || !filename.startsWith(userId)) {
    throw new Error('INVALID_FILE_OWNERSHIP');
  }

  const desktopPath = path.join(process.cwd(), 'public/uploads/desktop', filename as string);
  const mobilePath = path.join(process.cwd(), 'public/uploads/mobile', filename as string);

  await deleteFile(desktopPath);
  await deleteFile(mobilePath);

  return { message: '이미지 삭제 성공' };
};