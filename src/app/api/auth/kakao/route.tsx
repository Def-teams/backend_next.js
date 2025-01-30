// import { NextRequest, NextResponse } from 'next/server';
// import EmailUser from '@/models/emailUser';

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { email, password } = body;

//     // 이미 존재하는 사용자 확인
//     const existingUser = await EmailUser.findOne({ where: { email } });
//     if (existingUser) {
//       return NextResponse.json(
//         { error: '이미 존재하는 이메일입니다.' },
//         { status: 409 }
//       );
//     }

//     // 새 사용자 생성
//     const user = await EmailUser.create({
//       email,
//       password,
//       userId: `email_${Date.now()}`,
//       profileImg: {
//         desktop: '/uploads/desktop/default.jpg',
//         mobile: '/uploads/mobile/default.jpg'
//       },
//       stylePreferences: [],
//       isVerified: false
//     });

//     return NextResponse.json({
//       message: '사용자가 성공적으로 생성되었습니다.',
//       user: {
//         id: user.id,
//         email: user.email,
//         userId: user.userId
//       }
//     }, { status: 201 });

//   } catch (error) {
//     console.error('Error:', error);
//     return NextResponse.json(
//       { error: '서버 오류가 발생했습니다.' },
//       { status: 500 }
//     );
//   }
// }