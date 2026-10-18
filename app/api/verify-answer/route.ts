import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { verifyWithGemini, checkVerificationRateLimit, Verdict } from '@/lib/verifyAnswer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to verify your solution' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const answerId = body.answerId || body.solutionId;

    if (!answerId || typeof answerId !== 'string') {
      return NextResponse.json(
        { error: 'Answer ID is required' },
        { status: 400 }
      );
    }

    // 3. Load answer from database itself (never trust client-sent text)
    const solution = (await db
      .prepare('SELECT id, question_id, user_id, content FROM solutions WHERE id = ?')
      .get(answerId)) as any;

    if (!solution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }

    // 4. Privacy & Authorization: Must be the author of the answer
    if (solution.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only verify your own submitted solutions' },
        { status: 403 }
      );
    }

    // 5. Answer validation
    const answerText = (solution.content || '').trim();
    if (answerText.length === 0) {
      return NextResponse.json(
        { error: 'Cannot verify an empty solution' },
        { status: 400 }
      );
    }

    if (answerText.length > 4000) {
      return NextResponse.json(
        { error: 'Solution exceeds maximum allowed length of 4000 characters' },
        { status: 400 }
      );
    }

    // 6. Abuse protection: Rate limiting (max 5/hr/question, max 30/day/user)
    const rateCheck = await checkVerificationRateLimit(user.id, solution.question_id);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error, rateLimited: true },
        { status: 429 }
      );
    }

    // 7. Load question from database
    const question = (await db
      .prepare('SELECT id, title, content, image_url FROM questions WHERE id = ?')
      .get(solution.question_id)) as any;

    if (!question) {
      return NextResponse.json(
        { error: 'Associated question was not found' },
        { status: 404 }
      );
    }

    const questionFullText = `${question.title || ''}\n\n${question.content || ''}`.trim();

    // 8. Call Gemini with safety prompt, timeout, and retry
    const verdict: Verdict = await verifyWithGemini(
      questionFullText,
      answerText,
      question.image_url
    );

    // 9. Store verdict in private answer_verifications table
    const verificationId = 'ver_' + crypto.randomUUID();
    const now = Date.now();

    await db.prepare(`
      INSERT INTO answer_verifications (id, answer_id, user_id, verdict, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (answer_id) DO UPDATE SET
        verdict = EXCLUDED.verdict,
        created_at = EXCLUDED.created_at
    `).run(verificationId, solution.id, user.id, verdict, now);

    // 10. Return strictly the verdict (never reasoning or answer keys)
    return NextResponse.json({
      verdict,
    });
  } catch (err: any) {
    console.error('Verify answer API error:', err);
    // On unexpected server error, return neutral status (never mark incorrect)
    return NextResponse.json({
      verdict: 'unsure',
      message: "Couldn't verify right now, please try again",
    });
  }
}
