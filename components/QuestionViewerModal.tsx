'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Copy, 
  Check, 
  PlusCircle, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  AlertCircle
} from 'lucide-react';
import AddSolutionModal from './AddSolutionModal';
import { formatDate } from '@/lib/formatDate';

interface QuestionViewerModalProps {
  isOpen: boolean;
  questionId: string | null;
  initialTab?: 'question' | 'solutions';
  currentUser: any;
  onClose: () => void;
  onQuestionDeleted?: () => void;
  onOpenAddSolution?: (qId: string, qTitle: string) => void;
}

export default function QuestionViewerModal({
  isOpen,
  questionId,
  initialTab = 'solutions',
  currentUser,
  onClose,
  onQuestionDeleted,
  onOpenAddSolution
}: QuestionViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'question' | 'solutions'>(initialTab);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link copied state
  const [copied, setCopied] = useState(false);

  // Lightbox preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sub-modal for solution
  const [isAddSolutionOpen, setIsAddSolutionOpen] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, questionId]);

  const loadDetails = async () => {
    if (!questionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}`);
      if (!res.ok) {
        throw new Error('Question not found or removed');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load question details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && questionId) {
      loadDetails();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, questionId]);

  if (!isOpen || !questionId) return null;

  const isAdmin = currentUser?.role === 'admin';
  const question = data?.question;
  const solutions = data?.solutions || [];

  const handleCopyLink = () => {
    const targetUrl = `${window.location.origin}/question/${questionId}`;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdminDeleteQuestion = async () => {
    if (!confirm('Are you sure you want to permanently delete this question? Only administrators can perform deletions.')) {
      return;
    }

    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        onClose();
        if (onQuestionDeleted) onQuestionDeleted();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete question');
      }
    } catch {
      alert('Error deleting question');
    }
  };

  const handleAdminDeleteSolution = async (solutionId: string) => {
    if (!confirm('Delete this solution? Only administrators can perform deletions.')) return;
    try {
      const res = await fetch(`/api/solutions/${solutionId}`, { method: 'DELETE' });
      if (res.ok) {
        loadDetails();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete solution');
      }
    } catch {
      alert('Error deleting solution');
    }
  };

  const handleToggleVerify = async (solutionId: string, currentStatus: number) => {
    try {
      const res = await fetch(`/api/solutions/${solutionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: currentStatus === 0 }),
      });
      if (res.ok) loadDetails();
    } catch {
      alert('Error updating verification status');
    }
  };

  return (
    <>
      <div 
        className="modal-overlay" 
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ zIndex: 250, padding: '16px' }}
      >
        <div 
          className="modal-content" 
          style={{ 
            maxWidth: '820px', 
            maxHeight: '92vh', 
            display: 'flex', 
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          {/* Top Modal Header */}
          <div className="modal-header viewer-modal-header" style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
              {question?.field && (
                <span className={`field-badge badge-${question.field.replace(/[^a-zA-Z0-9]/g, '')}`}>
                  {question.field}
                </span>
              )}
              <span className="viewer-header-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Academic Solutions & Problem Details
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={handleCopyLink}
                className="btn btn-secondary btn-sm"
                title="Copy shareable link"
              >
                {copied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                <span className="viewer-btn-label">{copied ? 'Copied' : 'Share'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleAdminDeleteQuestion}
                  className="btn btn-danger-outline btn-sm"
                  title="Admin delete question"
                >
                  <Trash2 size={14} />
                  <span className="viewer-btn-label">Delete</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="btn-icon-only"
                style={{ width: '32px', height: '32px' }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="viewer-tabs-bar" style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            borderBottom: '1px solid var(--border-light)',
            padding: '0 16px',
            gap: '8px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('solutions')}
              className={`viewer-tab-btn ${activeTab === 'solutions' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === 'solutions' ? 'var(--color-accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'solutions' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Solutions ({solutions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('question')}
              className={`viewer-tab-btn ${activeTab === 'question' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === 'question' ? 'var(--color-accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'question' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap'
              }}
            >
              <BookOpen size={16} />
              <span>Problem Details</span>
            </button>
          </div>

          {/* Modal Body Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading solutions and problem details...
              </div>
            ) : error ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-danger)' }}>
                <AlertCircle size={28} style={{ margin: '0 auto 10px auto' }} />
                <p>{error}</p>
              </div>
            ) : question ? (
              <>
                {/* TAB 1: SOLUTIONS */}
                {activeTab === 'solutions' && (
                  <div>
                    {/* Top Action Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Submitted Solutions ({solutions.length})
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          Step-by-step proofs, calculations, and walkthroughs
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUser) window.location.href = '/login';
                          else setIsAddSolutionOpen(true);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <PlusCircle size={14} />
                        <span>Add Solution</span>
                      </button>
                    </div>

                    {solutions.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '48px 20px', 
                        background: 'var(--bg-subtle)', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed var(--border-color)'
                      }}>
                        <CheckCircle2 size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          No solutions submitted yet
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 16px auto' }}>
                          Do you know how to solve this problem? Share your explanation, diagram, or video solution!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser) window.location.href = '/login';
                            else setIsAddSolutionOpen(true);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Submit First Solution
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {solutions.map((sol: any, idx: number) => (
                          <div 
                            key={sol.id}
                            style={{ 
                              padding: '20px', 
                              borderRadius: 'var(--radius-md)', 
                              background: 'var(--bg-card)', 
                              border: sol.is_verified === 1 ? '1.5px solid var(--color-success)' : '1px solid var(--border-light)',
                              boxShadow: sol.is_verified === 1 ? '0 2px 10px rgba(16, 185, 129, 0.1)' : 'var(--shadow-sm)'
                            }}
                          >
                            {/* Solution Card Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                  width: '28px', 
                                  height: '28px', 
                                  borderRadius: '50%', 
                                  background: sol.user_role === 'admin' ? 'var(--color-danger)' : 'var(--color-success)', 
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '11px'
                                }}>
                                  {sol.user_name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                                  {sol.user_name}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  • {formatDate(sol.created_at)}
                                </span>
                                {sol.is_verified === 1 && (
                                  <span style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px', 
                                    padding: '2px 8px', 
                                    borderRadius: 'var(--radius-full)', 
                                    background: 'var(--color-success-bg)', 
                                    color: 'var(--color-success)', 
                                    fontSize: '10px', 
                                    fontWeight: 700 
                                  }}>
                                    <CheckCircle2 size={12} />
                                    VERIFIED
                                  </span>
                                )}
                              </div>

                              {/* Moderation Controls */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {(isAdmin || currentUser?.id === question.user_id) && (
                                  <button
                                    onClick={() => handleToggleVerify(sol.id, sol.is_verified)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '12px', height: '28px', padding: '0 8px' }}
                                    title="Toggle verified badge"
                                  >
                                    <CheckCircle2 size={12} />
                                    <span>{sol.is_verified === 1 ? 'Unverify' : 'Verify'}</span>
                                  </button>
                                )}

                                {isAdmin && (
                                  <button
                                    onClick={() => handleAdminDeleteSolution(sol.id)}
                                    className="btn btn-danger-outline btn-sm"
                                    style={{ fontSize: '12px', height: '28px', padding: '0 8px' }}
                                    title="Admin delete solution"
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Solution Text */}
                            <div style={{ 
                              fontSize: '15px', 
                              lineHeight: 1.7, 
                              color: 'var(--text-primary)', 
                              whiteSpace: 'pre-wrap', 
                              marginBottom: '14px' 
                            }}>
                              {sol.content}
                            </div>

                            {/* Attached diagram */}
                            {sol.image_url && (
                              <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                  Solution Diagram / Handwritten Steps:
                                </div>
                                <div 
                                  className="media-preview-container"
                                  onClick={() => setPreviewImage(sol.image_url)}
                                  style={{ cursor: 'zoom-in', maxHeight: '360px' }}
                                >
                                  <img src={sol.image_url} alt="Solution diagram" className="media-image" />
                                </div>
                              </div>
                            )}

                            {/* Attached video */}
                            {sol.video_url && (
                              <div style={{ marginTop: '12px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                  Solution Video Walkthrough:
                                </div>
                                <div className="media-preview-container">
                                  <video src={sol.video_url} controls className="media-video" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PROBLEM DETAILS */}
                {activeTab === 'question' && (
                  <div>
                    {/* Header info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: question.user_role === 'admin' ? 'var(--color-danger)' : 'var(--color-primary)', 
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}>
                          {question.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {question.user_name}
                            {question.user_role === 'admin' && (
                              <span style={{ fontSize: '10px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>
                                Admin
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {question.user_field || 'Academic Learner'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Clock size={13} />
                        <span>{formatDate(question.created_at)}</span>
                      </div>
                    </div>

                    {/* Question Title */}
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.35 }}>
                      {question.title}
                    </h2>

                    {/* Question Content (if provided) */}
                    {question.content && question.content.trim() ? (
                      <div style={{ 
                        fontSize: '15px', 
                        lineHeight: 1.7, 
                        color: 'var(--text-primary)', 
                        whiteSpace: 'pre-wrap',
                        marginBottom: '20px'
                      }}>
                        {question.content}
                      </div>
                    ) : null}

                    {/* Photo Attachment */}
                    {question.image_url && (
                      <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Attached Diagram / Problem Photo:
                        </div>
                        <div 
                          className="media-preview-container"
                          onClick={() => setPreviewImage(question.image_url)}
                          style={{ cursor: 'zoom-in', maxHeight: '420px' }}
                        >
                          <img src={question.image_url} alt="Attached diagram" className="media-image" />
                        </div>
                      </div>
                    )}

                    {/* Video Attachment */}
                    {question.video_url && (
                      <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Attached Video Walkthrough:
                        </div>
                        <div className="media-preview-container">
                          <video src={question.video_url} controls className="media-video" />
                        </div>
                      </div>
                    )}

                    {/* Bottom CTA to View Solutions */}
                    <div style={{ 
                      marginTop: '24px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('solutions')}
                        className="btn btn-secondary btn-sm"
                      >
                        <CheckCircle2 size={14} />
                        <span>View Solutions ({solutions.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUser) window.location.href = '/login';
                          else setIsAddSolutionOpen(true);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <PlusCircle size={14} />
                        <span>Add Solution</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Sub-modal: Add Solution */}
      {isAddSolutionOpen && question && (
        <AddSolutionModal
          isOpen={isAddSolutionOpen}
          questionId={questionId}
          questionTitle={question.title}
          onClose={() => setIsAddSolutionOpen(false)}
          onSolutionAdded={() => {
            loadDetails();
            setActiveTab('solutions');
          }}
        />
      )}

      {/* Lightbox for zooming attached diagrams */}
      {previewImage && (
        <div 
          className="modal-overlay" 
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 400, background: 'rgba(0,0,0,0.85)' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={previewImage} 
              alt="Enlarged diagram" 
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} 
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                color: 'white',
                fontSize: '16px',
                fontWeight: 700,
                background: 'none',
                cursor: 'pointer'
              }}
            >
              Close ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
