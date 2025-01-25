import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '이메일 인증을 완료해주세요',
      html: `
        <h1>이메일 인증</h1>
        <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
        <a href="${process.env.BASE_URL}/api/auth/email/verify?token=${token}">
          이메일 인증하기
        </a>
      `
    });
    return true;
  } catch (error) {
    console.error('이메일 전송 에러:', error);
    throw new Error('이메일 전송에 실패했습니다.');
  }
};