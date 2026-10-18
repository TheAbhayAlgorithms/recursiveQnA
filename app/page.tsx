'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import QuestionCard from '@/components/QuestionCard';
import AskQuestionModal from '@/components/AskQuestionModal';
import AddSolutionModal from '@/components/AddSolutionModal';
import QuestionViewerModal from '@/components/QuestionViewerModal';
import LeaderboardDashboard from '@/components/LeaderboardDashboard';
import { 
  Search, 
  BookOpen, 
  CheckCircle, 
  HelpCircle, 
  Layers,
  Filter,
  GraduationCap,
  ChevronsLeft,
  ChevronsRight,
  Trophy
} from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [mainTab, setMainTab] = useState<'questions' | 'leaderboard'>('questions');
  const [questions, setQuestions] = useState<any[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Subject chips scroll and carousel state
  const chipsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkChipsScrollability = useCallback(() => {
    const el = chipsRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 6;
    const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 6;
    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  }, []);

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;

    checkChipsScrollability();

    el.addEventListener('scroll', checkChipsScrollability, { passive: true });
    window.addEventListener('resize', checkChipsScrollability);

    const resizeObserver = new ResizeObserver(checkChipsScrollability);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkChipsScrollability);
      window.removeEventListener('resize', checkChipsScrollability);
      resizeObserver.disconnect();
    };
  }, [checkChipsScrollability, availableFields]);

  const handleChipsScroll = (direction: 'left' | 'right') => {
    const el = chipsRef.current;
    if (!el) return;
    // Slide by ~82% of visible container width to bring the next batch of ~10 items smoothly into view
    const slideAmount = Math.max(el.clientWidth * 0.82, 280);
    el.scrollBy({
      left: direction === 'right' ? slideAmount : -slideAmount,
      behavior: 'smooth'
    });
  };

  // Modals state
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [solutionModalData, setSolutionModalData] = useState<{ isOpen: boolean; questionId: string; title: string }>({
    isOpen: false,
    questionId: '',
    title: '',
  });

  // Dedicated Question Viewer Modal state (Problem, Solutions)
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    questionId: string | null;
    initialTab: 'question' | 'solutions';
  }>({
    isOpen: false,
    questionId: null,
    initialTab: 'question',
  });

  // Load User Session
  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  // Load Questions
  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedField !== 'All') params.set('field', selectedField);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      if (Array.isArray(data.availableFields)) {
        setAvailableFields(data.availableFields);
      }
    } catch (err) {
      console.error('Failed to load questions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'leaderboard') {
        setMainTab('leaderboard');
      }
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [selectedField, searchQuery]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const handleAdminDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this question and all its solutions? Only administrators can perform this action.')) {
      return;
    }

    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete question');
        return;
      }
      loadQuestions();
    } catch (err) {
      alert('Error deleting question');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        user={user} 
        onOpenAskModal={() => {
          if (!user) {
            window.location.href = '/login';
          } else {
            setIsAskModalOpen(true);
          }
        }} 
        onLogout={handleLogout} 
      />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Navigation View Switcher (Questions Feed vs Solutions Leaderboard) */}
        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setMainTab('questions')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: mainTab === 'questions' ? 'var(--bg-card)' : 'transparent',
                  color: mainTab === 'questions' ? 'var(--color-accent)' : 'var(--text-secondary)',
                  boxShadow: mainTab === 'questions' ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <BookOpen size={15} />
                <span>Questions Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('leaderboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: mainTab === 'leaderboard' ? 'var(--bg-card)' : 'transparent',
                  color: mainTab === 'leaderboard' ? 'var(--color-accent)' : 'var(--text-secondary)',
                  boxShadow: mainTab === 'leaderboard' ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Trophy size={15} style={{ color: '#f59e0b' }} />
                <span>Solutions Leaderboard</span>
              </button>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {mainTab === 'questions' ? (
                <span>Explore questions or contribute solutions to climb the leaderboard</span>
              ) : (
                <span>Rankings computed live from user solutions and verified answers</span>
              )}
            </div>
          </div>
        </div>

        {mainTab === 'leaderboard' ? (
          <LeaderboardDashboard
            currentUser={user}
            onViewQuestion={(questionId, initialTab) => {
              setViewerState({
                isOpen: true,
                questionId,
                initialTab: initialTab || 'solutions',
              });
            }}
            onSwitchToQuestions={() => setMainTab('questions')}
          />
        ) : (
          <>
            {/* Academic Hero Header */}
            <section className="home-hero-section" style={{ 
              background: 'var(--bg-card)', 
              borderBottom: '1px solid var(--border-light)',
              padding: '40px 0 32px 0' 
            }}>
              <div className="app-container">
                <div style={{ maxWidth: '720px' }}>
                  <h1 className="home-hero-title" style={{ 
                    fontSize: '32px', 
                    fontWeight: 800, 
                    letterSpacing: '-0.03em', 
                    color: 'var(--text-primary)',
                    lineHeight: 1.25,
                    marginBottom: '10px'
                  }}>
                    Explore Questions, Share Insights, and Verify Academic Solutions.
                  </h1>
                  <p className="home-hero-desc" style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    A focused, minimalist platform for problem solvers. Ask anything with typed explanations, 
                    diagram photos, or video walkthroughs.
                  </p>
                </div>

                {/* Quick Filter & Search Bar */}
                <div style={{ 
                  marginTop: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '14px' 
                }}>
                  {/* Search input */}
                  <div className="home-search-wrapper" style={{ position: 'relative', maxWidth: '640px' }}>
                    <Search 
                      size={18} 
                      style={{ 
                        position: 'absolute', 
                        left: '16px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: 'var(--text-muted)' 
                      }} 
                    />
                    <input
                      type="text"
                      placeholder="Search questions by keyword, topic, or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '48px' }}
                    />
                  </div>

                  {/* Subject Field Chips with Carousel Controls */}
                  <div className="subject-chips-outer-wrapper">
                    {canScrollLeft && (
                      <div className="chips-arrow-fade chips-fade-left">
                        <button
                          type="button"
                          onClick={() => handleChipsScroll('left')}
                          className="chips-double-arrow-btn"
                          aria-label="Previous categories"
                          title="Previous categories"
                        >
                          <ChevronsLeft size={18} strokeWidth={2.4} />
                        </button>
                      </div>
                    )}

                    <div
                      ref={chipsRef}
                      className="subject-chips-container"
                    >
                      {['All', ...availableFields].map((f) => {
                        const isSelected = selectedField === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setSelectedField(f)}
                            className={`subject-chip-btn ${isSelected ? 'is-selected' : ''}`}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>

                    {canScrollRight && (
                      <div className="chips-arrow-fade chips-fade-right">
                        <button
                          type="button"
                          onClick={() => handleChipsScroll('right')}
                          className="chips-double-arrow-btn"
                          aria-label="More categories"
                          title="More categories"
                        >
                          <ChevronsRight size={18} strokeWidth={2.4} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Questions Feed Container */}
            <section className="app-container" style={{ marginTop: '32px' }}>
              <div className="questions-feed-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedField === 'All' ? 'Recent Questions' : `${selectedField} Questions`}
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {questions.length} {questions.length === 1 ? 'question' : 'questions'} available
                </span>
              </div>

              {isLoading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading educational repository...
                </div>
              ) : questions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: 'var(--bg-subtle)', 
                    margin: '0 auto 16px auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <BookOpen size={28} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    No questions found in this category
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                    Be the first to post a question or inquiry. Attach photos of textbook problems, handwritten equations, or video explanations.
                  </p>
                  <button 
                    onClick={() => {
                      if (!user) window.location.href = '/login';
                      else setIsAskModalOpen(true);
                    }} 
                    className="btn btn-primary"
                  >
                    Post the First Question
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {questions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      isAdmin={user?.role === 'admin'}
                      onDelete={handleAdminDeleteQuestion}
                      onViewQuestion={(questionId, initialTab) => {
                        setViewerState({
                          isOpen: true,
                          questionId,
                          initialTab: initialTab || 'question',
                        });
                      }}
                      onAddSolution={(questionId, title) => {
                        if (!user) {
                          window.location.href = '/login';
                        } else {
                          setSolutionModalData({ isOpen: true, questionId, title });
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Dedicated Question & Solution Viewer Interface */}
      <QuestionViewerModal
        isOpen={viewerState.isOpen}
        questionId={viewerState.questionId}
        initialTab={viewerState.initialTab}
        currentUser={user}
        onClose={() => setViewerState({ isOpen: false, questionId: null, initialTab: 'question' })}
        onQuestionDeleted={loadQuestions}
        onOpenAddSolution={(qId, qTitle) => {
          if (!user) {
            window.location.href = '/login';
          } else {
            setSolutionModalData({ isOpen: true, questionId: qId, title: qTitle });
          }
        }}
      />

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        onQuestionCreated={loadQuestions}
      />

      {/* Add Solution Modal */}
      <AddSolutionModal
        isOpen={solutionModalData.isOpen}
        questionId={solutionModalData.questionId}
        questionTitle={solutionModalData.title}
        onClose={() => {
          setSolutionModalData({ isOpen: false, questionId: '', title: '' });
          loadQuestions();
        }}
        onSolutionAdded={loadQuestions}
      />
    </div>
  );
}
