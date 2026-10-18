'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AddSolutionModal from '@/components/AddSolutionModal';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  PlusCircle, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Solution modal state
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);

  // Lightbox image
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const d = await res.json();
      setUser(d.user);
    } catch {
      setUser(null);
    }
  };

  const loadQuestionDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}`);
      if (!res.ok) {
        throw new Error('Question not found or removed');
      }
      const d = await res.json();
      setData(d);
    } catch (err: any) {
      setError(err.message || 'Failed to load question details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    loadQuestionDetails();
  }, [questionId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdminDeleteQuestion = async () => {
    if (!confirm('Are you sure you want to permanently delete this question and all its solutions? Only administrators can do this.')) {
      return;
    }

    try {
      const res = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to delete question');
        return;
      }
      router.push('/');
    } catch {
      alert('Error deleting question');
    }
  };

  const handleAdminDeleteSolution = async (solutionId: string) => {
    if (!confirm('Delete this solution? Only administrators can perform deletions.')) return;

    try {
      const res = await fetch(`/api/solutions/${solutionId}`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to delete solution');
        return;
      }
      loadQuestionDetails();
    } catch {
      alert('Error deleting solution');
    }
  };

  const handleToggleVerifySolution = async (solutionId: string, currentStatus: number) => {
    try {
      const res = await fetch(`/api/solutions/${solutionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: currentStatus === 0 }),
      });
      if (res.ok) {
        loadQuestionDetails();
      }
    } catch {
      alert('Error updating solution verification');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading academic question details...
        </div>
      </div>
    );
  }

  if (error || !data?.question) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="app-container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
            Question Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {error || 'The requested question may have been removed or does not exist.'}
          </p>
          <Link href="/" className="btn btn-primary">
            Return to Questions
          </Link>
        </div>
      </div>
    );
  }

  const { question, solutions } = data;
  const isQuestionAuthor = user?.id === question.user_id;
  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        user={user} 
        onOpenAskModal={() => {
          if (!user) router.push('/login');
          else router.push('/?ask=1');
        }}
        onLogout={() => setUser(null)} 
      />

      <main style={{ flex: 1, padding: '32px 0 60px 0' }}>
        <div className="app-container-narrow">
          {/* Top Breadcrumb & Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <Link 
              href="/" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '14px', 
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to all questions</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleCopyLink}
                className="btn btn-secondary btn-sm"
                title="Copy link to this page"
              >
                {copied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                <span>{copied ? 'Link Copied' : 'Share'}</span>
              </button>

              {isAdmin && (
                <button 
                  onClick={handleAdminDeleteQuestion}
                  className="btn btn-danger-outline btn-sm"
                  title="Only admin can delete this question"
                >
                  <Trash2 size={14} />
                  <span>Delete Question (Admin)</span>
                </button>
              )}
            </div>
          </div>

          {/* Question Main Card */}
          <article className="card" style={{ marginBottom: '32px' }}>
            {/* Field & Date Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span className={`field-badge badge-${question.field.replace(/[^a-zA-Z0-9]/g, '')}`}>
                {question.field}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <Clock size={14} />
                <span>{formatDate(question.created_at)}</span>
              </div>
            </div>

            {/* Question Title */}
            <h1 style={{ 
              fontSize: '26px', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              marginBottom: '16px',
              lineHeight: 1.3 
            }}>
              {question.title}
            </h1>

            {/* Author Attribution */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
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
                fontSize: '13px'
              }}>
                {question.user_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Asked by {question.user_name}
                  {question.user_role === 'admin' && (
                    <span style={{ fontSize: '10px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 700 }}>
                      Admin
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Field: {question.user_field || 'Academic Learner'}
                </div>
              </div>
            </div>

            {/* Detailed Question Body (if provided) */}
            {question.content && question.content.trim() ? (
              <div style={{ 
                fontSize: '16px', 
                lineHeight: 1.7, 
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                marginBottom: '20px'
              }}>
                {question.content}
              </div>
            ) : null}

            {/* Attached Photo */}
            {question.image_url && (
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Attached Diagram / Problem Photo:
                </div>
                <div 
                  className="media-preview-container"
                  onClick={() => setPreviewImage(question.image_url)}
                  style={{ cursor: 'zoom-in' }}
                >
                  <img 
                    src={question.image_url} 
                    alt="Problem attachment" 
                    className="media-image" 
                  />
                </div>
              </div>
            )}

            {/* Attached Video */}
            {question.video_url && (
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Attached Video Walkthrough:
                </div>
                <div className="media-preview-container">
                  <video 
                    src={question.video_url} 
                    controls 
                    className="media-video" 
                  />
                </div>
              </div>
            )}
          </article>

          {/* SOLUTIONS SECTION */}
          <section id="solutions" style={{ marginBottom: '40px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Solutions ({solutions.length})
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Step-by-step proofs, calculations, and walkthroughs
                </p>
              </div>

              <button
                onClick={() => {
                  if (!user) router.push('/login');
                  else setIsSolutionModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <PlusCircle size={14} />
                <span>Add Solution</span>
              </button>
            </div>

            {solutions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No solutions posted yet</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 16px auto' }}>
                  Be the first to share an answer, calculation, or video explanation to help resolve this question.
                </p>
                <button 
                  onClick={() => {
                    if (!user) router.push('/login');
                    else setIsSolutionModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <PlusCircle size={14} />
                  <span>Submit Solution</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {solutions.map((sol: any) => (
                  <div 
                    key={sol.id} 
                    className="card"
                    style={{
                      border: sol.is_verified === 1 ? '1.5px solid var(--color-success)' : undefined,
                      boxShadow: sol.is_verified === 1 ? '0 4px 12px rgba(16, 185, 129, 0.12)' : undefined,
                    }}
                  >
                    {/* Solution Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                          fontSize: '12px'
                        }}>
                          {sol.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {sol.user_name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {formatDate(sol.created_at)}
                          </div>
                        </div>

                        {sol.is_verified === 1 && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-success-bg)',
                            color: 'var(--color-success)',
                            fontSize: '11px',
                            fontWeight: 700,
                            marginLeft: '6px'
                          }}>
                            <CheckCircle2 size={13} />
                            <span>VERIFIED SOLUTION</span>
                          </div>
                        )}

                        {/* Author-only AI Verification Badge */}
                        {user?.id === sol.user_id && sol.ai_verdict && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: sol.ai_verdict === 'correct' ? 'var(--color-success-bg)' : sol.ai_verdict === 'incorrect' ? 'var(--color-danger-bg)' : 'var(--bg-subtle)',
                            color: sol.ai_verdict === 'correct' ? 'var(--color-success)' : sol.ai_verdict === 'incorrect' ? 'var(--color-danger)' : 'var(--text-muted)',
                            border: `1px solid ${sol.ai_verdict === 'correct' ? 'rgba(5, 150, 105, 0.3)' : sol.ai_verdict === 'incorrect' ? 'rgba(220, 38, 38, 0.3)' : 'var(--border-light)'}`,
                            fontSize: '11px',
                            fontWeight: 700,
                            marginLeft: '6px'
                          }}>
                            {sol.ai_verdict === 'correct' ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Correct (AI-checked)</span>
                              </>
                            ) : sol.ai_verdict === 'incorrect' ? (
                              <>
                                <AlertCircle size={13} />
                                <span>Incorrect (AI-checked)</span>
                              </>
                            ) : (
                              <span>AI-checked: Unsure</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Solution Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(isAdmin || isQuestionAuthor) && (
                          <button
                            onClick={() => handleToggleVerifySolution(sol.id, sol.is_verified)}
                            className="btn btn-secondary btn-sm"
                            style={{ height: '28px', padding: '0 8px', fontSize: '12px' }}
                            title="Toggle verified badge"
                          >
                            <CheckCircle2 size={13} />
                            <span>{sol.is_verified === 1 ? 'Unverify' : 'Verify'}</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleAdminDeleteSolution(sol.id)}
                            className="btn btn-danger-outline btn-sm"
                            style={{ height: '28px', padding: '0 8px', fontSize: '12px' }}
                            title="Only admin can delete solutions"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Solution Explanation Text */}
                    <div style={{ 
                      fontSize: '15px', 
                      lineHeight: 1.7, 
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: '14px'
                    }}>
                      {sol.content}
                    </div>

                    {/* Attached Media */}
                    {sol.image_url && (
                      <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Solution Diagram / Handwritten Work:
                        </div>
                        <div 
                          className="media-preview-container"
                          onClick={() => setPreviewImage(sol.image_url)}
                          style={{ cursor: 'zoom-in', maxHeight: '380px' }}
                        >
                          <img src={sol.image_url} alt="Solution attachment" className="media-image" />
                        </div>
                      </div>
                    )}

                    {sol.video_url && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
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
          </section>
        </div>
      </main>

      {/* Add Solution Modal */}
      <AddSolutionModal
        isOpen={isSolutionModalOpen}
        questionId={questionId}
        questionTitle={question.title}
        onClose={() => setIsSolutionModalOpen(false)}
        onSolutionAdded={loadQuestionDetails}
      />

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div 
          className="modal-overlay" 
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 300, background: 'rgba(0,0,0,0.85)' }}
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
    </div>
  );
}
