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
    const url = `${BACKEND}/auth/register`;
    // Only log that a registration attempt occurred, not the credentials
    console.log('proxy POST ->', url, 'registration attempt');

    // Retry loop: 3 attempts with small backoff
    const maxAttempts = 3;
    let attempt = 0;
    let lastErr: any = null;

    while (++attempt <= maxAttempts) {
      try {
        const res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }, 60000);

        console.log('backend status', res.status);

        const text = await res.text();
        let payload: any;
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }

        // Forward Set-Cookie if backend sets it (do not log the value)
        const setCookie = res.headers.get('set-cookie');
        const responseHeaders: Record<string, string> = {};
        if (setCookie) {
          // Do not log the cookie value
          responseHeaders['set-cookie'] = setCookie;
        }

        return NextResponse.json(payload, { status: res.status, headers: responseHeaders });
      } catch (err: any) {
        lastErr = err;
        const isTimeout = err?.name === 'AbortError' || err?.code === 'UND_ERR_HEADERS_TIMEOUT';
        console.warn(`register proxy attempt ${attempt} failed`, isTimeout ? 'timeout' : 'error');
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }
        break;
      }
    }

    console.error('Proxy /api/auth/register error (upstream unreachable)');
    return NextResponse.json({
      message: 'Upstream auth server unreachable (timeout). Please try again shortly.',
    }, { status: 504 });
  } catch (err) {
    console.error('Proxy /api/auth/register error');
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}