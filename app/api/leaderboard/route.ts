import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all'; // 'all', 'month', 'week'
    const field = searchParams.get('field') || 'All';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'solutions'; // 'solutions', 'verified', 'score', 'questions'

    const now = Date.now();
    let timeCutoff = 0;
    if (timeframe === 'week') {
      timeCutoff = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'month') {
      timeCutoff = now - 30 * 24 * 60 * 60 * 1000;
    }

    // 1. Fetch all distinct fields available
    const fieldsRows = await db.prepare(`SELECT DISTINCT field FROM questions ORDER BY field ASC`).all();
    const availableFields = fieldsRows.map((r: any) => r.field).filter(Boolean);

    // 2. Fetch all users
    const users = await db.prepare(`
      SELECT id, name, role, field_of_interest, created_at
      FROM users
    `).all();

    // 3. Fetch solutions joined with questions
    let solQuery = `
      SELECT 
        s.id,
        s.question_id,
        s.user_id,
        s.user_name,
        s.content,
        s.is_verified,
        s.created_at,
        q.title as question_title,
        q.field as question_field
      FROM solutions s
      LEFT JOIN questions q ON s.question_id = q.id
      WHERE 1=1
    `;
    const solParams: any[] = [];

    if (timeCutoff > 0) {
      solQuery += ` AND s.created_at >= ?`;
      solParams.push(timeCutoff);
    }

    if (field && field !== 'All' && field !== 'all') {
      const cleanField = field.trim().toLowerCase();
      if (cleanField === 'maths' || cleanField === 'mathematics') {
        solQuery += ` AND LOWER(q.field) IN ('maths', 'mathematics')`;
      } else if (cleanField === 'computer' || cleanField === 'computer science') {
        solQuery += ` AND LOWER(q.field) IN ('computer', 'computer science')`;
      } else {
        solQuery += ` AND LOWER(q.field) = ?`;
        solParams.push(cleanField);
      }
    }

    solQuery += ` ORDER BY s.created_at DESC`;
    const solutions = await db.prepare(solQuery).all(...solParams);

    // 4. Fetch questions count per user
    const questionsCountRows = await db.prepare(`
      SELECT user_id, COUNT(*) as count FROM questions GROUP BY user_id
    `).all();
    const userQuestionsMap = new Map<string, number>();
    for (const r of questionsCountRows) {
      userQuestionsMap.set(r.user_id, Number(r.count || 0));
    }

    // 5. Fetch thoughts count per user
    const thoughtsCountRows = await db.prepare(`
      SELECT user_id, COUNT(*) as count FROM thoughts GROUP BY user_id
    `).all();
    const userThoughtsMap = new Map<string, number>();
    for (const r of thoughtsCountRows) {
      userThoughtsMap.set(r.user_id, Number(r.count || 0));
    }

    // 6. Aggregate solutions per user
    const userSolutionsMap = new Map<string, any[]>();
    for (const sol of solutions) {
      if (!userSolutionsMap.has(sol.user_id)) {
        userSolutionsMap.set(sol.user_id, []);
      }
      userSolutionsMap.get(sol.user_id)!.push(sol);
    }

    // 7. Build Leaderboard items
    const leaderboardItems = users.map((u: any) => {
      const userSols = userSolutionsMap.get(u.id) || [];
      const solutionsCount = userSols.length;
      const verifiedCount = userSols.filter((s: any) => s.is_verified === 1).length;
      const questionsCount = userQuestionsMap.get(u.id) || 0;
      const thoughtsCount = userThoughtsMap.get(u.id) || 0;

      // Subject breakdown
      const subjectsCountMap: Record<string, number> = {};
      for (const s of userSols) {
        const subj = s.question_field || 'General';
        subjectsCountMap[subj] = (subjectsCountMap[subj] || 0) + 1;
      }

      let topSubject = 'General';
      let maxSubjCount = 0;
      for (const [subj, count] of Object.entries(subjectsCountMap)) {
        if (count > maxSubjCount) {
          maxSubjCount = count;
          topSubject = subj;
        }
      }

      // Academic reputation score calculation
      const academicScore =
        solutionsCount * 50 +
        verifiedCount * 100 +
        questionsCount * 15 +
        thoughtsCount * 10;

      // Latest solution timestamp
      const latestSolutionAt = userSols.length > 0 ? userSols[0].created_at : null;

      // Verification rate percentage
      const verificationRate = solutionsCount > 0
        ? Math.round((verifiedCount / solutionsCount) * 100)
        : 0;

      // Tier badge calculation
      let tier = 'Rising Scholar';
      let tierColor = 'var(--text-muted)';
      if (academicScore >= 500 || solutionsCount >= 20) {
        tier = 'Grandmaster Solver';
        tierColor = '#f59e0b';
      } else if (academicScore >= 250 || solutionsCount >= 10) {
        tier = 'Master Scholar';
        tierColor = '#8b5cf6';
      } else if (academicScore >= 120 || solutionsCount >= 5) {
        tier = 'Distinguished Solver';
        tierColor = '#3b82f6';
      } else if (solutionsCount >= 1) {
        tier = 'Active Contributor';
        tierColor = '#10b981';
      }

      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        fieldOfInterest: u.field_of_interest || 'General',
        userCreatedAt: u.created_at,
        solutionsCount,
        verifiedCount,
        verificationRate,
        questionsCount,
        thoughtsCount,
        academicScore,
        tier,
        tierColor,
        topSubject: solutionsCount > 0 ? topSubject : (u.field_of_interest || 'General'),
        subjectBreakdown: subjectsCountMap,
        latestSolutionAt,
        recentSolutions: userSols.slice(0, 5).map((s: any) => ({
          id: s.id,
          questionId: s.question_id,
          questionTitle: s.question_title || 'Untitled Question',
          questionField: s.question_field || 'General',
          content: s.content ? s.content.substring(0, 160) : '',
          isVerified: s.is_verified === 1,
          createdAt: s.created_at,
        })),
      };
    });

    // 8. Filter by search if provided
    let filtered = leaderboardItems;
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.name.toLowerCase().includes(q) ||
        item.userId.toLowerCase().includes(q) ||
        item.fieldOfInterest.toLowerCase().includes(q) ||
        item.topSubject.toLowerCase().includes(q)
      );
    }

    // 9. Sorting
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'verified') {
        if (b.verifiedCount !== a.verifiedCount) return b.verifiedCount - a.verifiedCount;
        return b.solutionsCount - a.solutionsCount;
      }
      if (sortBy === 'score') {
        if (b.academicScore !== a.academicScore) return b.academicScore - a.academicScore;
        return b.solutionsCount - a.solutionsCount;
      }
      if (sortBy === 'questions') {
        if (b.questionsCount !== a.questionsCount) return b.questionsCount - a.questionsCount;
        return b.solutionsCount - a.solutionsCount;
      }
      // Default: 'solutions'
      if (b.solutionsCount !== a.solutionsCount) return b.solutionsCount - a.solutionsCount;
      if (b.verifiedCount !== a.verifiedCount) return b.verifiedCount - a.verifiedCount;
      if (b.academicScore !== a.academicScore) return b.academicScore - a.academicScore;
      return a.userCreatedAt - b.userCreatedAt;
    });

    // Assign Rank index (1-based)
    const rankedLeaderboard = filtered.map((item: any, idx: number) => ({
      ...item,
      rank: idx + 1,
    }));

    // 10. Platform summary statistics
    const totalSolutions = solutions.length;
    const solversSet = new Set(solutions.map((s: any) => s.user_id));
    const totalSolvers = solversSet.size;
    const totalVerified = solutions.filter((s: any) => s.is_verified === 1).length;

    // Platform top subject
    const subjectFreq: Record<string, number> = {};
    for (const s of solutions) {
      const f = s.question_field || 'General';
      subjectFreq[f] = (subjectFreq[f] || 0) + 1;
    }
    let platformTopSubject = 'General';
    let maxSubj = 0;
    for (const [sub, cnt] of Object.entries(subjectFreq)) {
      if (cnt > maxSubj) {
        maxSubj = cnt;
        platformTopSubject = sub;
      }
    }

    const topSolver = rankedLeaderboard.length > 0 && rankedLeaderboard[0].solutionsCount > 0
      ? {
          name: rankedLeaderboard[0].name,
          userId: rankedLeaderboard[0].userId,
          solutionsCount: rankedLeaderboard[0].solutionsCount,
          tier: rankedLeaderboard[0].tier,
        }
      : null;

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard,
      stats: {
        totalSolutions,
        totalSolvers,
        totalVerified,
        platformTopSubject,
        topSolver,
        totalRegisteredUsers: users.length,
      },
      availableFields,
      timeframe,
      field,
      sortBy,
    });
  } catch (err) {
    console.error('Leaderboard API error:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
