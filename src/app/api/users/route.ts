import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL?.replace(/\/+$/, '') || 'https://nestjsbladserver.onrender.com';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const headers: Record<string, string> = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const url = `${BACKEND}/users`;
    console.log('proxy GET users ->', url, 'auth present:', Boolean(authHeader));

    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('backend', url, 'status', res.status);

    const text = await res.text();
    let payload: any;
    try { payload = JSON.parse(text); } catch { payload = text; }

    // Forward Set-Cookie if backend provides it
    const setCookie = res.headers.get('set-cookie');
    const responseHeaders: Record<string, string> = {};
    if (setCookie) {
      console.log('forwarding set-cookie from', url);
      responseHeaders['set-cookie'] = setCookie;
    }

    if (res.ok) {
      return NextResponse.json(payload, { status: res.status, headers: responseHeaders });
    }

    return NextResponse.json(payload, { status: res.status, headers: responseHeaders });
  } catch (err) {
    console.error('Proxy /api/users error', err);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 502 });
  }
}