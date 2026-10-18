import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Unauthenticated users never see private verdicts
      return NextResponse.json({ verdict: null }, { status: 200 });
    }

    const { id: solutionId } = await context.params;
    if (!solutionId) {
      return NextResponse.json({ verdict: null }, { status: 400 });
    }

    // Query verdict only for the authenticated owner of the answer
    const row = (await db
      .prepare(`
        SELECT verdict, user_id 
        FROM answer_verifications 
        WHERE answer_id = ?
      `)
      .get(solutionId)) as any;

    if (!row) {
      return NextResponse.json({ verdict: null }, { status: 200 });
    }

    // Strict privacy: if requester is not the author, return null (never leak verdict to other users)
    if (row.user_id !== user.id) {
      return NextResponse.json({ verdict: null }, { status: 200 });
    }

    return NextResponse.json({
      verdict: row.verdict,
    });
  } catch (err) {
    console.error('Fetch solution verdict error:', err);
    return NextResponse.json({ verdict: null }, { status: 500 });
  }
}
