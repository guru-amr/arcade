import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const VendorLoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post<{ token: string }>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/vendor/auth/login`,
        {
          username,
          password,
        },
      );
      login(res.data.token);
      navigate('/vendor/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid credentials or server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-sm border border-gray-100">
        <div className="mb-5 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-semibold">
            A
          </span>
          <div>
            <div className="text-sm font-semibold tracking-wide text-primary">ARCADE Vendor</div>
            <div className="text-xs text-muted">Staff dashboard login</div>
          </div>
        </div>

        <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-gray-900 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-muted">
          This area is restricted to ARCADE printing staff. Student orders are placed from the main
          landing page.
        </p>
      </div>
    </div>
  );
};

