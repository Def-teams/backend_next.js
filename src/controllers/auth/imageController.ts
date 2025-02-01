import type { NextApiRequest, NextApiResponse } from 'next';
import type { Request } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';
import EmailUser from '@/models/emailUser';
import jwt from 'jsonwebtoken';

// Multer 구성
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    allowedTypes.includes(file.mimetype) 
      ? cb(null, true) 
      : cb(new Error('허용되지 않는 파일 형식입니다'));
  }
});

// 이미지 처리 함수
const processImage = async (userId: string, file: Buffer) => {
  const userDir = path.join(process.cwd(), 'public/uploads', userId);
  await fs.mkdir(userDir, { recursive: true });

  const desktopPath = path.join(userDir, `desktop_${userId}.webp`);
  const mobilePath = path.join(userDir, `mobile_${userId}.webp`);

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

export const uploadImage = async (req: NextApiRequest, res: NextApiResponse) => {
  const expressReq = convertRequest(req);
  return new Promise((resolve, reject) => {
    upload.single('profileImage')(expressReq, res as any, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return reject(err);
      }
      try {
        console.log('Uploaded File:', expressReq.file);
        if (!expressReq.file) {
          throw new Error('파일이 업로드되지 않았습니다');
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        const userId = (decoded as any).userId; 

        const imagePaths = await processImage(userId, expressReq.file.buffer);

        const user = await EmailUser.findOne({ where: { userId } });
        if (user) {
          user.profileImg = imagePaths;
          await user.save();
        }

        const result = {
          message: '이미지가 성공적으로 업로드되었습니다.',
          profileImg: imagePaths
        };
        resolve(result);
      } catch (error) {
        console.error('Image processing error:', error);
        reject(error);
      }
    });
  });
};

// 파일 삭제 로직 개선 (Promise 기반)
const deleteFile = async (path: string) => {
  try {
    await fs.access(path);
    await fs.unlink(path);
  } catch (error) {
    console.log('파일이 존재하지 않습니다:', path);
  }
};

export const deleteImage = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decoded as any).userId;

    const { filename } = req.query;
    if (!filename || !filename.toString().startsWith(userId.toString())) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const desktopPath = path.join(process.cwd(), 'public/uploads/desktop', filename as string);
    const mobilePath = path.join(process.cwd(), 'public/uploads/mobile', filename as string);

    await deleteFile(desktopPath);
    await deleteFile(mobilePath);

    res.status(200).json({ message: '이미지가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('이미지 삭제 에러:', error);
    res.status(500).json({ error: '이미지 삭제 중 오류가 발생했습니다.' });
  }
};