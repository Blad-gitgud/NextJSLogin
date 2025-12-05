import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL?.replace(/\/+$/, '') || 'https://nestjsbladserver.onrender.com';
const TRY_PATHS = ['/user', '/auth/me', '/auth/user', '/me', '/profile'];

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function tryDecodeJwtUser(authHeader: string | null) {
  if (!authHeader) return null;
  const m = authHeader.match(/Bearer\s+(.+)/i);
  const raw = m ? m[1] : authHeader;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    const username = payload.username || payload.sub || payload.email || null;
    if (!username) return null;
    return { username };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const headersBase: Record<string, string> = {};
    if (authHeader) headersBase['Authorization'] = authHeader;

    let lastErr: any = null;

    for (const p of TRY_PATHS) {
      const url = `${BACKEND}${p}`;
      try {
        // Do not log auth header or sensitive info
        console.log('proxy GET trying ->', url);
        
        const maxAttempts = 3;
        let attempt = 0;
        let lastAttemptErr: any = null;
        
        while (++attempt <= maxAttempts) {
          try {
            const res = await fetchWithTimeout(url, {
              method: 'GET',
              headers: headersBase,
            }, 45000);

            console.log('backend', url, 'status', res.status);

            const text = await res.text();
            let payload: any;
            try { payload = JSON.parse(text); } catch { payload = text; }

            const setCookie = res.headers.get('set-cookie');
            const responseHeaders: Record<string, string> = {};
            if (setCookie) {
              responseHeaders['set-cookie'] = setCookie;
            }

            if (res.ok) {
              return NextResponse.json(payload, { status: res.status, headers: responseHeaders });
            }

            if (res.status === 404) {
              lastErr = { url, status: res.status, body: payload };
              break;
            }

            return NextResponse.json(payload, { status: res.status, headers: responseHeaders });
          } catch (err: any) {
            lastAttemptErr = err;
            const isAbort = err?.name === 'AbortError' || err?.code === 'UND_ERR_HEADERS_TIMEOUT';
            console.warn(`fetch attempt ${attempt} for ${url} failed (${isAbort ? 'timeout' : 'error'})`);
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 500 * attempt));
              continue;
            } else {
              throw lastAttemptErr;
            }
          }
        }
      } catch (err) {
        console.error('fetch error for', url);
        lastErr = err;
      }
    }

    const decoded = tryDecodeJwtUser(authHeader || null);
    if (decoded) {
      console.log('Returning JWT-decoded user payload as fallback (backend unreachable)');
      return NextResponse.json(decoded, { status: 200 });
    }

    const message = {
      message: 'Failed to contact backend user endpoints (upstream timeout or unreachable).',
    };
    return NextResponse.json(message, { status: 504 });
  } catch (err) {
    console.error('Proxy /api/user error');
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}