'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  CheckCircle2, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Clock, 
  User,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  PlusCircle,
  Eye
} from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

interface Question {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  field: string;
  image_url: string | null;
  video_url: string | null;
  created_at: number;
  user_role?: 'admin' | 'user';
  solutions_count: number;
  thoughts_count: number;
  verified_solutions_count?: number;
}

interface QuestionCardProps {
  question: Question;
  isAdmin?: boolean;
  onDelete?: (questionId: string) => void;
  onAddSolution?: (questionId: string, title: string) => void;
  onViewQuestion?: (questionId: string, initialTab?: 'question' | 'solutions') => void;
}

export default function QuestionCard({ 
  question, 
  isAdmin, 
  onDelete,
  onAddSolution,
  onViewQuestion
}: QuestionCardProps) {
  const formattedDate = formatDate(question.created_at);

  const getBadgeClass = (field: string) => {
    const clean = field.replace(/[^a-zA-Z0-9]/g, '');
    return `field-badge badge-${clean}`;
  };

  const handleOpenViewer = (tab: 'question' | 'solutions' = 'question') => {
    if (onViewQuestion) {
      onViewQuestion(question.id, tab);
    }
  };

  return (
    <article className="card question-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Info */}
      <div className="card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={getBadgeClass(question.field)}>
            {question.field}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            <Clock size={13} style={{ flexShrink: 0 }} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Admin Delete Action (Exclusive to Admin) */}
        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(question.id)}
            className="btn btn-danger-outline btn-sm"
            title="Admin deletion - permanently purge this question"
          >
            <Trash2 size={13} />
            <span>Delete (Admin)</span>
          </button>
        )}
      </div>

      {/* Question Title & Content */}
      <div>
        <h3 
          className="card-question-title"
          onClick={() => handleOpenViewer('question')}
          style={{ 
            fontSize: '17.5px', 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            marginBottom: '6px',
            lineHeight: 1.35,
            cursor: 'pointer',
            transition: 'color var(--transition-fast)',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        >
          {question.title}
        </h3>

        {question.content && question.content.trim() ? (
          <p 
            className="card-question-content"
            onClick={() => handleOpenViewer('question')}
            style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.55,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              cursor: 'pointer',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}
          >
            {question.content}
          </p>
        ) : null}
      </div>

      {/* Media Badges / Previews if present */}
      {(question.image_url || question.video_url) && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {question.image_url && (
            <button
              type="button"
              onClick={() => handleOpenViewer('question')}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                color: 'var(--color-primary)',
                fontWeight: 600,
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              <ImageIcon size={14} />
              <span>Diagram / Photo Attached</span>
            </button>
          )}
          {question.video_url && (
            <button
              type="button"
              onClick={() => handleOpenViewer('question')}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12px', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                color: 'var(--color-chemistry)',
                fontWeight: 600,
                border: '1px solid var(--border-light)',
                cursor: 'pointer'
              }}
            >
              <Video size={14} />
              <span>Video Walkthrough Attached</span>
            </button>
          )}
        </div>
      )}

      {/* Footer: Author, Solutions, Thoughts, and Action Buttons */}
      <div className="card-footer">
        {/* Author info */}
        <div className="card-footer-author">
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: question.user_role === 'admin' ? 'var(--color-danger)' : 'var(--bg-subtle)',
            color: question.user_role === 'admin' ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            flexShrink: 0
          }}>
            {question.user_name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{question.user_name}</span>
          {question.user_role === 'admin' && (
            <span style={{ 
              fontSize: '10px', 
              background: 'var(--color-danger-bg)', 
              color: 'var(--color-danger)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              Admin
            </span>
          )}
        </div>

        {/* Action Controls: strictly the 3 options requested */}
        <div className="card-action-bar">
          {/* Option 1: Number of solutions showing */}
          <div 
            className={`solutions-count-badge ${(question.verified_solutions_count || 0) > 0 ? 'has-verified' : ''}`}
            title={`${question.solutions_count} solutions recorded`}
          >
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{question.solutions_count} {question.solutions_count === 1 ? 'Solution' : 'Solutions'}</span>
          </div>

          {/* Option 2: View Solution */}
          <button 
            type="button"
            onClick={() => handleOpenViewer('solutions')}
            className="btn btn-secondary btn-sm card-action-btn"
            title="View submitted solutions for this question"
          >
            <Eye size={14} style={{ flexShrink: 0 }} />
            <span>View Solution</span>
          </button>

          {/* Option 3: Add Solution */}
          {onAddSolution && (
            <button
              type="button"
              onClick={() => onAddSolution(question.id, question.title)}
              className="btn btn-primary btn-sm card-action-btn"
              title="Add a solution"
            >
              <PlusCircle size={14} style={{ flexShrink: 0 }} />
              <span>Add Solution</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
