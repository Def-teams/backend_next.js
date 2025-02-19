export const verifyAuthEnv = () => {
  const requiredVars = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'NEXT_PUBLIC_GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_BASE_URL',
    'JWT_SECRET',
    'CLIENT_URL',
    'GOOGLE_CALLBACK_URI'
  ];

  requiredVars.forEach(varName => {
    if (!process.env[varName]?.trim()) {
      throw new Error(`환경 변수 누락: ${varName}`);
    }
  });
}; 