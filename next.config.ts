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
          destination: 'https://lookmate.kro.kr/:path*'
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
  images: {
    domains: [
      'lookmate.kro.kr',
      'localhost'
    ],
    loader: 'default',
    path: '/_next/image',
    deviceSizes: [110, 170, 340, 680],
    imageSizes: [32, 48, 64, 96]
  },
  output: 'standalone',
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300
    }
    return config
  }
}

export default config