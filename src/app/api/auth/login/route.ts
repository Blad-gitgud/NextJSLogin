import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL?.replace(/\/+$/, '') || 'https://nestjsbladserver.onrender.com';

// Helper: fetch with timeout + simple retry/backoff
async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = `${BACKEND}/auth/login`;
    // DO NOT log raw credentials
    console.log('proxy POST ->', url, 'login attempt for username:', (body && body.username) ? '[REDACTED]' : '[no-username]');

    // Retry loop: 3 attempts with small backoff
    const maxAttempts = 3;
    let attempt = 0;
    let lastErr: any = null;

    while (++attempt <= maxAttempts) {
      try {
        // Use longer timeout for slow/cold backends
        const res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }, 60000);

        console.log('backend status', res.status);

        const text = await res.text();
        let payload: any;
        try { payload = JSON.parse(text); } catch { payload = text; }

        // forward Set-Cookie if backend sets it
        const setCookie = res.headers.get('set-cookie');
        const responseHeaders: Record<string, string> = {};
        if (setCookie) {
          console.log('backend set-cookie: [present]');
          responseHeaders['set-cookie'] = setCookie;
        }

        return NextResponse.json(payload, { status: res.status, headers: responseHeaders });
      } catch (err: any) {
        lastErr = err;
        const isTimeout = err?.name === 'AbortError' || err?.code === 'UND_ERR_HEADERS_TIMEOUT';
        console.warn(`login proxy attempt ${attempt} failed`, isTimeout ? 'timeout/headers timeout' : err?.message || err);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }
        break;
      }
    }

    // If we got here everything failed -> return a clear 504 so client shows a useful error
    console.error('Proxy /api/auth/login error (upstream unreachable)', lastErr);
    return NextResponse.json({
      message: 'Upstream auth server unreachable (timeout). Please try again shortly.',
      error: String(lastErr),
    }, { status: 504 });
  } catch (err) {
    console.error('Proxy /api/auth/login error', err);
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}