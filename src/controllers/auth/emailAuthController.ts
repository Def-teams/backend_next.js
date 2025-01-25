import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import EmailUser from '../../models/EmailUser';
import { sendVerificationEmail } from '../../utils/emailService';

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
    const { email, password } = req.body;

    const existingUser = await EmailUser.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
    }

    const user = await EmailUser.create({
      email,
      password,
      userId: `email_${Date.now()}`, // userId 생성
      profileImg: {
        desktop: '/uploads/desktop/default.jpg',
        mobile: '/uploads/mobile/default.jpg'
      },
      stylePreferences: [], // 기본값 설정
      isVerified: false // 기본값 설정
    });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    await sendVerificationEmail(user.email, token);

    res.status(201).json({ message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.' });
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

    await user.update({ isVerified: true, verificationToken: undefined });
    res.status(200).json({ message: '이메일 인증이 완료되었습니다.' });

  } catch (error) {
    console.error('이메일 인증 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};