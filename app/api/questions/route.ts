import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        q.id,
        q.user_id,
        q.user_name,
        q.title,
        q.content,
        q.field,
        q.image_url,
        q.video_url,
        q.created_at,
        u.role as user_role,
        (SELECT COUNT(*) FROM solutions s WHERE s.question_id = q.id) as solutions_count,
        (SELECT COUNT(*) FROM thoughts t WHERE t.question_id = q.id) as thoughts_count,
        (SELECT COUNT(*) FROM solutions s WHERE s.question_id = q.id AND s.is_verified = 1) as verified_solutions_count
      FROM questions q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (field && field !== 'All' && field !== 'all') {
      const cleanField = field.trim().toLowerCase();
      if (cleanField === 'maths' || cleanField === 'mathematics') {
        query += ` AND LOWER(q.field) IN ('maths', 'mathematics')`;
      } else if (cleanField === 'computer' || cleanField === 'computer science') {
        query += ` AND LOWER(q.field) IN ('computer', 'computer science')`;
      } else {
        query += ` AND LOWER(q.field) = ?`;
        params.push(cleanField);
      }
    }

    if (search && search.trim().length > 0) {
      query += ` AND (q.title LIKE ? OR q.content LIKE ? OR q.field LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY q.created_at DESC`;

    const questions = await db.prepare(query).all(...params);

    // Get all distinct fields currently present in the questions table
    const distinctRows = (await db.prepare(`
      SELECT DISTINCT field 
      FROM questions 
      WHERE field IS NOT NULL AND TRIM(field) != ''
      ORDER BY field ASC
    `).all()) as { field: string }[];
    const availableFields = distinctRows.map((r: any) => r.field).filter(Boolean);

    return NextResponse.json({ questions, availableFields });
  } catch (err) {
    console.error('Fetch questions error:', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to post a question' }, { status: 401 });
    }

    const { title, content, field, imageUrl, videoUrl } = await request.json();

    if (!title || title.trim().length < 5) {
      return NextResponse.json({ error: 'Question title must be at least 5 characters long' }, { status: 400 });
    }

    const questionId = 'q_' + crypto.randomUUID();
    const now = Date.now();
    const cleanField = field && field.trim().length > 0 ? field.trim() : 'General';
    const cleanContent = typeof content === 'string' ? content.trim() : '';

    await db.prepare(`
      INSERT INTO questions (id, user_id, user_name, title, content, field, image_url, video_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      questionId,
      user.id,
      user.name,
      title.trim(),
      cleanContent,
      cleanField,
      imageUrl || null,
      videoUrl || null,
      now
    );

    const created = await db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);

    return NextResponse.json({
      success: true,
      question: created,
    });
  } catch (err) {
    console.error('Create question error:', err);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
