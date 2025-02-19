export const generateVerificationCode = (): number => {
  const code = Math.floor(100000 + Math.random() * 900000);
  if (isNaN(code) || code < 100000 || code > 999999) {
    console.error('잘못된 인증 코드 생성:', code);
    return 123456; // 임시 안전 코드
  }
  return code;
}; 