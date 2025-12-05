'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => null);
      console.log('Login response status:', res.status, data);

      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          setError('Invalid username or password. Please check and try again.');
        } else if (res.status === 404) {
          setError('Username not found. Please check your username or create a new account.');
        } else {
          setError(data?.message || data?.error || `Login failed (${res.status})`);
        }
        setLoading(false);
        return;
      }

      const token = data?.access_token || data?.token || data?.accessToken || data?.authToken;
      if (!token) {
        console.warn('No token in successful response.');
        setError('Login succeeded but no session was returned. Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
      else if (data?.username) localStorage.setItem('user', JSON.stringify({ username: data.username }));

      router.push('/dashboard');
    } catch (err) {
      console.error('Login error', err);
      setError('Network error: could not reach auth server. Check your connection.');
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
          <div className="w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-4"></div>
            <p className="text-center text-gray-100">Loading...</p>
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
          <h1 className="text-2xl font-bold mb-4 text-white text-center">Login</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                className="bg-white/5 text-white placeholder-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
                Login
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300 mb-3">Don't have an account?</p>
            <button
              onClick={() => router.push('/register')}
              className="w-full rounded-full px-4 py-2 border border-gray-600 text-gray-200 hover:bg-white/5 transition"
            >
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}