import type { NextConfig } from 'next'
import { Header } from 'next/dist/lib/load-custom-routes'

const config: NextConfig = {
  reactStrictMode: true,
  env: {
    CLIENT_URL: 'https://lookmate.kro.kr',
    NEXT_PUBLIC_BASE_URL: 'https://lookmate.kro.kr',
    NODE_ENV: 'production'
  },
  compiler: {
    styledComponents: false,
  },
  async rewrites() {
    return [];
  },
  async headers(): Promise<Header[]> {
    const cspHeader = `
      default-src 'self' ${process.env.NEXT_PUBLIC_BASE_URL};
      script-src 'self' 'unsafe-inline' https://accounts.google.com;
      connect-src 'self' ${process.env.NEXT_PUBLIC_BASE_URL} https://*.googleapis.com;
      frame-src 'self' https://accounts.google.com;
    `;

    
    const googleAuthHeader: Header = {
      source: '/auth/google',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://accounts.google.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://*.googleusercontent.com",
            "connect-src 'self' https://*.googleapis.com",
            "frame-src 'self' https://accounts.google.com"
          ].join('; ')
        }
      ]
    };

    const existingHeaders: Header[] = [];

    const defaultHeaders: Header[] = [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ' ').trim()
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()'
          }
        ]
      }
    ];

    return [
      ...defaultHeaders,
      googleAuthHeader,
      ...existingHeaders
    ];
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
  },
  devIndicators: {
    // autoPrerender: false, // Next.js 13+에서 deprecated
  },
  experimental: {
    // allowMiddlewareResponseBody: true, // Next.js 13+에서 더 이상 필요 없음
  },
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://lookmate.kro.kr",
  generateRobotsTxt: true, // robots.txt 자동 생성
};

export default config