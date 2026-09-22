import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { authService } from '../services/auth';

/* ─── Icons ──────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" width="17" height="17">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 21 21" width="17" height="17">
    <rect x="0"  y="0"  width="10" height="10" fill="#F25022"/>
    <rect x="11" y="0"  width="10" height="10" fill="#7FBA00"/>
    <rect x="0"  y="11" width="10" height="10" fill="#00A4EF"/>
    <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
  </svg>
);

/* ─── OTP 6-box input ────────────────────────────────── */
const OTPBoxes = ({ value, onChange, disabled }) => {
  const refs = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);
  const onKey = (e, i) => {
    if (e.key === 'Backspace') {
      const n = [...digits]; n[i] = '';
      onChange(n.join('').replace(/\s/g, ''));
      if (i > 0) refs.current[i - 1]?.focus();
    }
  };
  const onCh = (e, i) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const n = [...digits]; n[i] = ch;
    onChange(n.join('').replace(/\s/g, ''));
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(p);
    refs.current[Math.min(p.length, 5)]?.focus();
  };
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={onPaste}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el => refs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''} onChange={e => onCh(e, i)} onKeyDown={e => onKey(e, i)}
          disabled={disabled}
          style={{
            width: 46, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 800,
            fontFamily: 'system-ui,sans-serif', outline: 'none', borderRadius: 10,
            border: digits[i] ? '2px solid #2563eb' : '1.5px solid #bfdbfe',
            background: digits[i] ? '#eff6ff' : '#f0f6ff',
            color: '#1e3a8a', transition: 'all 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
          onBlur={e => { if (!digits[i]) { e.target.style.borderColor = '#bfdbfe'; e.target.style.boxShadow = 'none'; } }}
        />
      ))}
    </div>
  );
};

/* ─── Input field component ──────────────────────────── */
const Field = ({ label, ...props }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 5, fontFamily: 'system-ui,sans-serif' }}>
      {label}
    </label>
    <input {...props} style={{
      width: '100%', padding: '10px 13px', borderRadius: 9,
      border: '1.5px solid #bfdbfe', fontSize: 14, color: '#0f172a',
      background: '#f8faff', outline: 'none',
      fontFamily: 'system-ui,sans-serif', boxSizing: 'border-box', transition: 'all 0.15s',
    }}
      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#bfdbfe'; e.target.style.background = '#f8faff'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

/* ─── Main Login Page ────────────────────────────────── */
export const Login = () => {
  const navigate = useNavigate();
  const [view,      setView]      = useState('form');
  const [mode,      setMode]      = useState('signup');
  const [firstName, setFN]        = useState('');
  const [lastName,  setLN]        = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [otpDigits, setOtpDigits] = useState('');
  const [otpCode,   setOtpCode]   = useState('');
  const [resend,    setResend]    = useState(0);
  const [expiry,    setExpiry]    = useState(300);
  const [timeLeft,  setTimeLeft]  = useState(300);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [smtpSent,  setSmtpSent]  = useState(false);
  const [devOtp,    setDevOtp]    = useState('');
  const [smtpNotice, setSmtpNotice] = useState('');

  useEffect(() => { authService.logout(); }, []);

  useEffect(() => {
    if (resend <= 0) return;
    const t = setInterval(() => setResend(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [resend]);

  useEffect(() => {
    if (view !== 'otp' || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [view, timeLeft]);

  const finish = (user, token) => { 
    authService.login(user, token); 
    sessionStorage.setItem('dfg_show_login_alert', 'true');
    navigate('/'); 
  };

  const sendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.sendOtp(email.trim(), 'email');
      setExpiry(res.expires_in || 300); 
      setTimeLeft(res.expires_in || 300);
      setResend(60); 
      setOtpDigits('');
      setSmtpSent(!!res.smtp_sent);
      setDevOtp(res.dev_otp || '');
      setSmtpNotice(res.message || '');
      setView('otp');
    } catch (err) {
      const d = err.response?.data;
      if (d?.wait_seconds) setResend(d.wait_seconds);
      setError(d?.error || 'Could not send code. Please try again.');
    } finally { setLoading(false); }
  };

  const signIn = async (e) => {
    e?.preventDefault();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true); setError('');
    try {
      if (password.trim()) { const r = await api.login(email.trim(), password); finish(r.user, r.token); }
      else await sendOtp(e);
    } catch { setPassword(''); await sendOtp(e); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    const code = otpDigits.replace(/\s/g, '');
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      const name = `${firstName} ${lastName}`.trim() || 'New User';
      const res = await api.verifyOtp(email.trim(), code, name, 'Customer');
      if (res.success) finish(res.user, res.token);
    } catch (err) { setError(err.response?.data?.error || 'Incorrect code. Try again.'); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (resend > 0) return;
    setLoading(true); setError('');
    try {
      const res = await api.sendOtp(email.trim(), 'email');
      setExpiry(res.expires_in || 300); 
      setTimeLeft(res.expires_in || 300);
      setResend(60); 
      setOtpDigits('');
      setSmtpSent(!!res.smtp_sent);
      setDevOtp(res.dev_otp || '');
      setSmtpNotice(res.message || '');
    } catch (err) { setError(err.response?.data?.error || 'Could not resend.'); }
    finally { setLoading(false); }
  };

  const socialAuth = async (provider) => {
    setLoading(true); setError('');
    try {
      const res = await api.googleAuth({
        email: `${provider}.${Date.now().toString(36)}@${provider === 'google' ? 'gmail' : 'outlook'}.com`,
        name: `${firstName || provider} ${lastName || 'User'}`.trim(),
        google_id: `${provider}_${Date.now()}`,
      });
      finish(res.user, res.token);
    } catch (err) { setError(err.response?.data?.error || `${provider} sign-in failed.`); }
    finally { setLoading(false); }
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const filled = otpDigits.replace(/\s/g, '').length;

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f6ff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui,-apple-system,sans-serif', padding: '40px 16px',
    }}>
      <style>{`* { box-sizing: border-box; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Large centered brand heading ── */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
          boxShadow: '0 8px 28px rgba(37,99,235,0.35)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9,12 11,14 15,10"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-1.2px' }}>
          DeepFusion<span style={{ color: '#2563eb' }}>Guard</span>
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0, fontWeight: 500 }}>
          AI-powered Cybersecurity SOC Platform
        </p>
      </div>

      {/* ── Large Sign Up / Sign In pill toggle (clean blue theme) ── */}
      {view === 'form' && (
        <div style={{
          display: 'flex',
          background: '#dbeafe',
          borderRadius: 18,
          padding: 5,
          marginBottom: 24,
          width: '100%',
          maxWidth: 420,
          border: '1px solid #bfdbfe',
          boxShadow: '0 2px 10px rgba(37,99,235,0.06)',
        }}>
          {[
            { key: 'signup', label: 'Sign Up' },
            { key: 'signin', label: 'Sign In' }
          ].map(item => {
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => { setMode(item.key); setError(''); }}
                style={{
                  flex: 1,
                  padding: '13px 0',
                  borderRadius: 14,
                  border: 'none',
                  background: active ? '#ffffff' : 'transparent',
                  color: active ? '#1d4ed8' : '#475569',
                  fontWeight: active ? 800 : 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'system-ui,-apple-system,sans-serif',
                  boxShadow: active ? '0 3px 12px rgba(37,99,235,0.12), 0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Auth Card ── */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
          boxShadow: '0 4px 32px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>

          {/* Card header — simple status bar only */}
          <div style={{
            padding: '13px 24px', borderBottom: '1px solid #f3f3f8',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/>
              <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Secure &amp; Online</span>
            </div>
            {view === 'form' && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </span>
            )}
            {view === 'otp' && (
              <button onClick={() => { setView('form'); setError(''); setOtpDigits(''); setOtpCode(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontFamily: 'system-ui,sans-serif' }}>
                ← Back
              </button>
            )}
          </div>

          {/* Card body */}
          <div style={{ padding: '24px 28px 28px' }}>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 10,
                padding: '10px 14px', marginBottom: 16,
                color: '#be123c', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            {/* ═══ FORM ═══ */}
            {view === 'form' && (
              <form onSubmit={mode === 'signup' ? sendOtp : signIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mode === 'signup' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="First name"  type="text" placeholder="Jane"  value={firstName} onChange={e => setFN(e.target.value)}/>
                    <Field label="Last name"   type="text" placeholder="Smith" value={lastName}  onChange={e => setLN(e.target.value)}/>
                  </div>
                )}

                <Field
                  label={mode === 'signup' ? 'Work email address' : 'Email address'}
                  type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />

                {/* Dynamic Role Recognition Notice */}
                {email.trim().toLowerCase() === 'vasudevareddyeevuri@gmail.com' ? (
                  <div style={{
                    background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8,
                    padding: '7px 11px', fontSize: 11, color: '#92400e', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: -4
                  }}>
                    <span>👑</span>
                    <span>Master Admin Recognized: Full SOC Administrative & Customer Audit Privileges.</span>
                  </div>
                ) : email.trim() ? (
                  <div style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
                    padding: '6px 10px', fontSize: 11, color: '#1e40af', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: -4
                  }}>
                    <span>👤</span>
                    <span>Customer Account: Access to Attack Detection & SOC Defense tools.</span>
                  </div>
                ) : null}

                {mode === 'signin' && (
                  <Field
                    label="Password (leave blank to use OTP)"
                    type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                )}

                <button type="submit" disabled={loading || !email.trim()} style={{
                  padding: '12px', borderRadius: 10, border: 'none',
                  background: !loading && email.trim() ? '#2563eb' : '#93c5fd',
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  cursor: !loading && email.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'system-ui,sans-serif', transition: 'all 0.18s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: !loading && email.trim() ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                }}>
                  {loading
                    ? <><span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>◌</span> Sending code…</>
                    : mode === 'signup' ? 'Sign up →' : 'Sign in →'}
                </button>

                {/* Divider */}
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                  <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>Or continue with</span>
                  <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
                </div>

                {/* Social */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { k:'google',    label:'Google',    icon:<GoogleIcon/> },
                    { k:'microsoft', label:'Microsoft', icon:<MicrosoftIcon/> },
                  ].map(({ k, label, icon }) => (
                    <button key={k} type="button" onClick={() => socialAuth(k)} disabled={loading} style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                      padding:'10px', borderRadius:9, border:'1.5px solid #bfdbfe',
                      background:'#fff', color:'#334155', fontWeight:600, fontSize:14,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily:'system-ui,sans-serif', transition:'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#3b82f6'; e.currentTarget.style.background='#eff6ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#bfdbfe'; e.currentTarget.style.background='#fff'; }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>

                <p style={{ textAlign:'center', fontSize:12, color:'#94a3b8', margin:0 }}>
                  {mode === 'signup'
                    ? <>Already have an account?{' '}<button type="button" onClick={() => { setMode('signin'); setError(''); }} style={{ color:'#2563eb', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontSize:12, fontFamily:'system-ui,sans-serif', padding:0 }}>Sign in</button></>
                    : <>No account yet?{' '}<button type="button" onClick={() => { setMode('signup'); setError(''); }} style={{ color:'#2563eb', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontSize:12, fontFamily:'system-ui,sans-serif', padding:0 }}>Sign up free</button></>
                  }
                </p>
              </form>
            )}

            {/* ═══ OTP SCREEN ═══ */}
            {view === 'otp' && (
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:15, color:'#1e293b', fontWeight:700 }}>Enter your verification code</div>
                  <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>
                    Sent to <strong style={{ color:'#1e293b' }}>{email}</strong>
                  </div>
                </div>

                {/* Dynamic Delivery Status */}
                {smtpSent ? (
                  <div style={{
                    background: '#eff6ff', border: '1.5px solid #bfdbfe',
                    borderRadius: 14, padding: '16px 18px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.8, marginBottom: 4 }}>
                      📬 DISPATCHED DIRECTLY TO YOUR EMAIL INBOX
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                      Check your inbox at <strong style={{ color: '#1e3a8a' }}>{email}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                      Enter the 6-digit verification code from your email (check spam folder if not visible).
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: '#fffbeb', border: '1.5px solid #fde68a',
                    borderRadius: 14, padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 15 }}>⚠️</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e', letterSpacing: 0.5 }}>
                        EMAIL GATEWAY NOTICE
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#78350f', lineHeight: 1.45 }}>
                      Direct inbox dispatch requires a Gmail App Password in <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>backend/.env</code>.
                    </div>

                    {devOtp && (
                      <div style={{
                        marginTop: 10, background: '#ffffff', border: '1.5px dashed #f59e0b',
                        borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 10
                      }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            One-Time Security Code:
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#92400e', letterSpacing: 4, fontFamily: 'monospace' }}>
                            {devOtp}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpDigits(devOtp)}
                          style={{
                            padding: '7px 12px', borderRadius: 8, border: 'none',
                            background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#d97706'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f59e0b'}
                        >
                          ⚡ Auto-Fill Code
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Timer bar */}
                <div>
                  <div style={{ height:4, background:'#e2e8f0', borderRadius:2, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:2, transition:'width 1s linear, background 0.4s',
                      width:`${(timeLeft / expiry) * 100}%`,
                      background: timeLeft < 60 ? '#ef4444' : '#2563eb',
                    }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                    <span style={{ fontSize:11, color:'#94a3b8' }}>Expires in</span>
                    <span style={{ fontSize:12, fontWeight:700, color: timeLeft < 60 ? '#ef4444' : '#2563eb' }}>{mm}:{ss}</span>
                  </div>
                </div>

                <OTPBoxes value={otpDigits} onChange={setOtpDigits} disabled={loading}/>

                <button onClick={verifyOtp} disabled={loading || filled < 6 || timeLeft === 0} style={{
                  padding:'12px', borderRadius:10, border:'none',
                  background: filled === 6 && timeLeft > 0 && !loading ? '#2563eb' : '#93c5fd',
                  color:'#fff', fontWeight:700, fontSize:15,
                  cursor: filled === 6 && timeLeft > 0 && !loading ? 'pointer' : 'not-allowed',
                  fontFamily:'system-ui,sans-serif',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: filled === 6 && !loading ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                  transition:'all 0.18s',
                }}>
                  {loading
                    ? <><span style={{ display:'inline-block', animation:'spin 0.8s linear infinite' }}>◌</span> Verifying…</>
                    : '✓ Verify & Access Dashboard'}
                </button>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#94a3b8' }}>Didn't get it?</span>
                  <button onClick={resendOtp} disabled={resend > 0} style={{
                    background:'none', border:'none', fontSize:13, fontWeight:600,
                    color: resend > 0 ? '#93c5fd' : '#2563eb',
                    cursor: resend > 0 ? 'not-allowed' : 'pointer',
                    fontFamily:'system-ui,sans-serif', padding:0,
                  }}>
                    {resend > 0 ? `Resend in ${resend}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
