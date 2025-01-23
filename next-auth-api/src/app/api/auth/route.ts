import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { getUserByEmail } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(req: Request) {
    const { email, password } = await req.json();

    const user: User | null = await getUserByEmail(email);

    if (!user || user.password !== password) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    return NextResponse.json({ token });
}