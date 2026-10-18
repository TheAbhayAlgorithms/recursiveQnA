import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const question = await db.prepare(`
      SELECT 
        q.*,
        u.role as user_role,
        u.field_of_interest as user_field
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `).get(id);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const rawSolutions = (await db.prepare(`
      SELECT 
        s.*,
        u.role as user_role
      FROM solutions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.question_id = ?
      ORDER BY s.is_verified DESC, s.created_at ASC
    `).all(id)) as any[];

    const rawThoughts = (await db.prepare(`
      SELECT 
        t.*,
        u.role as user_role
      FROM thoughts t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.question_id = ?
      ORDER BY t.created_at ASC
    `).all(id)) as any[];

    // Privacy enforcement: AI verification verdict is strictly private to the solution's author
    const currentUser = await getCurrentUser();
    const authorVerdictsMap = new Map<string, string>();
    if (currentUser) {
      const verRows = (await db.prepare(`
        SELECT answer_id, verdict 
        FROM answer_verifications 
        WHERE user_id = ?
      `).all(currentUser.id)) as any[];
      for (const row of verRows) {
        authorVerdictsMap.set(row.answer_id, row.verdict);
      }
    }

    const solutions = rawSolutions.map((sol, index) => {
      const comments = rawThoughts.filter(t => 
        t.solution_id === sol.id || (!t.solution_id && index === 0)
      );
      // Only include ai_verdict if the viewer is the author of this specific solution
      const isAuthor = currentUser && currentUser.id === sol.user_id;
      return {
        ...sol,
        ai_verdict: isAuthor ? (authorVerdictsMap.get(sol.id) || null) : null,
        comments,
        comments_count: comments.length,
      };
    });

    return NextResponse.json({
      question,
      solutions,
      thoughts: rawThoughts,
    });
  } catch (err) {
    console.error('Fetch question details error:', err);
    return NextResponse.json({ error: 'Failed to fetch question details' }, { status: 500 });
  }
}

// DELETE: Strict admin-only deletion requirement!
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    // STRICT PRIVILEGE CHECK: ONLY ADMIN CAN DELETE QUESTIONS!
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only the platform administrator has permission to delete questions.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Delete associated solutions and thoughts first, then question
    await db.prepare('DELETE FROM thoughts WHERE question_id = ?').run(id);
    await db.prepare('DELETE FROM solutions WHERE question_id = ?').run(id);
    await db.prepare('DELETE FROM questions WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Question and associated discussions successfully deleted by administrator.',
    });
  } catch (err) {
    console.error('Delete question error:', err);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
