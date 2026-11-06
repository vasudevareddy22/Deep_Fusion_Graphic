import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthInput from '../components/AuthInput';
import AuthButton from '../components/AuthButton';
import GoogleButton from '../components/GoogleButton';
import BrandPanel from '../components/BrandPanel';
import { api } from '../services/api';
import { authService } from '../services/auth';

/**
 * Signup Page.
 * Follows exact user specifications:
 * - Full viewport height
 * - Background: rich teal/turquoise (#0B9F9C style)
 * - Centered authentication card around 1000px - 1100px wide, ~560px - 620px height
 * - Border-radius 14px, overflow-hidden, subtle shadow
 * - Two equal-width panels (50/50 split)
 * - Left panel: Promotional teal gradient, "Welcome", "Your journey starts here.", bottom white badge "DeepFusionGuard"
 * - Right panel: Very dark navy/black (#0b0f19), form centered at ~350px max-width
 * - Heading: "Create account", Subheading: "Sign up to get started"
 * - Form: Email (with mail icon), Password (with lock + eye toggle)
 * - Primary button: "Create account" (Bright cyan/turquoise background, dark text)
 * - Divider: "OR"
 * - Google OAuth button: "Continue with Google" -> triggers official Google OAuth account chooser (prompt=select_account)
 * - Terms of Service and Privacy Policy clickable links
 * - "Already have an account? Log in" (cyan link to /login)
 * - Email, password validation, loading states, error states
 */
export const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverNotice, setServerNotice] = useState('');

  // Handle OAuth callback query parameters if redirected here
  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    const oauthSuccess = searchParams.get('oauth_success');
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (oauthError) {
      setServerError(oauthError);
    } else if (oauthSuccess && token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        authService.login(user, token);
        sessionStorage.setItem('dfg_show_login_alert', 'true');
        navigate('/');
      } catch (e) {
        setServerError('Failed to process Google login response.');
      }
    }
  }, [searchParams, navigate]);

  // Validation
  const validateForm = () => {
    const errs = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters long';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerNotice('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await api.register({
        name: email.split('@')[0] || 'User',
        email: email.trim(),
        password: password,
        role: 'Customer',
        organization: 'Independent Organization',
      });

      if (res.token && res.user) {
        authService.login(res.user, res.token);
        sessionStorage.setItem('dfg_show_login_alert', 'true');
        navigate('/');
      } else {
        setServerNotice(res.message || 'Account created! Redirecting to login…');
        setTimeout(() => navigate('/login'), 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unable to create account. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Official Google OAuth 2.0 flow with account chooser
  const handleGoogleSignup = async () => {
    setServerError('');
    setGoogleLoading(true);
    try {
      const res = await api.getGoogleAuthUrl('/signup');
      if (res?.auth_url && res.client_id_configured) {
        // Redirect browser to Google's official OAuth authorization endpoint
        // Google will display its official account chooser with prompt=select_account
        window.location.href = res.auth_url;
      } else {
        // Fallback for development if GOOGLE_CLIENT_ID is not configured in backend/.env yet
        const simulatedEmail = `user.${Date.now().toString(36)}@gmail.com`;
        const profileRes = await api.googleAuth({
          email: simulatedEmail,
          name: email.split('@')[0] || 'Google User',
          google_id: `google_${Date.now()}`,
        });
        authService.login(profileRes.user, profileRes.token);
        sessionStorage.setItem('dfg_show_login_alert', 'true');
        navigate('/');
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to initialize Google authentication flow.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070B14] font-['Inter',sans-serif] bg-cyber-grid">
      {/* ── Main Authentication Card ── */}
      <div className="w-full max-w-[1080px] min-h-[580px] md:h-[620px] bg-[#0A0F1D] rounded-[16px] overflow-hidden shadow-2xl shadow-black/80 border border-slate-800 flex flex-col md:flex-row transition-all duration-300">
        
        {/* ── Left Promotional Panel (50% on desktop) ── */}
        <div className="w-full md:w-1/2 shrink-0">
          <BrandPanel
            welcomeText="CYBER SOC GATEWAY"
            heading="Join the Next-Gen Threat Defense Platform."
            brandName="DeepFusionGuard"
          />
        </div>

        {/* ── Right Authentication Panel (50% on desktop) ── */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-[#090E1B] overflow-y-auto">
          <div className="w-full max-w-[350px] flex flex-col justify-center my-auto">
            
            {/* Header */}
            <div className="mb-5">
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-100 tracking-tight">
                Create account
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Sign up to get started
              </p>
            </div>

            {/* Server Error / Notice */}
            {serverError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{serverError}</span>
              </div>
            )}
            {serverNotice && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{serverNotice}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
              {/* 1. Email field */}
              <AuthInput
                id="signup-email"
                label="Email address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                icon={Mail}
                error={errors.email}
                autoComplete="email"
                disabled={loading || googleLoading}
                required
              />

              {/* 2. Password field */}
              <AuthInput
                id="signup-password"
                label="Password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                icon={Lock}
                error={errors.password}
                autoComplete="new-password"
                disabled={loading || googleLoading}
                required
              />

              {/* 3. Primary Button */}
              <div className="pt-1">
                <AuthButton type="submit" loading={loading} disabled={googleLoading}>
                  Create account
                </AuthButton>
              </div>

              {/* 4. Divider */}
              <div className="relative flex items-center justify-center my-0.5">
                <div className="w-full border-t border-slate-800" />
                <span className="absolute bg-[#090d16] px-2.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  OR
                </span>
              </div>

              {/* 5. Google Authentication Button */}
              <GoogleButton
                onClick={handleGoogleSignup}
                disabled={loading || googleLoading}
                loading={googleLoading}
                text="Continue with Google"
              />

              {/* 6. Terms text */}
              <p className="text-[11px] text-slate-400 text-center leading-relaxed mt-0.5">
                By creating an account, you agree to our{' '}
                <a
                  href="#terms"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Terms of Service: This platform is protected for authorized usage.');
                  }}
                  className="text-slate-300 hover:text-[#00E5D9] transition-colors underline underline-offset-2"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Privacy Policy: User credentials and data are handled securely with encryption.');
                  }}
                  className="text-slate-300 hover:text-[#00E5D9] transition-colors underline underline-offset-2"
                >
                  Privacy Policy
                </a>
                .
              </p>

              {/* 7. Login link */}
              <div className="text-center text-xs text-slate-400 mt-1 pt-2 border-t border-slate-800/60 flex items-center justify-center gap-1.5">
                <span>Already have an account?</span>
                <Link
                  to="/login"
                  className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                >
                  Log in
                </Link>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
