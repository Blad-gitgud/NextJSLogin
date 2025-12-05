'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      
      // if no token at all -> redirect immediately to login
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('Token present, checking with backend...');
      setChecking(true);

      try {
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        const res = await fetch('/api/user', { headers, credentials: 'include' });
        
        console.log('/api/user response:', res.status);

        if (res.ok) {
          setAuthorized(true);
          setChecking(false);
          return;
        }

        // if 404 -> backend has no user endpoint, but token is valid
        if (res.status === 404) {
          console.log('Profile endpoint missing, but token valid. Allowing access.');
          setAuthorized(true);
          setChecking(false);
          return;
        }

        // if 401 -> token is invalid
        if (res.status === 401) {
          console.log('Token rejected by backend (401), redirecting to login');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        // other errors -> redirect to login
        console.warn('Unexpected /api/user status', res.status);
        localStorage.removeItem('token');
        router.push('/login');
      } catch (err) {
        console.error('Auth check failed', err);
        // network error -> still allow if token exists locally
        setAuthorized(true);
        setChecking(false);
      }
    })();
  }, [router]);

  // while checking auth, show glass morphism loading screen
  if (checking) {
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
            <p className="text-center text-gray-100">Verifying authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // not authorized -> should have redirected already, but fallback
  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}