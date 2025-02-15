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
    const cspHeader = `
      default-src 'self' lookmate.kro.kr;
      script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://localhost:8080 https://*.googleusercontent.com https://ssl.gstatic.com;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
      connect-src 'self' https://localhost:8080 https://*.googleapis.com https://accounts.google.com;
    `;

    const googleAuthHeader = {
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

    const existingHeaders = await (require('./module')).headers();

    return [
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
          }
        ]
      },
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
  }
}

export default config