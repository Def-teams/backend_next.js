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
  
  // 디렉토리 생성
  await fs.mkdir(userDir, { recursive: true });

  const desktopPath = path.join(userDir, `desktop_${userId}.webp`);
  const mobilePath = path.join(userDir, `mobile_${userId}.webp`);

  // 이미지 변환 파이프라인
  const desktopPipeline = sharp(file)
    .resize(170, 170, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80, lossless: false, alphaQuality: 90 });

  const mobilePipeline = sharp(file)
    .resize(110, 110, { kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 80 });

  await Promise.all([
    desktopPipeline.toFile(desktopPath),
    mobilePipeline.toFile(mobilePath)
  ]);

  return {
    desktop: `/uploads/User_profile/${userId}/desktop_${userId}.webp`,
    mobile: `/uploads/User_profile/${userId}/mobile_${userId}.webp`
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

// 파일 메타데이터 검증 함수
const validateFile = (file: {
  buffer: Buffer;
  contentType: string;
  originalFileName: string;
}) => {
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.buffer.byteLength > MAX_SIZE) {
    throw new Error('FILE_SIZE_EXCEEDED');
  }

  const ext = path.extname(file.originalFileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`INVALID_EXTENSION: ${ext}`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.contentType)) {
    throw new Error(`INVALID_MIME_TYPE: ${file.contentType}`);
  }
};

export const uploadImage = async (params: UploadParams) => {
  validateFile(params); // 검증 함수 호출
  const imagePaths = await processImage(params.userId, params.buffer);
  
  const user = await EmailUser.findOne({ where: { userId: params.userId } });
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