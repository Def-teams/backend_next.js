import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import sequelize from '@/config/database';

export async function POST(req: NextRequest) {
  const transaction = await sequelize.transaction();
  try {
    const { primaryUserId, secondaryUserId, provider } = await req.json();
    
    // 계정 유효성 검증 강화
    const [primaryUser, secondaryUser] = await Promise.all([
      User.findByPk(primaryUserId, { transaction }),
      User.findByPk(secondaryUserId, { transaction })
    ]);

    if (!primaryUser || !secondaryUser || primaryUser.provider === secondaryUser.provider) {
      await transaction.rollback();
      return NextResponse.json({ error: 'Invalid account pairing' }, { status: 400 });
    }

    // 데이터 병합 로직
    const mergedData = {
      email: primaryUser.email || secondaryUser.email,
      snsId: primaryUser.snsId || secondaryUser.snsId,
      ...(secondaryUser.provider === 'email' && { 
        password: secondaryUser.password 
      }),
      provider: 'combined'
    };

    await primaryUser.update({
      email: mergedData.email,
      snsId: mergedData.snsId,
      password: mergedData.password,
      provider: 'email' as const
    }, { transaction });
    await secondaryUser.destroy({ transaction });
    
    await transaction.commit();
    return NextResponse.json({ 
      message: 'Account linked successfully',
      user: primaryUser 
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Linking error:', error);
    return NextResponse.json({ error: 'Account linking failed' }, { status: 500 });
  }
} 