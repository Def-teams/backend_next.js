import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/controllers/auth/imageController';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const userId = formData.get('userId') as string;
  const file = formData.get('profileImage') as File;

  
  const mockReq = {
    headers: {
      authorization: req.headers.get('authorization') || '',
    },
    body: { userId, file },
  } as any; 

  const mockRes = {
    status: (status: number) => ({
      json: (data: any) => {
        mockRes.data = { status, data };
      },
    }),
  } as any;

  
  await uploadImage(mockReq, mockRes);

 
  return NextResponse.json(mockRes.data);
} 