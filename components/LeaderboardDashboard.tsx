'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Flame,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

interface SolutionItem {
  id: string;
  questionId: string;
  questionTitle: string;
  questionField: string;
  content: string;
  isVerified: boolean;
  createdAt: number;
}

interface LeaderboardUser {
  userId: string;
  name: string;
  role: 'admin' | 'user';
  fieldOfInterest: string;
  userCreatedAt: number;
  solutionsCount: number;
  verifiedCount: number;
  verificationRate: number;
  questionsCount: number;
  thoughtsCount: number;
  academicScore: number;
  tier: string;
  tierColor: string;
  topSubject: string;
  subjectBreakdown: Record<string, number>;
  latestSolutionAt: number | null;
  recentSolutions: SolutionItem[];
  rank: number;
}

interface LeaderboardStats {
  totalSolutions: number;
  totalSolvers: number;
  totalVerified: number;
  platformTopSubject: string;
  topSolver: {
    name: string;
    userId: string;
    solutionsCount: number;
    tier: string;
  } | null;
  totalRegisteredUsers: number;
}

interface LeaderboardDashboardProps {
  currentUser: any;
  onViewQuestion?: (questionId: string, initialTab?: 'question' | 'solutions') => void;
  onSwitchToQuestions?: () => void;
}

export default function LeaderboardDashboard({
  currentUser,
  onViewQuestion,
  onSwitchToQuestions,
}: LeaderboardDashboardProps) {
  // Filters & Controls State
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [selectedField, setSelectedField] = useState('All');
  const [sortBy, setSortBy] = useState<'solutions' | 'verified' | 'score' | 'questions'>('solutions');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'podium' | 'table'>('podium');

  // Data State
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Scholar Drawer Modal State
  const [selectedScholar, setSelectedScholar] = useState<LeaderboardUser | null>(null);

  // Load Leaderboard Data
  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('timeframe', timeframe);
      if (selectedField !== 'All') params.set('field', selectedField);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setStats(data.stats || null);
        if (Array.isArray(data.availableFields)) {
          setAvailableFields(data.availableFields);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [timeframe, selectedField, sortBy, searchQuery]);

  // Find current user's entry in the leaderboard
  const myLeaderboardEntry = useMemo(() => {
    if (!currentUser) return null;
    return leaderboard.find((item) => item.userId === currentUser.id) || null;
  }, [currentUser, leaderboard]);

  // Max solutions count for relative progress bar rendering
  const maxSolutions = useMemo(() => {
    if (leaderboard.length === 0) return 1;
    return Math.max(...leaderboard.map((item) => item.solutionsCount), 1);
  }, [leaderboard]);

  // Top 3 solvers for Podium
  const topThree = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const remainingSolvers = useMemo(() => {
    return leaderboard.slice(3);
  }, [leaderboard]);

  return (
    <div className="leaderboard-dashboard-wrapper">
      {/* ========================================================
          1. HEADER & COMMUNITY METRIC CARDS
          ======================================================== */}
      <section className="leaderboard-hero-banner">
        <div className="app-container">
          <div className="leaderboard-hero-header">
            <div className="leaderboard-badge-tag">
              <Sparkles size={14} className="tag-sparkle" />
              <span>ACADEMIC HONORS & COMMUNITY IMPACT</span>
            </div>
            <h1 className="leaderboard-title">Solutions Leaderboard</h1>
            <p className="leaderboard-subtitle">
              Recognizing scholars and problem solvers who provide step-by-step academic solutions, 
              verified proofs, and video walkthroughs across all disciplines.
            </p>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="leaderboard-metrics-grid">
            <div className="metric-box">
              <div className="metric-icon-wrap metric-accent-blue">
                <Trophy size={20} />
              </div>
              <div className="metric-content">
                <div className="metric-value">
                  {stats ? stats.totalSolutions : '—'}
                </div>
                <div className="metric-label">Solutions Contributed</div>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-wrap metric-accent-emerald">
                <ShieldCheck size={20} />
              </div>
              <div className="metric-content">
                <div className="metric-value">
                  {stats ? stats.totalVerified : '—'}
                </div>
                <div className="metric-label">Verified Explanations</div>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-wrap metric-accent-purple">
                <GraduationCap size={20} />
              </div>
              <div className="metric-content">
                <div className="metric-value">
                  {stats ? stats.totalSolvers : '—'}
                </div>
                <div className="metric-label">Active Solvers</div>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-wrap metric-accent-amber">
                <Crown size={20} />
              </div>
              <div className="metric-content">
                <div className="metric-value text-truncate">
                  {stats?.topSolver ? stats.topSolver.name : 'Open for 1st'}
                </div>
                <div className="metric-label">
                  {stats?.topSolver ? `${stats.topSolver.solutionsCount} solutions` : 'Leader Rank #1'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. LOGGED-IN SCHOLAR STANDING CARD
          ======================================================== */}
      {currentUser && currentUser.id !== 'admin' && !currentUser.name?.toLowerCase().includes('administrator') && (
        <section className="app-container" style={{ marginTop: '24px' }}>
          <div className="my-standing-card">
            <div className="my-standing-info">
              <div className="my-standing-avatar">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="my-standing-details">
                <div className="my-standing-title-row">
                  <span className="my-standing-name">{currentUser.name}</span>
                  <span className="my-standing-pill">
                    {myLeaderboardEntry ? `Rank #${myLeaderboardEntry.rank}` : 'Unranked'}
                  </span>
                  {myLeaderboardEntry && (
                    <span 
                      className="my-tier-badge"
                      style={{ color: myLeaderboardEntry.tierColor, borderColor: `${myLeaderboardEntry.tierColor}44` }}
                    >
                      {myLeaderboardEntry.tier}
                    </span>
                  )}
                </div>
                <div className="my-standing-stats-row">
                  <span>
                    <strong>{myLeaderboardEntry ? myLeaderboardEntry.solutionsCount : 0}</strong> solutions submitted
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{myLeaderboardEntry ? myLeaderboardEntry.verifiedCount : 0}</strong> verified
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{myLeaderboardEntry ? myLeaderboardEntry.academicScore : 0}</strong> academic score
                  </span>
                </div>
              </div>
            </div>

            <div className="my-standing-action">
              {onSwitchToQuestions ? (
                <button
                  type="button"
                  onClick={onSwitchToQuestions}
                  className="btn btn-primary my-contribute-btn"
                >
                  <span>Solve an Open Question</span>
                  <ArrowUpRight size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          3. INTERACTIVE CONTROLS TOOLBAR
          ======================================================== */}
      <section className="app-container" style={{ marginTop: '28px' }}>
        <div className="leaderboard-controls-card">
          <div className="controls-row-top">
            {/* Timeframe selector */}
            <div className="timeframe-toggle-group">
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`timeframe-btn ${timeframe === 'all' ? 'is-active' : ''}`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('month')}
                className={`timeframe-btn ${timeframe === 'month' ? 'is-active' : ''}`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('week')}
                className={`timeframe-btn ${timeframe === 'week' ? 'is-active' : ''}`}
              >
                This Week
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle-group">
              <button
                type="button"
                onClick={() => setViewMode('podium')}
                className={`view-mode-btn ${viewMode === 'podium' ? 'is-active' : ''}`}
                title="Podium & Cards View"
              >
                <Trophy size={15} />
                <span className="view-mode-label">Podium View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`view-mode-btn ${viewMode === 'table' ? 'is-active' : ''}`}
                title="Table View"
              >
                <BarChart3 size={15} />
                <span className="view-mode-label">Table View</span>
              </button>
            </div>
          </div>

          <div className="controls-row-bottom">
            {/* Search Input */}
            <div className="leaderboard-search-wrapper">
              <Search size={16} className="search-icon-inside" />
              <input
                type="text"
                placeholder="Search scholars by name, username, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input leaderboard-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Field Dropdown */}
            <div className="leaderboard-select-wrapper">
              <Filter size={15} className="select-icon-inside" />
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="form-select leaderboard-field-select"
                aria-label="Filter by subject"
              >
                <option value="All">All Subjects</option>
                {availableFields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="leaderboard-select-wrapper">
              <TrendingUp size={15} className="select-icon-inside" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="form-select leaderboard-sort-select"
                aria-label="Sort scholars by"
              >
                <option value="solutions">Most Solutions</option>
                <option value="verified">Most Verified Solutions</option>
                <option value="score">Top Academic Score (XP)</option>
                <option value="questions">Questions Asked</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. LEADERBOARD CONTENT: PODIUM OR TABLE
          ======================================================== */}
      <section className="app-container" style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div className="leaderboard-loading-state">
            <div className="loading-spinner-ring" />
            <p>Computing academic rankings & solution analytics...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="card empty-leaderboard-card">
            <div className="empty-trophy-circle">
              <Trophy size={32} />
            </div>
            <h3>No Solution Data Found</h3>
            <p>
              {searchQuery
                ? `No scholars matched "${searchQuery}". Try a different keyword.`
                : 'No solutions match the selected timeframe or subject. Be the first scholar to answer a question!'}
            </p>
            {onSwitchToQuestions && (
              <button
                type="button"
                onClick={onSwitchToQuestions}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
              >
                Browse Open Questions
              </button>
            )}
          </div>
        ) : (
          <>
            {/* PODIUM VIEW */}
            {viewMode === 'podium' && (
              <div className="podium-view-section">
                {/* Top 3 Podium (renders if top solvers have solutions) */}
                {topThree.length > 0 && (
                  <div className="podium-pedestal-grid">
                    {/* 2nd Place (Left) */}
                    {topThree.length >= 2 && (
                      <div 
                        className="podium-step podium-silver-step"
                        onClick={() => setSelectedScholar(topThree[1])}
                      >
                        <div className="podium-rank-badge rank-badge-silver">
                          <Medal size={16} />
                          <span>#2</span>
                        </div>
                        <div className="podium-avatar-ring avatar-silver">
                          {topThree[1].name.charAt(0).toUpperCase()}
                        </div>
                        <div className="podium-scholar-name" title={topThree[1].name}>
                          {topThree[1].name}
                        </div>
                        <div className="podium-username">@{topThree[1].userId}</div>
                        <div className="podium-score-pill">
                          <strong>{topThree[1].solutionsCount}</strong> {topThree[1].solutionsCount === 1 ? 'solution' : 'solutions'}
                        </div>
                        <div className="podium-secondary-stat">
                          {topThree[1].verifiedCount > 0 && (
                            <span className="verified-stat-pill">
                              <CheckCircle2 size={12} /> {topThree[1].verifiedCount} verified
                            </span>
                          )}
                          <span className="field-tag-mini">{topThree[1].topSubject}</span>
                        </div>
                        <div className="podium-base base-silver">
                          <span>SILVER SCHOLAR</span>
                        </div>
                      </div>
                    )}

                    {/* 1st Place (Center, Elevated) */}
                    {topThree.length >= 1 && (
                      <div 
                        className="podium-step podium-gold-step"
                        onClick={() => setSelectedScholar(topThree[0])}
                      >
                        <div className="podium-crown-icon">
                          <Crown size={28} />
                        </div>
                        <div className="podium-rank-badge rank-badge-gold">
                          <Trophy size={16} />
                          <span>#1</span>
                        </div>
                        <div className="podium-avatar-ring avatar-gold">
                          {topThree[0].name.charAt(0).toUpperCase()}
                        </div>
                        <div className="podium-scholar-name" title={topThree[0].name}>
                          {topThree[0].name}
                        </div>
                        <div className="podium-username">@{topThree[0].userId}</div>
                        <div className="podium-score-pill gold-score-pill">
                          <strong>{topThree[0].solutionsCount}</strong> {topThree[0].solutionsCount === 1 ? 'solution' : 'solutions'}
                        </div>
                        <div className="podium-secondary-stat">
                          {topThree[0].verifiedCount > 0 && (
                            <span className="verified-stat-pill verified-gold">
                              <CheckCircle2 size={12} /> {topThree[0].verifiedCount} verified
                            </span>
                          )}
                          <span className="field-tag-mini">{topThree[0].topSubject}</span>
                        </div>
                        <div className="podium-base base-gold">
                          <span>GOLD MASTER SCHOLAR</span>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place (Right) */}
                    {topThree.length >= 3 && (
                      <div 
                        className="podium-step podium-bronze-step"
                        onClick={() => setSelectedScholar(topThree[2])}
                      >
                        <div className="podium-rank-badge rank-badge-bronze">
                          <Award size={16} />
                          <span>#3</span>
                        </div>
                        <div className="podium-avatar-ring avatar-bronze">
                          {topThree[2].name.charAt(0).toUpperCase()}
                        </div>
                        <div className="podium-scholar-name" title={topThree[2].name}>
                          {topThree[2].name}
                        </div>
                        <div className="podium-username">@{topThree[2].userId}</div>
                        <div className="podium-score-pill">
                          <strong>{topThree[2].solutionsCount}</strong> {topThree[2].solutionsCount === 1 ? 'solution' : 'solutions'}
                        </div>
                        <div className="podium-secondary-stat">
                          {topThree[2].verifiedCount > 0 && (
                            <span className="verified-stat-pill">
                              <CheckCircle2 size={12} /> {topThree[2].verifiedCount} verified
                            </span>
                          )}
                          <span className="field-tag-mini">{topThree[2].topSubject}</span>
                        </div>
                        <div className="podium-base base-bronze">
                          <span>BRONZE SCHOLAR</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Remaining Solvers List (Rank 4+) */}
                {remainingSolvers.length > 0 && (
                  <div className="remaining-solvers-container">
                    <h3 className="remaining-solvers-heading">
                      Scholars & Solvers (Rank 4+)
                    </h3>
                    <div className="solver-cards-list">
                      {remainingSolvers.map((solver) => {
                        const isMe = currentUser?.id === solver.userId;
                        const progressPct = Math.round((solver.solutionsCount / maxSolutions) * 100);

                        return (
                          <div
                            key={solver.userId}
                            className={`solver-row-card ${isMe ? 'is-me-card' : ''}`}
                            onClick={() => setSelectedScholar(solver)}
                          >
                            <div className="solver-card-left">
                              <div className="solver-rank-chip">
                                #{solver.rank}
                              </div>
                              <div className="solver-avatar-circle">
                                {solver.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="solver-info-block">
                                <div className="solver-name-row">
                                  <span className="solver-display-name">{solver.name}</span>
                                  {isMe && <span className="you-badge-chip">You</span>}
                                  <span 
                                    className="solver-tier-chip"
                                    style={{ color: solver.tierColor, borderColor: `${solver.tierColor}33` }}
                                  >
                                    {solver.tier}
                                  </span>
                                </div>
                                <div className="solver-meta-row">
                                  <span className="solver-handle">@{solver.userId}</span>
                                  <span>•</span>
                                  <span className="solver-top-field">{solver.topSubject}</span>
                                </div>
                              </div>
                            </div>

                            {/* Center: Solutions Visual Bar */}
                            <div className="solver-card-center">
                              <div className="solver-bar-labels">
                                <span className="solver-solutions-count">
                                  <strong>{solver.solutionsCount}</strong> {solver.solutionsCount === 1 ? 'solution' : 'solutions'}
                                </span>
                                {solver.verifiedCount > 0 && (
                                  <span className="solver-verified-pill">
                                    <CheckCircle2 size={13} /> {solver.verifiedCount} verified
                                  </span>
                                )}
                              </div>
                              <div className="solver-bar-track">
                                <div 
                                  className="solver-bar-fill" 
                                  style={{ width: `${Math.max(progressPct, 4)}%` }} 
                                />
                              </div>
                            </div>

                            {/* Right: Academic XP and Inspect button */}
                            <div className="solver-card-right">
                              <div className="solver-xp-block">
                                <span className="xp-number">{solver.academicScore}</span>
                                <span className="xp-label">XP</span>
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm solver-view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedScholar(solver);
                                }}
                              >
                                <span>Inspect</span>
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <div className="leaderboard-table-card">
                <div className="table-responsive-wrapper">
                  <table className="leaderboard-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '70px', textAlign: 'center' }}>Rank</th>
                        <th>Scholar</th>
                        <th>Primary Subject</th>
                        <th style={{ width: '220px' }}>Solutions Given</th>
                        <th style={{ textAlign: 'center' }}>Verified</th>
                        <th style={{ textAlign: 'center' }}>Inquiries</th>
                        <th style={{ textAlign: 'right' }}>Academic Score</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((solver) => {
                        const isMe = currentUser?.id === solver.userId;
                        const progressPct = Math.round((solver.solutionsCount / maxSolutions) * 100);

                        return (
                          <tr
                            key={solver.userId}
                            className={`table-scholar-row ${isMe ? 'is-me-row' : ''}`}
                            onClick={() => setSelectedScholar(solver)}
                          >
                            {/* Rank */}
                            <td style={{ textAlign: 'center' }}>
                              {solver.rank === 1 ? (
                                <span className="rank-medal gold-medal" title="Rank 1">
                                  🥇 1
                                </span>
                              ) : solver.rank === 2 ? (
                                <span className="rank-medal silver-medal" title="Rank 2">
                                  🥈 2
                                </span>
                              ) : solver.rank === 3 ? (
                                <span className="rank-medal bronze-medal" title="Rank 3">
                                  🥉 3
                                </span>
                              ) : (
                                <span className="rank-number-chip">#{solver.rank}</span>
                              )}
                            </td>

                            {/* Scholar Info */}
                            <td>
                              <div className="table-user-cell">
                                <div className="table-user-avatar">
                                  {solver.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="table-user-name">
                                    <span>{solver.name}</span>
                                    {isMe && <span className="you-badge-chip">You</span>}
                                  </div>
                                  <div className="table-user-handle">@{solver.userId}</div>
                                </div>
                              </div>
                            </td>

                            {/* Top Subject */}
                            <td>
                              <span className="table-subject-tag">{solver.topSubject}</span>
                            </td>

                            {/* Solutions Given & Progress */}
                            <td>
                              <div className="table-solutions-cell">
                                <div className="table-solutions-header">
                                  <strong>{solver.solutionsCount}</strong>
                                  <span className="text-muted" style={{ fontSize: '11px' }}>
                                    ({solver.verificationRate}% ver.)
                                  </span>
                                </div>
                                <div className="table-progress-track">
                                  <div 
                                    className="table-progress-fill" 
                                    style={{ width: `${Math.max(progressPct, 4)}%` }} 
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Verified count */}
                            <td style={{ textAlign: 'center' }}>
                              {solver.verifiedCount > 0 ? (
                                <span className="table-verified-chip">
                                  <CheckCircle2 size={13} /> {solver.verifiedCount}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>0</span>
                              )}
                            </td>

                            {/* Inquiries */}
                            <td style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {solver.questionsCount}
                            </td>

                            {/* Academic Score */}
                            <td style={{ textAlign: 'right' }}>
                              <span className="table-xp-badge">
                                {solver.academicScore} XP
                              </span>
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedScholar(solver);
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ========================================================
          5. INTERACTIVE SCHOLAR DETAIL DRAWER / MODAL
          ======================================================== */}
      {selectedScholar && (
        <div 
          className="scholar-drawer-backdrop"
          onClick={() => setSelectedScholar(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="scholar-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="scholar-drawer-header">
              <div className="drawer-header-left">
                <div className="drawer-avatar">
                  {selectedScholar.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="drawer-name-row">
                    <h2 className="drawer-scholar-name">{selectedScholar.name}</h2>
                    <span 
                      className="drawer-tier-badge"
                      style={{ color: selectedScholar.tierColor, borderColor: `${selectedScholar.tierColor}44` }}
                    >
                      {selectedScholar.tier}
                    </span>
                  </div>
                  <div className="drawer-scholar-sub">
                    <span>@{selectedScholar.userId}</span>
                    <span>•</span>
                    <span>Rank #{selectedScholar.rank}</span>
                    <span>•</span>
                    <span>Field: {selectedScholar.fieldOfInterest}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelectedScholar(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Metric Cards */}
            <div className="drawer-stats-grid">
              <div className="drawer-stat-item">
                <div className="drawer-stat-num">{selectedScholar.solutionsCount}</div>
                <div className="drawer-stat-label">Solutions Contributed</div>
              </div>
              <div className="drawer-stat-item">
                <div className="drawer-stat-num">{selectedScholar.verifiedCount}</div>
                <div className="drawer-stat-label">Verified Solutions</div>
              </div>
              <div className="drawer-stat-item">
                <div className="drawer-stat-num">{selectedScholar.academicScore}</div>
                <div className="drawer-stat-label">Academic XP</div>
              </div>
              <div className="drawer-stat-item">
                <div className="drawer-stat-num">{selectedScholar.questionsCount}</div>
                <div className="drawer-stat-label">Inquiries Asked</div>
              </div>
            </div>

            {/* Subject Distribution */}
            {selectedScholar.subjectBreakdown && Object.keys(selectedScholar.subjectBreakdown).length > 0 && (
              <div className="drawer-section">
                <h4 className="drawer-section-title">
                  <Layers size={15} />
                  <span>Subject Contribution Breakdown</span>
                </h4>
                <div className="drawer-subject-tags">
                  {Object.entries(selectedScholar.subjectBreakdown).map(([subj, count]) => (
                    <span key={subj} className="drawer-subject-pill">
                      <strong>{subj}:</strong> {count} {count === 1 ? 'solution' : 'solutions'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scholar's Solutions List */}
            <div className="drawer-section" style={{ flex: 1, overflowY: 'auto' }}>
              <h4 className="drawer-section-title">
                <BookOpen size={15} />
                <span>Recent Solutions Provided ({selectedScholar.recentSolutions.length})</span>
              </h4>

              {selectedScholar.recentSolutions.length === 0 ? (
                <div className="drawer-empty-solutions">
                  <p>No solutions provided in this filtered range.</p>
                </div>
              ) : (
                <div className="drawer-solutions-feed">
                  {selectedScholar.recentSolutions.map((sol) => (
                    <div key={sol.id} className="drawer-solution-card">
                      <div className="drawer-solution-card-header">
                        <span className="drawer-sol-field">{sol.questionField}</span>
                        {sol.isVerified && (
                          <span className="drawer-sol-verified">
                            <CheckCircle2 size={13} /> Verified Answer
                          </span>
                        )}
                        <span className="drawer-sol-date">
                          {formatDate(sol.createdAt)}
                        </span>
                      </div>

                      <h5 className="drawer-question-title">
                        {sol.questionTitle}
                      </h5>

                      <p className="drawer-sol-snippet">
                        {sol.content}
                      </p>

                      {onViewQuestion && (
                        <div className="drawer-sol-action">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedScholar(null);
                              onViewQuestion(sol.questionId, 'solutions');
                            }}
                          >
                            <span>Inspect Solution in Problem Context</span>
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
