import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  async rewrites() {
    return process.env.NODE_ENV === 'production' 
      ? []
      : [{
          source: '/:path*',
          destination: `${process.env.NEXT_PUBLIC_BASE_URL}/:path*`
        }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' lookmate.kro.kr;"
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ]
  },
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://lookmate.kro.kr',
  },
  serverRuntimeConfig: {
    secretKey: process.env.JWT_SECRET,
  },
  // 프로덕션 환경에서는 외부 웹서버(Nginx/Apache)에서 SSL 처리
  httpAgentOptions: {
    // @ts-ignore - Node.js HTTP Agent 옵션 확장
    rejectUnauthorized: process.env.NODE_ENV === 'production' as any,
  }
}

export default config