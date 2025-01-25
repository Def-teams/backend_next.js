import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// 멀터 스토리지 설정
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
}).single('image');

export const uploadImage = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    upload(req as any, res as any, async (err) => {
      if (err) {
        console.error('파일 업로드 에러:', err);
        return res.status(400).json({ error: err.message });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: '파일이 없습니다.' });
      }

      const userId = (req as any).user.id; // JWT 미들웨어에서 추가된 사용자 정보
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}`;

      try {
        // 데스크톱용 이미지 (170x170)
        const desktopPath = path.join(process.cwd(), 'public/uploads/desktop', `${filename}.jpg`);
        await sharp(file.buffer)
          .resize(170, 170, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 90 })
          .toFile(desktopPath);

        // 모바일용 이미지 (110x110)
        const mobilePath = path.join(process.cwd(), 'public/uploads/mobile', `${filename}.jpg`);
        await sharp(file.buffer)
          .resize(110, 110, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 90 })
          .toFile(mobilePath);

        res.status(200).json({
          message: '이미지가 성공적으로 업로드되었습니다.',
          urls: {
            desktop: `/uploads/desktop/${filename}.jpg`,
            mobile: `/uploads/mobile/${filename}.jpg`
          }
        });
      } catch (error) {
        console.error('이미지 처리 에러:', error);
        res.status(500).json({ error: '이미지 처리 중 오류가 발생했습니다.' });
      }
    });
  } catch (error) {
    console.error('서버 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const deleteImage = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { filename } = req.query;
    const userId = (req as any).user.id;

    // 파일명에 userId가 포함되어 있는지 확인 (보안)
    if (!filename.toString().startsWith(userId.toString())) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const desktopPath = path.join(process.cwd(), 'public/uploads/desktop', filename as string);
    const mobilePath = path.join(process.cwd(), 'public/uploads/mobile', filename as string);

    if (fs.existsSync(desktopPath)) fs.unlinkSync(desktopPath);
    if (fs.existsSync(mobilePath)) fs.unlinkSync(mobilePath);

    res.status(200).json({ message: '이미지가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('이미지 삭제 에러:', error);
    res.status(500).json({ error: '이미지 삭제 중 오류가 발생했습니다.' });
  }
};