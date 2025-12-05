// /lib/config/ts.configs.ts

// export const API_BASE = 'https://nestjsdemo.onrender.com/auth';
export const API_BASE = (() => {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!env) {
    // warn in browser/dev. Fallback kept to avoid break but you should set the env var.
    if (typeof window !== 'undefined') {
      console.warn('NEXT_PUBLIC_API_BASE_URL not set. Falling back to https://nestjsbladserver.onrender.com/auth');
    }
    return 'https://nestjsbladserver.onrender.com/auth';
  }
  return env.replace(/\/+$/, '');
})();