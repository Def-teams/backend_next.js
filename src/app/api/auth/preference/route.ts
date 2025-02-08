import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { indexCheckMiddleware } from '@/middlewares/indexMonitor';
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';

const validStyles = [
  '클래식룩', '미니멀룩', '스트릿패션', '보헤미안룩',
  '럭셔리룩', '아방가르드룩', '러블리룩', '빈티지룩',
  '스포티룩', '모던룩', '스모키룩', '모던록룩',
  '그런지룩', '레트로룩'
];

const validSizes = ['XS','S','M','L','XL','XXL'];

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb'
    }
  }
};

export async function POST(req: NextRequest) {
  const indexCheckResult = await indexCheckMiddleware(req);
  if (indexCheckResult) {
    return indexCheckResult;
  }

  try {
    const formData = await req.formData();
    const rawUserId = formData.get('userid') || formData.get('UserId') || formData.get('USERID');
    const userId = String(rawUserId).trim();

    if (!userId) {
      const receivedKeys = Array.from(formData.keys()).join(', ');
      console.error(`Missing userId. Received keys: ${receivedKeys}`);
      return NextResponse.json(
        { error: `userid 파라미터가 필요합니다 (전달된 키: ${receivedKeys})` },
        { status: 400 }
      );
    }

    const stylePreferencesRaw = formData.get('stylePreferences');
    
    if (!stylePreferencesRaw) {
      return NextResponse.json(
        { error: '스타일 선호도는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    let stylePreferences;
    try {
      stylePreferences = JSON.parse(stylePreferencesRaw as string);
      
      // 배열 타입 검증
      if (!Array.isArray(stylePreferences)) {
        return NextResponse.json(
          { error: '스타일 선호도는 배열 형태여야 합니다.' },
          { status: 400 }
        );
      }

      // 스타일 개수 검증
      if (stylePreferences.length === 0) {
        return NextResponse.json(
          { error: '최소 1개 이상의 스타일을 선택해주세요.' },
          { status: 400 }
        );
      }

      if (stylePreferences.length > 3) {
        return NextResponse.json(
          { error: '스타일은 최대 3개까지 선택 가능합니다.' },
          { status: 400 }
        );
      }

      // 유효한 스타일 값 검증
      const invalidStyles = stylePreferences.filter(style => !validStyles.includes(style));
      if (invalidStyles.length > 0) {
        return NextResponse.json(
          { error: '유효하지 않은 스타일이 포함되어 있습니다.', invalidStyles },
          { status: 400 }
        );
      }

    } catch (e) {
      return NextResponse.json(
        { error: '잘못된 스타일 선호도 형식입니다.' },
        { status: 400 }
      );
    }

    const size = formData.get('size') as string;
    const profileImage = formData.get('profileImage') as File;

    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 스타일 선호도는 최대 3개까지
    if (stylePreferences) {
      user.stylePreferences = stylePreferences;
    }

    // 사이즈 정보
    if (size) {
      if (!validSizes.includes(size)) {
        return NextResponse.json(
          { error: '유효하지 않은 사이즈입니다' },
          { status: 400 }
        );
      }
      user.size = size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
    }

    // 프로필 이미지 업데이트
    if (profileImage) {
      const buffer = Buffer.from(await profileImage.arrayBuffer());
      
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
        fs.writeFile(path.join(userProfileDir, desktopFileName), buffer),
        fs.writeFile(path.join(userProfileDir, mobileFileName), buffer)
      ]);

      // 프로필 이미지 경로 업데이트
      user.profileImg = {
        desktop: `/uploads/User_profile/${userId}/${desktopFileName}`,
        mobile: `/uploads/User_profile/${userId}/${mobileFileName}`
      };
    }

    user.hasCompletedPreferences = true;
    await user.save();

    console.log('수신 데이터 타입:', req.headers.get('content-type'));
    console.log('요청 본문 크기:', req.headers.get('content-length'));

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
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 