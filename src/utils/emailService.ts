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

export const sendVerificationEmail = async (email: string, verificationCode: string) => {
  const htmlContent = generateVerificationEmailHtml(verificationCode);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[StyleCrush] 이메일 인증 코드',
      html: htmlContent
    });
    return true;
  } catch (error) {
    console.error('이메일 전송 에러:', error);
    throw new Error('이메일 전송에 실패했습니다.');
  }
};

const generateVerificationEmailHtml = (code: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: #f8f9fa;
          border-radius: 10px;
        }
        .header {
          text-align: center;
          padding: 20px;
          background-color: #4A90E2;
          color: white;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 5px;
          color: #4A90E2;
          text-align: center;
          padding: 20px;
          margin: 20px 0;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>이메일 인증</h1>
        </div>
        <div class="content">
          <p>안녕하세요, LookMate.</p>
          <p>아래의 6자리 인증 코드를 입력해주세요:</p>
          <div class="code">${code}</div>
          <p>이 인증 코드는 30분 동안 유효합니다.</p>
        </div>
        <div class="footer">
          <p>본 이메일은 발신 전용입니다.</p>
          <p>© 2025 LokkMate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};