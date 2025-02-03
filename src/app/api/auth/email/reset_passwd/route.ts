import { NextRequest } from 'next/server';
import EmailUser from '@/models/emailUser';
import bcrypt from 'bcrypt';
import { sendPasswordResetEmail } from '@/utils/emailService';

export async function POST(req: NextRequest) {
  // ... 기존 POST 구현 내용 유지
}

export async function PUT(req: NextRequest) {
  // ... 기존 PUT 구현 내용 유지
} 