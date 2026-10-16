'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  HelpCircle, 
  AlertCircle, 
  UploadCloud, 
  CheckCircle2,
  Trash2,
  Search,
  ChevronDown,
  Check
} from 'lucide-react';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionCreated: () => void;
}

const FIELDS = [
  'Personal Finance',
  'Investing & Crypto',
  'Entrepreneurship',
  'Digital Marketing',
  'Career Advice',
  'Freelancing',
  'E-commerce',
  'Biology and Life Science',
  'Biology & Life Sciences',
  'History',
  'Literature & Writing',
  'Languages',
  'Languages & Linguistics',
  'Philosophy',
  'Physical Fitness',
  'Nutrition',
  'Nutrition & Diet',
  'Skincare & Beauty',
  'Parenting',
  'Pets & Vet Care',
  'Cooking',
  'Cooking & Baking',
  'Gaming',
  'Movies & TV Shows',
  'Music',
  'Photography & Videography',
  'Anime and Manga',
  'Anime & Manga',
  'Graphic Design & Illustration',
  'Fashion',
  'Fashion & Style',
  'Travel & Backpacking',
  'Gardening',
  'DIY & Crafting',
  'Automotive',
  'Sports',
  'Board Games & Chess',
  'Legal Advice',
  'Current Events',
  'Sociology',
  'Environmental Science',
  'Real Estate & Housing',
  'Self-Improvement',
  'General Trivia',
  'Physics',
  'Chemistry',
  'Maths',
  'Computer',
  'Psychology',
];

export default function AskQuestionModal({ isOpen, onClose, onQuestionCreated }: AskQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [field, setField] = useState('Physics');
  const [fieldSearch, setFieldSearch] = useState('Physics');
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFieldDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFields = FIELDS.filter((f) =>
    f.toLowerCase().includes(fieldSearch.toLowerCase().trim())
  );

  // Reset highlightedIndex when search text changes
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [fieldSearch]);

  // Scroll active option into view when navigating with arrow keys
  React.useEffect(() => {
    if (isFieldDropdownOpen && listRef.current && highlightedIndex >= 0) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isFieldDropdownOpen]);

  // Keyboard navigation for dropdown
  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isFieldDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsFieldDropdownOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredFields.length === 0) return;
      setHighlightedIndex((prev) => (prev < filteredFields.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredFields.length === 0) return;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredFields.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFields.length > 0) {
        const chosen = filteredFields[highlightedIndex] || filteredFields[0];
        if (chosen) {
          setField(chosen);
          setFieldSearch(chosen);
          setIsFieldDropdownOpen(false);
        }
      } else if (fieldSearch.trim()) {
        setField(fieldSearch.trim());
        setIsFieldDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFieldDropdownOpen(false);
    } else if (e.key === 'Tab') {
      if (filteredFields.length > 0) {
        const chosen = filteredFields[highlightedIndex] || filteredFields[0];
        if (chosen) {
          setField(chosen);
          setFieldSearch(chosen);
        }
      }
      setIsFieldDropdownOpen(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a question title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          field,
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
        throw new Error(data.error || 'Failed to publish question');
      }

      // Reset form
      setTitle('');
      setContent('');
      setImageUrl(null);
      setVideoUrl(null);
      onQuestionCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'var(--bg-accent-subtle)', 
              color: 'var(--color-accent)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Ask a Question
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Post inquiries regarding any educational field
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon-only" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Searchable Academic Field Selector */}
          <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span>Subject / Field of Study</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                Type a few letters to filter subjects
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="Type to filter (e.g. Physics, Investing, Gaming, Maths)..."
                value={fieldSearch}
                onChange={(e) => {
                  setFieldSearch(e.target.value);
                  setField(e.target.value);
                  setIsFieldDropdownOpen(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => {
                  setIsFieldDropdownOpen(true);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleFieldKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isFieldDropdownOpen}
                aria-controls="fields-listbox"
                aria-activedescendant={
                  isFieldDropdownOpen && filteredFields.length > 0
                    ? `field-option-${highlightedIndex}`
                    : undefined
                }
                required
              />
              <button
                type="button"
                onClick={() => setIsFieldDropdownOpen((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
                aria-label="Toggle subjects dropdown"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Filtered Dropdown list */}
            {isFieldDropdownOpen && (
              <div
                ref={listRef}
                id="fields-listbox"
                role="listbox"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  marginTop: '4px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {filteredFields.length > 0 ? (
                  filteredFields.map((f, index) => {
                    const isSelected = field.toLowerCase() === f.toLowerCase();
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <div
                        key={f}
                        id={`field-option-${index}`}
                        role="option"
                        aria-selected={isSelected || isHighlighted}
                        onClick={() => {
                          setField(f);
                          setFieldSearch(f);
                          setIsFieldDropdownOpen(false);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        style={{
                          padding: '10px 14px',
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          background: isHighlighted
                            ? 'var(--bg-card-hover)'
                            : isSelected
                            ? 'var(--bg-subtle)'
                            : 'transparent',
                          color: isHighlighted
                            ? 'var(--color-primary)'
                            : isSelected
                            ? 'var(--color-accent)'
                            : 'var(--text-primary)',
                          fontWeight: isSelected || isHighlighted ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--border-light)',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <span>{f}</span>
                        {isSelected && <Check size={14} style={{ color: 'var(--color-accent)' }} />}
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: '12px 14px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                    }}
                  >
                    No predefined match. Press Enter to use custom: "<strong>{fieldSearch}</strong>"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Question Title */}
          <div className="form-group">
            <label className="form-label">Question Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. How does quantum entanglement violate Bell's inequalities?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Question Body / Description (Optional) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Description / Additional Details</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Optional</span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Add optional details, context, equations, or steps you have already tried..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          {/* Attachment Controls */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Media Attachments (Photo or Video)
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
                disabled={isUploading}
              >
                <ImageIcon size={16} style={{ color: 'var(--color-primary)' }} />
                <span>{imageUrl ? 'Replace Photo' : 'Attach Photo / Diagram'}</span>
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
                disabled={isUploading}
              >
                <Video size={16} style={{ color: 'var(--color-chemistry)' }} />
                <span>{videoUrl ? 'Replace Video' : 'Attach Video Walkthrough'}</span>
              </button>
            </div>

            {isUploading && (
              <div style={{ fontSize: '13px', color: 'var(--color-accent)', marginTop: '10px' }}>
                Uploading media attachment, please wait...
              </div>
            )}

            {/* Media Previews */}
            {imageUrl && (
              <div className="media-preview-container" style={{ position: 'relative' }}>
                <img src={imageUrl} alt="Question preview" className="media-image" />
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
              <div className="media-preview-container" style={{ position: 'relative' }}>
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Publishing...' : 'Publish Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
