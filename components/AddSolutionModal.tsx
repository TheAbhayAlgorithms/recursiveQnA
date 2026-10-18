'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

interface AddSolutionModalProps {
  isOpen: boolean;
  questionId: string;
  questionTitle: string;
  onClose: () => void;
  onSolutionAdded: () => void;
}

type VerificationStatus = 'idle' | 'saving' | 'checking' | 'correct' | 'incorrect' | 'unsure';

export default function AddSolutionModal({
  isOpen,
  questionId,
  questionTitle,
  onClose,
  onSolutionAdded,
}: AddSolutionModalProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification flow state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [submittedSolutionId, setSubmittedSolutionId] = useState<string | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload media');
      }

      if (type === 'image') {
        setImageUrl(data.url);
      } else {
        setVideoUrl(data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Media upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Perform AI verification with backend
  const verifySolutionWithAI = async (solutionId: string) => {
    setVerificationStatus('checking');
    setError(null);
    setRateLimitMessage(null);

    try {
      const verifyRes = await fetch('/api/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerId: solutionId }),
      });

      if (verifyRes.status === 429) {
        const rateData = await verifyRes.json();
        setRateLimitMessage(rateData.error || 'Rate limit reached: Max 5 checks per question per hour.');
        setVerificationStatus('unsure');
        return;
      }

      const verifyData = await verifyRes.json();

      if (verifyData.verdict === 'correct') {
        setVerificationStatus('correct');
        onSolutionAdded();
      } else if (verifyData.verdict === 'incorrect') {
        setVerificationStatus('incorrect');
        onSolutionAdded();
      } else {
        setVerificationStatus('unsure');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      // NEVER mark incorrect on error
      setVerificationStatus('unsure');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = content.trim();

    if (!cleanContent) {
      setError('Please provide explanation steps or answer details.');
      return;
    }

    if (cleanContent.length > 4000) {
      setError('Solution exceeds maximum allowed length of 4000 characters.');
      return;
    }

    setError(null);
    setRateLimitMessage(null);
    setVerificationStatus('saving');

    try {
      let solutionId = submittedSolutionId;

      if (solutionId) {
        // Resubmitting existing answer for re-verification
        const res = await fetch(`/api/solutions/${solutionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: cleanContent,
            imageUrl,
            videoUrl,
          }),
        });

        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update solution');
        }
      } else {
        // Initial submission: save answer first
        const res = await fetch('/api/solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            content: cleanContent,
            imageUrl,
            videoUrl,
          }),
        });

        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit solution');
        }

        solutionId = data.solution?.id;
        setSubmittedSolutionId(solutionId);
      }

      if (solutionId) {
        // Trigger server-side AI verification
        await verifySolutionWithAI(solutionId);
      } else {
        setVerificationStatus('idle');
        onSolutionAdded();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit solution');
      setVerificationStatus('idle');
    }
  };

  const handleClose = () => {
    if (verificationStatus === 'correct' || verificationStatus === 'incorrect') {
      onSolutionAdded();
    }
    setContent('');
    setImageUrl(null);
    setVideoUrl(null);
    setSubmittedSolutionId(null);
    setVerificationStatus('idle');
    setError(null);
    setRateLimitMessage(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '8px', 
              background: 'rgba(37, 99, 235, 0.12)', 
              color: 'var(--color-accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Provide a Solution
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="truncate">
                Replying to: {questionTitle}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-icon-only" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* General Error Alert */}
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Rate Limit Alert */}
          {rateLimitMessage && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-bg)',
              color: 'var(--color-warning)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{rateLimitMessage}</span>
            </div>
          )}

          {/* ========================================================
              AI VERIFICATION STATUS BANNERS
              ======================================================== */}
          {/* 1. Checking State (Spinner) */}
          {verificationStatus === 'checking' && (
            <div style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '18px'
            }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Checking your solution...
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Evaluating academic reasoning and steps with Gemini AI.
                </div>
              </div>
            </div>
          )}

          {/* 2. Correct State */}
          {verificationStatus === 'correct' && (
            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-success-bg)',
              border: '1.5px solid var(--color-success)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              marginBottom: '18px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-success)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--color-success)'
                  }}>
                    Correct
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(5, 150, 105, 0.2)',
                    color: 'var(--color-success)'
                  }}>
                    AI-checked
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Your solution has been evaluated and confirmed correct! This verdict is private to your account.
                </p>
              </div>
            </div>
          )}

          {/* 3. Incorrect State (Resubmission Allowed) */}
          {verificationStatus === 'incorrect' && (
            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-bg)',
              border: '1.5px solid var(--color-danger)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              marginBottom: '18px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-danger)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <X size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--color-danger)'
                  }}>
                    Incorrect
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(220, 38, 38, 0.2)',
                    color: 'var(--color-danger)'
                  }}>
                    AI-checked
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
                  Try again and enter the correct solution.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Your input below remains editable. Revise your reasoning or answer, then click "Resubmit & Check".
                </p>
              </div>
            </div>
          )}

          {/* 4. Unsure / Neutral State */}
          {verificationStatus === 'unsure' && (
            <div style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '18px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Couldn't verify right now, please try again.
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    AI-checked verdict could not be concluded. Answers are never penalized for system delays.
                  </div>
                </div>
              </div>
              {submittedSolutionId && (
                <button
                  type="button"
                  onClick={() => verifySolutionWithAI(submittedSolutionId)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <RefreshCw size={13} />
                  <span>Check again</span>
                </button>
              )}
            </div>
          )}

          {/* Solution Body */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Step-by-Step Explanation / Proof
              </label>
              <span style={{ fontSize: '11px', color: content.length > 3800 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                {content.length}/4000
              </span>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Break down your answer step-by-step. Include key theorems, formulas, or logical deductions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={4000}
              required
              disabled={verificationStatus === 'saving' || verificationStatus === 'checking'}
            />
          </div>

          {/* Attachment Controls */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Solution Media (Diagram, Handwritten Work, or Video Walkthrough)
            </label>

            <div className="modal-upload-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'image');
                }}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="btn btn-secondary"
                disabled={isUploading || verificationStatus === 'saving' || verificationStatus === 'checking'}
              >
                <ImageIcon size={16} style={{ color: 'var(--color-primary)' }} />
                <span>{imageUrl ? 'Change Photo' : 'Attach Photo / Written Work'}</span>
              </button>

              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'video');
                }}
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="btn btn-secondary"
                disabled={isUploading || verificationStatus === 'saving' || verificationStatus === 'checking'}
              >
                <Video size={16} style={{ color: 'var(--color-chemistry)' }} />
                <span>{videoUrl ? 'Change Video' : 'Attach Video Solution'}</span>
              </button>
            </div>

            {isUploading && (
              <div style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '10px' }}>
                Uploading media attachment, please wait...
              </div>
            )}

            {/* Media Previews */}
            {imageUrl && (
              <div className="media-preview-container" style={{ position: 'relative', marginTop: '10px' }}>
                <img src={imageUrl} alt="Solution preview" className="media-image" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '6px',
                    borderRadius: '50%',
                  }}
                  title="Remove image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {videoUrl && (
              <div className="media-preview-container" style={{ position: 'relative', marginTop: '10px' }}>
                <video src={videoUrl} controls className="media-video" />
                <button
                  type="button"
                  onClick={() => setVideoUrl(null)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '6px',
                    borderRadius: '50%',
                    zIndex: 10,
                  }}
                  title="Remove video"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Privacy & Safety Note */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            lineHeight: 1.5
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Private Verification: </span>
            The AI check verdict is visible exclusively to you. Other scholars, question askers, and normal clients will never see your verification verdict.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={handleClose} 
              className="btn btn-outline" 
              disabled={verificationStatus === 'saving' || verificationStatus === 'checking'}
            >
              {verificationStatus === 'correct' ? 'Done' : 'Close'}
            </button>

            {verificationStatus === 'correct' ? (
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn btn-primary"
              >
                Close & View Question
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={
                  isUploading || 
                  verificationStatus === 'saving' || 
                  verificationStatus === 'checking' ||
                  !content.trim()
                }
                style={{ gap: '8px' }}
              >
                {verificationStatus === 'saving' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving solution...</span>
                  </>
                ) : verificationStatus === 'checking' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Checking solution...</span>
                  </>
                ) : verificationStatus === 'incorrect' ? (
                  <>
                    <RotateCcw size={15} />
                    <span>Resubmit & Check</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Post & Verify Solution</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
