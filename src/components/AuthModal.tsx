import React, { useState } from 'react';
import { X, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { WebTrexLogo } from './WebTrexLogo';

type AuthMode = 'signin' | 'forgot';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  const msg = error instanceof Error ? error.message : String(error);

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password. Ensure the administrator account (webtrex@gmail.com) is created in Firebase Authentication and try again.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not yet enabled in the Firebase Console. Enable Email/Password under Authentication → Sign-in method and add webtrex@gmail.com under Authentication → Users.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  return msg || 'Authentication failed. Please try again.';
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const { signInWithEmail, sendResetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('webtrex@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'signin' && password.length < 6) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password, rememberMe);
        setPassword('');
        onAuthenticated();
      } else {
        await sendResetPassword(email);
        setSuccessMessage('Password reset instructions have been sent to your email address.');
      }
    } catch (err) {
      setErrorMessage(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-[#0E1629] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sign in dialog"
              className="absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <WebTrexLogo size={30} />
              <h2 id="auth-modal-title" className="text-2xl font-bold text-white mt-5 tracking-tight">
                {mode === 'signin' ? 'Administrator Sign In' : 'Reset Admin Password'}
              </h2>
              <p className="text-sm text-slate-400 mt-1.5">
                {mode === 'signin'
                  ? 'Sign in with your WebTrex administrator account to open the Admin Panel.'
                  : 'Enter your administrator email to receive a password reset link.'}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-sm text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-sm text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="webtrex@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2878FF] transition-colors"
                />
              </div>

              {mode === 'signin' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-[#2878FF] hover:text-[#5B9BFF] transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter administrator password"
                      className="w-full px-3.5 py-2.5 pr-11 rounded-lg bg-[#080D1A] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#2878FF] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signin' && (
                <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#080D1A] accent-[#2878FF]"
                  />
                  <span>Remember me on this device</span>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#2878FF] hover:bg-[#3D88FF] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {submitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to Admin Panel' : 'Send Reset Link'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full mt-4 py-2 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
