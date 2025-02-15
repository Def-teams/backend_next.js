import type { NextApiRequest, NextApiResponse } from 'next';
import type { Request } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';


// Multer 구성
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'image/avif'
    ];
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
export const processImage = async (userId: string, file: Buffer) => {
  const uploadBase = path.join(process.cwd(), 'public', 'uploads', 'User_profile');
  const userDir = path.join(uploadBase, userId);

  // 디렉토리 생성
  try {
    await fs.mkdir(uploadBase, { recursive: true, mode: 0o755 });
    await fs.mkdir(userDir, { recursive: true, mode: 0o755 });
  } catch (error) {
    console.error('디렉토리 생성 실패:', error);
    throw new Error('DIRECTORY_CREATION_FAILED');
  }

  const cleanUserId = userId.replace(/[<>:"/\\|?*]/g, '');
  const desktopPath = path.join(userDir, `desktop_${cleanUserId}.webp`);
  const mobilePath = path.join(userDir, `mobile_${cleanUserId}.webp`);

  // 이미지 처리
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
  } catch (error) {
    console.error('이미지 처리 실패:', error);
    throw new Error('IMAGE_PROCESSING_FAILED');
  }

  return {
    desktop: `/uploads/User_profile/${cleanUserId}/desktop_${cleanUserId}.webp`,
    mobile: `/uploads/User_profile/${cleanUserId}/mobile_${cleanUserId}.webp`
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

const validateFile = (params: UploadParams) => {
  if (!params.buffer || !params.originalFileName || !params.contentType) {
    console.error('유효하지 않은 파일 파라미터:', params);
    throw new Error('INVALID_FILE_PARAMETERS');
  }
};

export const uploadImage = async (params: UploadParams) => {
  validateFile(params); // 검증 함수 호출
  const imagePaths = await processImage(params.userId, params.buffer);

  const user = await User.findOne({ where: { userId: params.userId } });
  if (user) {
    user.profileImg = imagePaths;
    await user.save();
  } else {
    console.error('사용자를 찾을 수 없습니다.');
    throw new Error('USER_NOT_FOUND');
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

interface JwtPayload {
  userId: string;
}

export const deleteImage = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('AUTH_TOKEN_REQUIRED');

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  const userId = decoded.userId;

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');

  if (!filename || !filename.startsWith(userId)) {
    console.error('잘못된 파일 이름:', filename, userId);
    throw new Error('INVALID_FILE_NAME');
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

  try {
    await fs.unlink(filePath);
    return new Response(JSON.stringify({ message: '이미지 삭제 성공' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    console.error('이미지 삭제 실패:', error);
    return new Response(JSON.stringify({ 
      error: error.message || '이미지 삭제 실패' 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
};