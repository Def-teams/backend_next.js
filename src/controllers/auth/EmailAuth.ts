import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import EmailUser from '../../models/EmailUser';

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const register = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { email, userId, password } = req.body;

    // 이메일 중복 체크
    const existingUser = await EmailUser.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
    }

    // 인증 토큰 생성
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // 사용자 생성
    const user = await EmailUser.create({
      email,
      userId,
      password,
      verificationToken,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간
    });

    // 인증 이메일 전송
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '이메일 인증을 완료해주세요',
      html: `
        <h1>이메일 인증</h1>
        <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
        <a href="${process.env.BASE_URL}/api/auth/verify-email?token=${verificationToken}">
          이메일 인증하기
        </a>
      `
    });

    res.status(201).json({
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
      userId: user.userId
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const login = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { email, password } = req.body;

    const user = await EmailUser.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: '이메일 인증이 필요합니다.' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userId: user.userId,
        profileImg: user.profileImg,
        stylePreferences: user.stylePreferences
      }
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const verifyEmail = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { token } = req.query;

    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as { email: string };
    const user = await EmailUser.findOne({ where: { email: decoded.email } });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: '이미 인증된 계정입니다.' });
    }

    await user.update({ isVerified: true, verificationToken: null });
    res.status(200).json({ message: '이메일 인증이 완료되었습니다.' });

  } catch (error) {
    console.error('이메일 인증 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};