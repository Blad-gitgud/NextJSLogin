'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // minimal effect to preserve parity with other pages if needed
  }, []);

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
        <div className="min-h-screen bg-black/60 backdrop-blur-sm w-full flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-12 rounded-3xl shadow-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-4"></div>
            <p className="text-center text-gray-100">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/dashboard-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="min-h-screen bg-black/60 backdrop-blur-sm w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white/15 backdrop-blur-3xl border border-white/20">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white mb-2">Welcome to MyProject</h1>
            <p className="text-sm text-gray-300 mb-8">Secure sign in and registration. Choose an option to continue.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full rounded-full px-6 py-2 bg-gray-800 text-white hover:bg-gray-700 transition transform duration-150 hover:-translate-y-0.5"
            >
              Login
            </button>

            <button
              onClick={() => router.push('/register')}
              className="w-full rounded-full px-6 py-2 border border-gray-600 text-gray-200 hover:bg-white/5 transition transform duration-150 hover:-translate-y-0.5"
            >
              Create an account
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-300">
            Already have an account? Use "Login". New here? Choose "Create an account".
          </div>
        </div>
      </div>
    </div>
  );
}
