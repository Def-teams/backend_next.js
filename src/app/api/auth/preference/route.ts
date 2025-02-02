import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { indexCheckMiddleware } from '@/middlewares/indexMonitor';
import { IncomingForm } from 'formidable';
import { convertToNodeStream } from '@/utils/convertToNodeStream';
import { Readable } from 'stream';

const validStyles = [
  '미니멀록', '스트릿패션', '보히미안룩', '럭셔리룩',
  '아방가르드룩', '러블리룩', '빈티지룩', '스포티룩',
  '모던록', '그런지룩', '프레미룩'
];

const validSizes = ['XS','S','M','L','XL','XXL'];

export const config = {
  api: { bodyParser: false }
};

export async function POST(req: NextRequest) {
  const indexCheckResult = await indexCheckMiddleware(req);
  if (indexCheckResult) {
    return indexCheckResult;
  }

  const form = new IncomingForm();
  
  try {
    const nodeStream = await convertToNodeStream(req);
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(nodeStream, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    const userId = fields.UserId?.[0];
    const stylePreferences = JSON.parse(fields.stylePreferences?.[0] || '[]');
    const size = fields.size?.[0];
    const profileImage = files.profileImage?.[0];

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const user = await EmailUser.findOne({ where: { userId } });
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 스타일 선호도는 최대 3개까지
    if (stylePreferences) {
      if (stylePreferences.length > 3) {
        return NextResponse.json(
          { error: '스타일은 최대 3개까지 선택 가능합니다' },
          { status: 400 }
        );
      }
      user.stylePreferences = stylePreferences;
    }

    // size impormation
    if (size) {
      if (!validSizes.includes(size)) {
        return NextResponse.json(
          { error: '유효하지 않은 사이즈입니다' },
          { status: 400 }
        );
      }
      user.size = size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    }

    // 프로필 이미지 업로드
    if (profileImage) {
      const buffer = await profileImage.arrayBuffer();
      
      // 5MB 초과 검증 추가
      if (buffer.byteLength > 5 * 1024 * 1024) {
        throw new Error('FILE_SIZE_EXCEEDED');
      }

      const userProfileDir = path.join(process.cwd(), 'public/uploads/User_profile', userId);
      const desktopFileName = `desktop_${userId}.webp`;
      const mobileFileName = `mobile_${userId}.webp`;

      // 디렉토리 생성
      await fs.mkdir(userProfileDir, { recursive: true });

      // 파일 저장
      await Promise.all([
        fs.writeFile(path.join(userProfileDir, desktopFileName), Buffer.from(buffer)),
        fs.writeFile(path.join(userProfileDir, mobileFileName), Buffer.from(buffer))
      ]);

      // 프로필 이미지 경로 업데이트
      user.profileImg = {
        desktop: `/uploads/User_profile/${userId}/${desktopFileName}`,
        mobile: `/uploads/User_profile/${userId}/${mobileFileName}`
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

  } catch (error) {
    console.error('FormData 처리 실패:', error);
    return NextResponse.json(
      { error: '데이터 처리 실패: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 