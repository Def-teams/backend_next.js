import { NextRequest, NextResponse } from 'next/server';
import EmailUser from '@/models/emailUser';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/utils/emailService';
import { Op } from 'sequelize';

export async function POST(req: NextRequest) {
  // ... 기존 POST 구현 내용 유지
}

export async function PUT(req: NextRequest) {
  // ... 기존 PUT 구현 내용 유지
} 