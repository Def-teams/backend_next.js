import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { indexCheckMiddleware } from '@/middlewares/indexMonitor';
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb'
    }
  }
};

// 타입 정의 추가
interface FormDataFields {
  size?: [string];
  userId?: [string];
  stylePreferences?: [string];
  profileImage?: [File];
}

export async function POST(req: NextRequest) {
  const indexCheckResult = await indexCheckMiddleware(req);
  if (indexCheckResult) return indexCheckResult;

  const contentType = req.headers.get('content-type') || '';
  console.log('Content-Type:', contentType); // 디버깅: Content-Type 확인

  try {
    let data: any = {};

    // FormData 처리
    if (contentType.startsWith('multipart/form-data')) {
      const form = new IncomingForm({
        maxFileSize: 5 * 1024 * 1024, // 5MB 제한
        // 파일 형식 검사 추가 (필요한 경우)
        fileFilter: (req, file, cb) => {
          if (file.mimeType.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('이미지 파일만 허용됩니다.'));
          }
        }
      });

      // NextRequest -> Node.js 스트림 변환
      const chunks = [];
      const reader = req.body?.getReader();
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);

      // 가상의 Node.js 요청 객체 생성
      const nodeReq = new Readable();
      nodeReq.push(buffer);
      nodeReq.push(null);
      Object.assign(nodeReq, {
        headers: Object.fromEntries(req.headers),
        httpVersion: '1.1'
      });

      const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
        form.parse(nodeReq as any, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      console.log('Parsed Fields:', fields); // 디버깅: 파싱된 필드 확인
      console.log('Parsed Files:', files); // 디버깅: 파싱된 파일 확인

      data = {
        size: fields.size?.[0],
        userId: fields.userId?.[0],
        stylePreferences: fields.stylePreferences?.[0] ?
          JSON.parse(fields.stylePreferences[0]) : null,
        profileImage: files.profileImage?.[0]
      };

      console.log('Data:', data); // 디버깅: 최종 데이터 확인

    // JSON 처리
    } else if (contentType.startsWith('application/json')) {
      data = await req.json();
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 Content-Type' },
        { status: 415 }
      );
    }

    // 공통 유효성 검사
    if (!data.userId) {
      return NextResponse.json(
        { error: 'userId 필수' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ where: { userId: data.userId } });

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // 사이즈 정보 업데이트
    if (data.size) {
      if (!validSizes.includes(data.size)) {
        return NextResponse.json(
          { error: '유효하지 않은 사이즈입니다' },
          { status: 400 }
        );
      }
      user.size = data.size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    }

    // 프로필 이미지 업데이트
    if (data.profileImage) {
      const userProfileDir = path.join(process.cwd(), 'public', 'uploads', 'User_profile', data.userId);
      await fs.mkdir(userProfileDir, { recursive: true });

      const desktopPath = path.join(userProfileDir, `desktop_${data.userId}.webp`);
      const mobilePath = path.join(userProfileDir, `mobile_${data.userId}.webp`);

      await sharp(data.profileImage.filepath)
        .resize(170, 170, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(desktopPath);

      await sharp(data.profileImage.filepath)
        .resize(110, 110)
        .webp({ quality: 80 })
        .toFile(mobilePath);

      user.profileImg = {
        desktop: `/uploads/User_profile/${data.userId}/desktop_${data.userId}.webp`,
        mobile: `/uploads/User_profile/${data.userId}/mobile_${data.userId}.webp`
      };
    } else {
      // 이미지가 선택되지 않은 경우 기본 이미지 설정
      user.profileImg = {
        desktop: '/uploads/User_profile/default/desktop_default.webp',
        mobile: '/uploads/User_profile/default/mobile_default.webp'
      };
    }

    user.hasCompletedPreferences = true;
    await user.save();

    return NextResponse.json({
      message: '프로필이 업데이트되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        userId: user.userId,
        profileImg: user.profileImg,
        stylePreferences: user.stylePreferences,
        size: user.size
      }
    });

  } catch (error: any) {
    console.error('요청 처리 오류:', error);
    return NextResponse.json(
      { error: '서버 처리 오류' },
      { status: 500 }
    );
  }
}
