import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = email, 2 = password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/auth/check-email', { email });
      if (res.data.status === 'pending_setup') {
        navigate(`/setup-password?email=${encodeURIComponent(email)}`);
      } else if (res.data.status === 'suspended') {
        setError('This account has been suspended. Please contact the administrator.');
      } else {
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt p-4">
      <div className="w-full max-w-[400px] bg-white border border-border rounded-xl shadow-sm p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xl rounded-md shrink-0">N</div>
          <div>
            <div className="text-[17px] font-bold tracking-tight leading-tight text-text-primary">NARAD Admin</div>
            <div className="text-[11px] text-text-muted font-mono mt-0.5">MoSPI Platform</div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">Welcome back</h1>
        <p className="text-sm text-text-muted mb-8">Enter your MoSPI email to continue</p>

        {error && <div className="text-sm text-geist-error bg-geist-error/10 border border-geist-error/20 rounded-md p-3 mb-6">{error}</div>}

        {step === 1 ? (
          <form className="flex flex-col gap-6" onSubmit={handleCheckEmail}>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
              <input
                className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm font-mono focus:outline-none focus:border-black transition-colors"
                type="email"
                placeholder="role.name@mospi.gov"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="w-full h-10 bg-black text-white font-medium text-sm rounded-md hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin"/> Checking…</> : 'Continue'}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-text-primary mb-2">
                Email Address
                <button type="button" className="text-xs text-text-muted hover:text-black transition-colors underline" onClick={() => setStep(1)}>Edit</button>
              </label>
              <input className="w-full h-10 px-3 bg-surface border border-border rounded-md text-sm font-mono text-text-muted cursor-not-allowed" value={email} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
              <input
                className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-black transition-colors tracking-widest"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="w-full h-10 mt-2 bg-black text-white font-medium text-sm rounded-md hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin"/> Signing in…</> : 'Sign In'}
            </button>
          </form>
        )}

        <div className="mt-10 text-center text-xs text-text-muted">
          NARAD System © 2026 MoSPI Govt. of India
        </div>
      </div>
    </div>
  );
}

