'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  KeyRound, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.67-5.17 3.67-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/';
  const urlError = searchParams.get('error');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clientOrigin, setClientOrigin] = useState('');

  // Quick Google Config in modal/banner
  const [configClientId, setConfigClientId] = useState('');
  const [configClientSecret, setConfigClientSecret] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Admin password credentials
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const callbackUrl = clientOrigin 
    ? `${clientOrigin}/api/auth/google/callback` 
    : 'http://localhost:3000/api/auth/google/callback';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientOrigin(window.location.origin);
    }

    if (urlError === 'google_not_configured' || urlError === 'google_credentials_missing') {
      setShowGoogleSetup(true);
      setError(null);
    } else if (urlError === 'google_auth_failed') {
      setError('Google authentication was cancelled or could not be completed.');
    } else if (urlError) {
      setError(`Sign-in error: ${urlError}`);
    }

    // Check existing session
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, [urlError]);

  const handleFinishLogin = (userObj: any) => {
    if (redirectParam && redirectParam !== '/') {
      router.push(redirectParam);
    } else if (userObj?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
    router.refresh();
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json().catch(() => ({}));
      
      if (data?.configured) {
        // Automatically jump to Google's official sign-in page!
        window.location.href = `/api/auth/google/login?redirect=${encodeURIComponent(redirectParam)}`;
        return;
      }

      // If credentials not configured yet, show setup guide
      setShowGoogleSetup(true);
      setLoading(false);
    } catch {
      window.location.href = `/api/auth/google/login?redirect=${encodeURIComponent(redirectParam)}`;
    }
  };

  // Save Google OAuth Credentials
  const handleSaveGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configClientId.trim() || !configClientSecret.trim()) {
      setError('Please provide both Google Client ID and Google Client Secret.');
      return;
    }
    setSavingConfig(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/google/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: configClientId.trim(),
          clientSecret: configClientSecret.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save configuration.');
      }

      // Immediately and automatically jump to Google page!
      window.location.href = `/api/auth/google/login?redirect=${encodeURIComponent(redirectParam)}`;
    } catch (err: any) {
      setError(err?.message || 'Failed to save Google configuration.');
      setSavingConfig(false);
    }
  };

  const handleCopyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Administrator Password Login
  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminUserId, password: adminPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify credentials.');
        setLoading(false);
        return;
      }

      handleFinishLogin(data.user);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Header */}
      <header style={{ 
        height: '68px', 
        borderBottom: '1px solid var(--border-light)', 
        background: 'var(--bg-card)', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Link href="/" className="brand-logo">
            <div className="brand-icon">
              <GraduationCap size={22} />
            </div>
            <div>
              <span>RecursiveQnA</span>
              <span style={{ 
                display: 'block', 
                fontSize: '11px', 
                fontWeight: 500, 
                color: 'var(--text-muted)', 
                letterSpacing: '0.04em' 
              }}>
                ACADEMIA Q&A
              </span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <Link href="/" className="btn btn-outline" style={{ fontSize: '13px', padding: '6px 14px' }}>
              Back to Questions
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          
          {/* Card */}
          <div className="card" style={{ padding: '36px 32px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
            
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '16px', 
                background: 'var(--bg-accent-subtle)', 
                color: 'var(--color-accent)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)'
              }}>
                {showPasswordLogin ? <Lock size={26} /> : <ShieldCheck size={28} />}
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                {showPasswordLogin ? 'Administrator Sign In' : 'Sign in with Google'}
              </h1>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {showPasswordLogin 
                  ? 'Sign in using your administrator username and master password.'
                  : 'Access academic discussions, post questions, and share solutions with your Google account.'}
              </p>
            </div>

            {/* Currently authenticated notice */}
            {currentUser && !showPasswordLogin && (
              <div style={{
                marginBottom: '22px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-accent-subtle)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}>
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{currentUser.email || currentUser.id}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFinishLogin(currentUser)}
                  className="btn btn-primary"
                  style={{ fontSize: '12.5px', padding: '6px 14px', height: '34px' }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                padding: '14px 16px', 
                borderRadius: 'var(--radius-md)', 
                background: 'var(--color-danger-bg)', 
                color: 'var(--color-danger)', 
                fontSize: '13px', 
                marginBottom: '20px',
                border: '1px solid rgba(220, 38, 38, 0.2)'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ lineHeight: 1.4 }}>{error}</span>
              </div>
            )}

            {/* Google OAuth Setup Guide Form */}
            {showGoogleSetup && !showPasswordLogin && (
              <div style={{
                marginBottom: '22px',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-accent-subtle)',
                border: '1px solid var(--border-medium)',
                fontSize: '13px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '6px' }}>
                  <KeyRound size={18} />
                  <span>Google Cloud OAuth Setup</span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  To allow the button to jump directly to Google, connect your Google Cloud OAuth Client ID & Secret:
                </p>

                {/* Step Instructions */}
                <div style={{ 
                  background: 'var(--bg-card)', 
                  padding: '12px 14px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border-light)', 
                  marginBottom: '14px' 
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Quick 2-Minute Steps:
                  </div>
                  <ol style={{ paddingLeft: '18px', margin: '0 0 10px 0', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '12.5px' }}>
                    <li>
                      Open{' '}
                      <a 
                        href="https://console.cloud.google.com/apis/credentials" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        Google Cloud Console Credentials <ExternalLink size={11} style={{ display: 'inline' }} />
                      </a>
                    </li>
                    <li>Click <strong>+ CREATE CREDENTIALS</strong> → <strong>OAuth client ID</strong>.</li>
                    <li>Select Application type: <strong>Web application</strong>.</li>
                    <li>Under <strong>Authorized redirect URIs</strong>, paste the URI below:</li>
                  </ol>

                  <div style={{ background: 'var(--bg-main)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <code style={{ fontSize: '11px', wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                      {callbackUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCallbackUrl}
                      title="Copy Redirect URI"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copied ? 'var(--color-success)' : 'var(--color-accent)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Direct Configuration Form */}
                <form onSubmit={handleSaveGoogleConfig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Google Client ID
                    </label>
                    <input
                      type="text"
                      value={configClientId}
                      onChange={(e) => setConfigClientId(e.target.value)}
                      placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                      required
                      className="form-input"
                      style={{ height: '38px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Google Client Secret
                    </label>
                    <input
                      type="password"
                      value={configClientSecret}
                      onChange={(e) => setConfigClientSecret(e.target.value)}
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                      required
                      className="form-input"
                      style={{ height: '38px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="submit"
                      disabled={savingConfig || !configClientId.trim() || !configClientSecret.trim()}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        height: '40px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {savingConfig ? (
                        <>
                          <RefreshCw size={15} style={{ animation: 'spin 1.2s linear infinite' }} />
                          <span>Saving & Jumping to Google...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Save & Jump to Google</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowGoogleSetup(false)}
                      className="btn btn-outline"
                      style={{ height: '40px', fontSize: '13px', padding: '0 14px' }}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Main Google Sign-In Action */}
            {!showPasswordLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading || savingConfig}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    width: '100%',
                    height: '52px',
                    padding: '0 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: loading ? 'default' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    transition: 'all var(--transition-fast)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.12)';
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} style={{ animation: 'spin 1.2s linear infinite', color: 'var(--color-accent)' }} />
                      <span>Opening Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordLogin(true); setError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Admin password login
                  </button>
                </div>
              </div>
            )}

            {/* Fallback: Admin Username & Password Login */}
            {showPasswordLogin && (
              <form onSubmit={handleAdminPasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="admin-userid">Admin Username or Email</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="admin-userid"
                      type="text"
                      value={adminUserId}
                      onChange={(e) => setAdminUserId(e.target.value)}
                      placeholder="admin"
                      required
                      autoFocus
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '46px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="admin-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="form-input"
                      style={{ paddingLeft: '44px', height: '46px' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !adminUserId || !adminPassword}
                  className="btn btn-primary"
                  style={{ height: '46px', fontSize: '14px', fontWeight: 700 }}
                >
                  {loading ? 'Authenticating...' : 'Sign In as Admin'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowPasswordLogin(false); setError(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ← Back to Google sign in
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            <span>Protected by Google Single Sign-On and cryptographic session tokens.</span>
          </div>

        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading authentication...</div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
