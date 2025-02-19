import { NextRequest, NextResponse } from 'next/server';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import User from '@/models/user';
import { Op } from 'sequelize';
import { verifyAuthEnv } from '@/utils/envCheck';
import { configurePassport } from '@/config/passport';

// 파일 상단에 추가
verifyAuthEnv();

// Passport 초기화
configurePassport();

console.log('환경 변수 검증:', {
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  NODE_ENV: process.env.NODE_ENV
});

export async function GET(req: NextRequest) {
  try {
    console.log('요청 URL:', req.url);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) throw new Error('NEXT_PUBLIC_BASE_URL 환경 변수 누락');

    // URL 객체를 직접 조작하여 도메인 강제 적용
    const fullUrl = new URL(req.url);
    fullUrl.hostname = new URL(baseUrl).hostname;
    fullUrl.protocol = 'https:';
    fullUrl.port = ''; // 포트 제거
    console.log('도메인 강제 적용 URL:', fullUrl.href);
    
    const code = fullUrl.searchParams.get('code');
    const state = fullUrl.searchParams.get('state');
    
    console.log('파라미터 검증:', { 
      codeExists: !!code, 
      stateExists: !!state,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      clientUrl: process.env.CLIENT_URL 
    });

    if (!code || !state) {
      const errorParams = new URLSearchParams({
        error: 'invalid_request',
        description: '필수 인증 파라미터가 누락되었습니다'
      });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/error?${errorParams}`);
    }

    // 쿠키 스토어 초기화
    const cookieStore = await cookies();
    console.log('쿠키 스토어 타입:', typeof cookieStore);
    console.log('쿠키 존재 여부:', {
      hasOauthState: cookieStore.has('oauth_state'),
      allCookies: (await cookieStore.getAll()).map(c => c.name)
    });

    // 상태 토큰 검증 (단일 검증으로 통합)
    const oauthStateCookie = cookieStore.get('oauth_state');
    console.log('쿠키 객체 상세:', {
      exists: !!oauthStateCookie,
      type: typeof oauthStateCookie,
      keys: oauthStateCookie ? Object.keys(oauthStateCookie) : []
    });
    const storedState = oauthStateCookie?.value;
    if (!storedState || state !== storedState) {
      console.error('State 불일치:', {
        수신값: state,
        저장값: storedState,
        쿠키: (await cookieStore.getAll()).map(c => c.name),
        가능한_원인: '쿠키 SameSite 정책 확인 필요'
      });
      const errorParams = new URLSearchParams({
        error: 'invalid_state',
        description: '유효하지 않은 상태 토큰'
      });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/error?${errorParams}`);
    }

    // 추가 검증 로직 단순화
    const isValidCode = /^[\w-]+$/.test(code); // 정규식 간소화
    if (!isValidCode) {
      return NextResponse.redirect(`${process.env.CLIENT_URL}/auth/error?code=invalid_code`);
    }

    // 추가 검증 로직
    const storedState2 = (await cookieStore.get('oauth_state'))?.value;
    if (!storedState2 || state !== storedState2) {
      console.error('State 불일치:', {
        수신값: state,
        저장값: storedState2,
        쿠키: (await cookieStore.getAll()).map(c => c.name),
        가능한_원인: '쿠키 SameSite 정책 확인 필요'
      });
      return NextResponse.redirect(`${process.env.CLIENT_URL}/auth/error?code=state_mismatch`);
    }

    // 추가 디버깅 방법
    console.log('인증 파라미터:', {
      code: code?.slice(0, 5) + '...', // 민감정보 마스킹
      state: state?.slice(0, 5) + '...',
      userAgent: req.headers.get('user-agent')
    });

    // Passport 인증 실행
    const user: any = await new Promise((resolve, reject) => {
      passport.authenticate(
        'google',
        {
          session: false,
          failureRedirect: `${process.env.CLIENT_URL}/login`,
        },
        (err: any, user: any) => {
          if (err) {
            return reject(err);
          }
          if (!user) {
            return reject(new Error('인증 실패'));
          }
          resolve(user);
        }
      )(req, new NextResponse());
    });

    // JWT 생성 및 리다이렉트
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다');
    }

    console.log('토큰 생성 전 검증:', {
      userIdExists: !!user?.userId,
      secretExists: !!process.env.JWT_SECRET,
      userType: typeof user
    });

    const token = jwt.sign(
      { 
        userId: user.userId,
        provider: 'google' 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    console.log('생성된 토큰 검증:', {
      tokenHeader: token.split('.')[0],
      tokenPayload: JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()),
      tokenLength: token.length
    });

    // 최종 쿠키 진단
    console.log('최종 쿠키 진단:', {
      oauthState: {
        value: cookieStore.get('oauth_state')?.value,
        exists: cookieStore.has('oauth_state')
      },
      allCookies: cookieStore.getAll().map(c => ({
        name: c.name,
        value: c.value.length > 5 ? '*****' : 'TOO_SHORT',
        size: c.value.length
      })),
      cookieMetadata: {
        type: typeof cookieStore,
        isAsync: cookieStore instanceof Promise
      }
    });

    const redirectUrl = new URL(`${process.env.CLIENT_URL}/auth/callback`);
    redirectUrl.searchParams.set('provider', 'google');
    redirectUrl.hash = `#token=${encodeURIComponent(token)}`;

    console.log('최종 리다이렉트 URL 구조:', {
      host: redirectUrl.host,
      pathname: redirectUrl.pathname,
      searchParams: Array.from(redirectUrl.searchParams.entries()),
      hash: redirectUrl.hash?.slice(0, 20) + '...'
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth 콜백 처리 오류:', error);
    const errorParams = new URLSearchParams({
      error: 'server_error',
      description: '서버 오류가 발생했습니다'
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/error?${errorParams}`);
  }
}

export async function POST() {
  return NextResponse.json({ error: '이 엔드포인트는 GET 요청만 허용됩니다' }, { status: 405, headers: { Allow: 'GET' } });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}