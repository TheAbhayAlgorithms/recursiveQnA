'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { 
  PlusCircle, 
  ShieldAlert, 
  GraduationCap, 
  LogOut, 
  LogIn, 
  UserPlus,
  BookOpen,
  ChevronDown,
  Mail,
  Phone,
  Trophy
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
  field_of_interest?: string;
}

interface NavbarProps {
  user: User | null;
  onOpenAskModal?: () => void;
  onLogout?: () => void;
}

export default function Navbar({ user, onOpenAskModal, onLogout }: NavbarProps) {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const totalScroll = doc.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) {
        setScrollPercentage(0);
        return;
      }
      const scrolled = window.scrollY || doc.scrollTop;
      const pct = Math.min(100, Math.max(0, (scrolled / totalScroll) * 100));
      setScrollPercentage(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);
  return (
    <>
      <header className="nav-header">
        <div className="app-container nav-inner">
          {/* Brand */}
          <Link href="/" className="brand-logo">
            <div className="brand-icon">
              <GraduationCap size={20} />
            </div>
            <div className="brand-text-wrapper">
              <span className="brand-title">RecursiveQnA</span>
              <span className="brand-subtitle">ACADEMIA Q&A</span>
            </div>
          </Link>

          {/* Right Navigation & Controls */}
          <div className="nav-actions">
            {/* Day / Night Theme Toggle */}
            <ThemeToggle />

            {/* Ask Question CTA */}
            <button 
              onClick={onOpenAskModal}
              className="btn btn-primary nav-ask-btn"
              title="Ask Question"
            >
              <PlusCircle size={16} />
              <span className="nav-btn-full">Ask Question</span>
              <span className="nav-btn-compact">Ask</span>
            </button>

            {/* Leaderboard CTA */}
            <Link 
              href="/leaderboard"
              className="btn btn-secondary nav-leaderboard-btn"
              title="Solutions Leaderboard"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Trophy size={16} style={{ color: '#f59e0b' }} />
              <span className="nav-btn-full">Leaderboard</span>
              <span className="nav-btn-compact">Ranks</span>
            </Link>

            {/* Admin Dashboard Link (Only visible if Admin) */}
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className="btn btn-secondary nav-admin-btn" 
                style={{ borderColor: 'var(--color-primary)' }}
                title="Admin Panel"
              >
                <ShieldAlert size={16} style={{ color: 'var(--color-primary)' }} />
                <span className="nav-btn-full">Admin Panel</span>
                <span className="nav-btn-compact">Admin</span>
              </Link>
            )}

            {/* User Status / Login Buttons with Profile Menu */}
            {user ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="nav-user-badge"
                  style={{ cursor: 'pointer', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}
                  aria-expanded={isProfileOpen}
                  aria-label="User profile menu"
                >
                  <div 
                    className="nav-user-avatar"
                    style={{ 
                      background: user.role === 'admin' ? 'var(--color-danger)' : 'var(--color-primary)', 
                      color: 'white'
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="nav-user-info">
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{user.name}</div>
                    <div style={{ fontSize: '10px', color: user.role === 'admin' ? 'var(--color-danger)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {user.role === 'admin' ? 'Administrator' : `@${user.id}`}
                    </div>
                  </div>
                  <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '2px', transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '16px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* User Summary */}
                    <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{user.id}</div>
                      {user.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                          <Mail size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <Phone size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Role badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Account Role:</span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-full)',
                        background: user.role === 'admin' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                        color: user.role === 'admin' ? 'var(--color-danger)' : 'var(--color-accent)'
                      }}>
                        {user.role === 'admin' ? 'Administrator' : 'Scholar'}
                      </span>
                    </div>

                    {/* Solutions & Rankings link */}
                    <Link
                      href="/leaderboard"
                      onClick={() => setIsProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-subtle)',
                        textDecoration: 'none',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      <Trophy size={14} style={{ color: '#f59e0b' }} />
                      <span>Solutions & Rankings</span>
                    </Link>

                    {/* Sign out button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="btn btn-outline"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        padding: '8px 12px',
                        color: 'var(--color-danger)',
                        borderColor: 'rgba(220, 38, 38, 0.25)',
                        marginTop: '4px'
                      }}
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <Link href="/login" className="btn btn-primary nav-auth-btn" style={{ fontSize: '13px', padding: '7px 16px', fontWeight: 600 }}>
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator directly below navbar */}
        <div 
          className="nav-scroll-indicator-container"
          role="progressbar"
          aria-valuenow={Math.round(scrollPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Page scroll progress"
        >
          <div 
            className="nav-scroll-indicator-bar"
            style={{ width: `${scrollPercentage}%` }}
          />
        </div>
      </header>
      {/* Document flow spacer to account for fixed navbar height */}
      <div className="nav-header-spacer" aria-hidden="true" />
    </>
  );
}
