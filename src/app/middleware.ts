import { NextRequest } from 'next/server';
import { indexCheckMiddleware } from '@/middlewares/indexMonitor';

export function middleware(request: NextRequest) {
  return indexCheckMiddleware(request);
}

export const config = {
  matcher: [
    '/api/((?!auth/images|public).*)' // 이미지 업로드 등 특정 경로 제외
  ]
}; 