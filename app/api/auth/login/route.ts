import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json({ error: 'User ID and password are required' }, { status: 400 });
    }

    const cleanUserId = userId.trim().toLowerCase();
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    let user = (await db.prepare('SELECT * FROM users WHERE LOWER(id) = ? OR LOWER(email) = ?').get(cleanUserId, cleanUserId)) as {
      id: string;
      name: string;
      password_hash: string;
      role: 'admin' | 'user';
      field_of_interest: string;
    } | undefined;

    // Self-healing: Ensure root admin user exists
    if (!user && cleanUserId === 'admin') {
      const defaultHash = await bcrypt.hash('admin', 10);
      await db.prepare(`
        INSERT INTO users (id, name, password_hash, role, field_of_interest, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('admin', 'Academic Administrator', defaultHash, 'admin', 'Administration', Date.now());

      user = (await db.prepare('SELECT * FROM users WHERE LOWER(id) = ?').get('admin')) as any;
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid User ID or password' }, { status: 401 });
    }

    // Compare bcrypt hash
    let isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid && cleanPassword !== password) {
      isValid = await bcrypt.compare(cleanPassword, user.password_hash);
    }


    if (!isValid) {
      return NextResponse.json({ error: 'Invalid User ID or password' }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      field_of_interest: user.field_of_interest,
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set('rqna_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('edu_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
