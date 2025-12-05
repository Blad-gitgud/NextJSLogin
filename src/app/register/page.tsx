'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';

type CheckResult = { exists?: boolean; error?: string };

async function attemptLogin(username: string, password: string) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    console.warn('Login attempt failed (network):', err);
    return { ok: false, status: 0, data: null };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function markAttemptedLocally(name: string) {
    try {
      const key = 'register_attempts_v1';
      const raw = localStorage.getItem(key);
      const obj = raw ? JSON.parse(raw) : {};
      obj[name] = Date.now();
      localStorage.setItem(key, JSON.stringify(obj));
    } catch {}
  }
  function wasAttemptedLocallyRecently(name: string, minutes = 60) {
    try {
      const key = 'register_attempts_v1';
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      const ts = obj[name];
      if (!ts) return false;
      return Date.now() - ts < minutes * 60 * 1000;
    } catch {
      return false;
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');

    // client validation
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (wasAttemptedLocallyRecently(username.trim())) {
      setError('You recently tried to create this account. Please wait a bit or try logging in.');
      return;
    }

    setLoading(true);

    try {
      // 1) Pre-check: try to log in with these credentials.
      // If login works (and returns a token) -> account exists and credentials are correct -> inform user.
      const loginAttempt = await attemptLogin(username.trim(), password);
      console.log('Pre-register login attempt', loginAttempt.status, loginAttempt.data);

      // Consider login successful only if response ok AND a token is present
      const loginTokenCandidate =
        loginAttempt.data?.access_token ||
        loginAttempt.data?.token ||
        loginAttempt.data?.accessToken ||
        loginAttempt.data?.authToken;

      if (loginAttempt.ok && loginTokenCandidate) {
        // login succeeded with a token: user exists and password matches
        setError('An account with that username already exists. If this is you, please log in.');
        setLoading(false);
        return;
      }

      // If login returned 401/400/404, proceed to register.
      // 2) Submit register request
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const registerData = await registerRes.json().catch(() => null);
      console.log('Register response', registerRes.status, registerData);

      if (!registerRes.ok) {
        // show friendly messages on typical statuses
        const msg = (registerData && (registerData.message || registerData.error)) || `Registration failed (${registerRes.status})`;
        if (registerRes.status === 409 || /already exists|duplicate|taken/i.test(String(msg))) {
          setError('Username already exists. Please choose a different one.');
        } else {
          setError(msg);
        }
        setLoading(false);
        return;
      }

      // If server returned a token in the register response, use it
      const token =
        registerData?.access_token ||
        registerData?.token ||
        registerData?.accessToken ||
        registerData?.authToken;

      if (token) {
        localStorage.setItem('token', token);
        if (registerData?.user) localStorage.setItem('user', JSON.stringify(registerData.user));
        else localStorage.setItem('user', JSON.stringify({ username: username.trim() }));
        router.push('/dashboard');
        return;
      }

      // If register succeeded but no token, attempt immediate login (auto-login attempt)
      const postLogin = await attemptLogin(username.trim(), password);
      console.log('Post-register login attempt', postLogin.status, postLogin.data);

      if (postLogin.ok) {
        const loginToken =
          postLogin.data?.access_token ||
          postLogin.data?.token ||
          postLogin.data?.accessToken ||
          postLogin.data?.authToken;
        if (loginToken) {
          localStorage.setItem('token', loginToken);
          if (postLogin.data?.user) localStorage.setItem('user', JSON.stringify(postLogin.data.user));
          else localStorage.setItem('user', JSON.stringify({ username: username.trim() }));
          router.push('/dashboard');
          return;
        }
      }

      // No token after register + login failed -> show server message (or friendly fallback)
      const fallback =
        (registerData && (registerData.message || registerData.error)) ||
        'Registration succeeded but we did not receive an authentication token. Please log in.';
      setError(String(fallback));

      // mark attempted locally to avoid repeat submissions
      markAttemptedLocally(username.trim());
    } catch (err: any) {
      console.error('Register error', err);
      setError('Network error: could not reach auth server. Try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/dashboard-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-center">
          <div className="w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center max-h-[calc(100vh-6rem)] overflow-auto">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-4"></div>
            <p className="text-center text-gray-100">Creating account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-16"
      style={{
        backgroundImage: "url('/dashboard-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="min-h-screen bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="absolute top-6 left-6">
          <button
            onClick={() => router.push('/')}
            className="rounded-full px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 transition transform duration-150 hover:-translate-y-0.5"
          >
            ← Back
          </button>
        </div>

        <div className="w-full max-w-sm p-6 rounded-3xl shadow-2xl bg-white/15 backdrop-blur-3xl border border-white/20">
          <h1 className="text-2xl font-bold mb-4 text-white text-center">Create Account</h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                disabled={loading}
                className="bg-white/5 text-white placeholder-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Password</label>
              <Input
                type="password"
                placeholder="Enter a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-white/5 text-white placeholder-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="bg-white/5 text-white placeholder-gray-300 rounded-lg"
              />
            </div>

            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 transition transform duration-150 hover:-translate-y-0.5"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <button onClick={() => router.push('/login')} className="text-gray-200 underline">
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}