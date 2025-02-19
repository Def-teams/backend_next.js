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
  try {
    if (!/^\d{6}$/.test(verificationCode)) {
      throw new Error(`유효하지 않은 코드 형식: ${verificationCode}`);
    }

    const mailOptions = {
      from: `"LookMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '[LookMate] 이메일 인증 코드',
      html: generateVerificationEmailHtml(verificationCode),
      headers: {
        'X-Priority': '1' // 높은 중요도 표시
      }
    };

    await transporter.sendMail(mailOptions);
    console.log(`인증 코드 전송 성공: ${email.substring(0, 3)}***@***${email.split('@')[1]?.substring(-3)}`);
    return true;
  } catch (error) {
    console.error('이메일 전송 실패:', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('이메일 발송 시스템 오류');
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f9f9f9;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
          background-color: #282828;
          color: #fff;
          padding: 20px 0;
          text-align: center;
          border-radius: 12px 12px 0 0;
        }
        .header img {
          max-width: 100%;
          width: 200px; /* 로고 이미지 크기 늘림 */
          height: auto;
        }
        .content {
          padding: 30px;
          background-color: #fff;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        .greeting {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
        .code-container {
          text-align: center;
          margin: 30px 0;
        }
        .code {
          display: inline-block;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 8px;
          color:rgb(20, 18, 18);
          padding: 15px 25px;
          background-color: #f2f2f2;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .instruction {
          color: #555;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        .footer {
          text-align: center;
          color: #777;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://lookmate.kro.kr/uploads/background/lookmate.png" alt="LookMate Logo">
        </div>
        <div class="content">
          <p class="greeting">안녕하세요, LookMate를 이용해주셔서 감사합니다!</p>
          <p class="instruction">아래 6자리 인증 코드를 입력하여 이메일 주소를 확인해주세요:</p>
          <div class="code-container">
            <span class="code">${code}</span>
          </div>
          <p class="instruction">이 인증 코드는 30분 동안 유효합니다. 시간이 만료되기 전에 인증을 완료해주세요.</p>
        </div>
        <div class="footer">
          <p>본 이메일은 발신 전용입니다. 궁금한 점이 있으시면 고객센터로 문의해주세요.</p>
          <p>© 2024 LookMate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  console.log('Reset link received:', resetLink);

  const resetPasswordHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LookMate 비밀번호 재설정</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          max-width: 600px;
          margin: 20px auto;
          background-color: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header img {
          max-width: 100%;
          width: 200px; /* 로고 이미지 크기 늘림 */
          height: auto;
        }
        .content {
          margin-bottom: 30px;
        }
        .instruction {
          font-size: 16px;
          color: #555;
        }
        .reset-link {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://lookmate.kro.kr/uploads/background/lookmate.png" alt="LookMate Logo">
        </div>
        <div class="content">
          <p class="instruction">안녕하세요,</p>
          <p class="instruction">LookMate 비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 비밀번호를 재설정해주세요. 이 링크는 1시간 동안 유효합니다.</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="reset-link">비밀번호 재설정</a>
          </p>
          <p class="instruction">만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
        </div>
        <div class="footer">
          <p>본 이메일은 발신 전용입니다. 궁금한 점이 있으시면 고객센터로 문의해주세요.</p>
          <p>© 2024 LookMate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`Sending password reset email to: ${email}`);
  await transporter.sendMail({
    from: `"LookMate 서비스" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'LookMate 비밀번호 재설정 안내',
    html: resetPasswordHTML,
  });
};

export const sendDeletionConfirmationEmail = async (email: string) => {
  const deletionConfirmationHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LookMate 계정 삭제 완료 안내</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          color: #333;
          line-height: 1.6;
        }
        .container {
          width: 80%;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .header img {
          max-width: 100%;
          width: 200px; /* 로고 이미지 크기 늘림 */
        }
        .content {
          padding: 20px 0;
        }
        .content p {
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://lookmate.kro.kr/uploads/background/lookmate.png" alt="LookMate Logo">
        </div>
        <div class="content">
          <h2>계정 삭제가 완료되었습니다.</h2>
          <p>LookMate 서비스를 이용해주셔서 감사합니다. 계정이 성공적으로 삭제되었습니다.</p>
          <p>언제든지 다시 LookMate을 찾아주세요! 당신을 다시 뵙기를 희망합니다.</p>
          <p>계정 복구 또는 기타 문의사항은 lookmate101@gmail.com으로 문의해주시면 친절하게 안내해 드리겠습니다.</p>
        </div>
        <div class="footer">
          <p>© 2024 LookMate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"LookMate 서비스" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'LookMate 계정 삭제 완료 안내',
    html: deletionConfirmationHTML,
  });
};
