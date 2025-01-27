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

const validSizes = {
  top: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottom: ['28', '29', '30', '31', '32', '33', '34', '35', '36'],
  shoe: ['240', '245', '250', '255', '260', '265', '270', '275', '280', '285', '290']
};

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json(); // formData 대신 json으로 변경
    const { userId, stylePreferences, size, profileImage } = body;

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

    // 스타일 선호도 검증 (3개 제한)
    if (stylePreferences) {
      if (!Array.isArray(stylePreferences) || stylePreferences.length > 3) {
        return NextResponse.json(
          { error: '스타일은 최대 3개까지만 선택 가능합니다.' },
          { status: 400 }
        );
      }

      if (!stylePreferences.every(style => validStyles.includes(style))) {
        return NextResponse.json(
          { error: '유효하지 않은 스타일이 포함되어 있습니다.' },
          { status: 400 }
        );
      }
      user.stylePreferences = stylePreferences;
    }

    // 사이즈 정보 검증
    if (size) {
      if (!size.height || !size.weight || !size.top || !size.bottom || !size.shoe) {
        return NextResponse.json(
          { error: '모든 사이즈 정보를 입력해주세요.' },
          { status: 400 }
        );
      }
      user.size = size;
    }

    // 프로필 이미지는 별도의 엔드포인트로 처리하는 것을 추천
    user.hasCompletedPreferences = true; // 세부사항 완료 표시
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