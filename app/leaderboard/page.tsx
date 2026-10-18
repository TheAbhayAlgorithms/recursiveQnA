'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import LeaderboardDashboard from '@/components/LeaderboardDashboard';
import QuestionViewerModal from '@/components/QuestionViewerModal';
import AskQuestionModal from '@/components/AskQuestionModal';
import AddSolutionModal from '@/components/AddSolutionModal';

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null);

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
    initialTab: 'solutions',
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

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
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
        <LeaderboardDashboard
          currentUser={user}
          onViewQuestion={(questionId, initialTab) => {
            setViewerState({
              isOpen: true,
              questionId,
              initialTab: initialTab || 'solutions',
            });
          }}
          onSwitchToQuestions={() => {
            window.location.href = '/';
          }}
        />
      </main>

      {/* Dedicated Question & Solution Viewer Interface */}
      <QuestionViewerModal
        isOpen={viewerState.isOpen}
        questionId={viewerState.questionId}
        initialTab={viewerState.initialTab}
        currentUser={user}
        onClose={() => setViewerState({ isOpen: false, questionId: null, initialTab: 'solutions' })}
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
        onQuestionCreated={() => {
          window.location.href = '/';
        }}
      />

      {/* Add Solution Modal */}
      <AddSolutionModal
        isOpen={solutionModalData.isOpen}
        questionId={solutionModalData.questionId}
        questionTitle={solutionModalData.title}
        onClose={() => {
          setSolutionModalData({ isOpen: false, questionId: '', title: '' });
        }}
        onSolutionAdded={() => {
          setSolutionModalData({ isOpen: false, questionId: '', title: '' });
        }}
      />
    </div>
  );
}
