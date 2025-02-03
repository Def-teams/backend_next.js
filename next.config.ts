import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
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
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },
  serverRuntimeConfig: {
    secretKey: process.env.JWT_SECRET,
  },
}

export default config