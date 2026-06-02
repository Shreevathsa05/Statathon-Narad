import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

export default function SetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setupPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) navigate('/login');
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setLoading(true);
    setError('');
    try {
      await setupPassword(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to setup password');
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

        <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">Create Password</h1>
        <p className="text-sm text-text-muted mb-8">Welcome! Please set a password for your account to continue.</p>

        {error && <div className="text-sm text-geist-error bg-geist-error/10 border border-geist-error/20 rounded-md p-3 mb-6">{error}</div>}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
            <input className="w-full h-10 px-3 bg-surface border border-border rounded-md text-sm font-mono text-text-muted cursor-not-allowed" value={email || ''} disabled />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">New Password</label>
            <input
              className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-black transition-colors"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Confirm Password</label>
            <input
              className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-black transition-colors"
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full h-10 mt-2 bg-black text-white font-medium text-sm rounded-md hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin"/> Saving…</> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
