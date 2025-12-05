// src/app/api/auth/check-username/route.ts
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL?.replace(/\/+$/, '') || 'https://nestjsbladserver.onrender.com';

// Paths to try that might support username lookup. Adjust if your backend has a known endpoint.
const TRY_PATHS = [
  '/users?username=',
  '/user?username=',
  '/auth/check?username=',
  '/auth/users?username=',
  '/auth/find?username=',
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get('username') || '';
    if (!username) {
      return NextResponse.json({ error: 'username query missing' }, { status: 400 });
    }

    for (const p of TRY_PATHS) {
      const target = `${BACKEND}${p}${encodeURIComponent(username)}`;
      try {
        console.log('check-username trying', target);
        const res = await fetch(target, { method: 'GET' });
        const text = await res.text();
        let payload: any = null;
        try { payload = JSON.parse(text); } catch { payload = text; }

        if (res.ok) {
          // heuristics to detect an existing user
          if (payload === true || (payload && payload.exists === true)) {
            return NextResponse.json({ exists: true, source: target, payload }, { status: 200 });
          }
          if (Array.isArray(payload) && payload.length > 0) {
            return NextResponse.json({ exists: true, source: target, payload }, { status: 200 });
          }
          if (payload && (payload.username === username || payload.id || payload.email)) {
            return NextResponse.json({ exists: true, source: target, payload }, { status: 200 });
          }
          // server returned 200 but empty result -> not found here
          continue;
        }

        // 404 => not found at this path, try next
        if (res.status === 404) continue;

        // For other statuses, return diagnostic
        return NextResponse.json({ exists: false, source: target, status: res.status, payload }, { status: 200 });
      } catch (err) {
        console.warn('check-username fetch error', err);
        // try next path
      }
    }

    // No path confirmed the username exists
    return NextResponse.json({ exists: false, tried: TRY_PATHS }, { status: 200 });
  } catch (err) {
    console.error('Proxy /api/auth/check-username error', err);
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}