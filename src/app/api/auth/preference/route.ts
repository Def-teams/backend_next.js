import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

const validStyles = [
  '미니멀록', '스트릿패션', '보히미안룩', '럭셔리룩',
  '아방가르드룩', '러블리룩', '빈티지룩', '스포티룩',
  '모던록', '그런지룩', '프레미룩'
];

const validSizes = ['XS','S','M','L','XL','XXL'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData(); 
    const userId = body.get('UserId') as string;
    const stylePreferences = JSON.parse(body.get('stylePreferences') as string);
    const size = body.get('size') as string;
    const profileImage = body.get('profileImage') as File;

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

    // profile image upload
    if (profileImage) {
      const formData = new FormData();
      formData.append('profileImage', profileImage);
      formData.append('userId', userId);

      const uploadResponse = await fetch('http://localhost:3000/api/auth/images', {
        method: 'POST',
        body: formData 
      });

      if (!uploadResponse.ok) {
        return NextResponse.json(
          { error: '프로필 이미지 업로드에 실패했습니다.' },
          { status: 500 }
        );
      }
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
    console.error('Preference update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 