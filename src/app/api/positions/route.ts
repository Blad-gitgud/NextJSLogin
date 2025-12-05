import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL?.replace(/\/+$/, '') || 'https://nestjsbladserver.onrender.com';

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const url = `${BACKEND}/positions`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: auth },
    });

    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return new NextResponse(text, { status: res.status });
    }
  } catch (err) {
    console.error('Proxy /api/positions GET error', err);
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const url = `${BACKEND}/positions`;

    // Read raw body from the incoming request and forward it
    const bodyText = await req.text();

    // Preserve content-type if provided, otherwise default to JSON
    const contentType = req.headers.get('content-type') || 'application/json';
    const headers: Record<string, string> = { 'Content-Type': contentType };
    if (auth) headers['Authorization'] = auth;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyText,
    });

    const text = await res.text();

    // forward Set-Cookie if backend sets it
    const setCookie = res.headers.get('set-cookie');
    const responseHeaders: Record<string, string> = {};
    if (setCookie) {
      responseHeaders['set-cookie'] = setCookie;
    }

    try {
      return NextResponse.json(JSON.parse(text), { status: res.status, headers: responseHeaders });
    } catch {
      return new NextResponse(text, { status: res.status, headers: responseHeaders });
    }
  } catch (err) {
    console.error('Proxy /api/positions POST error', err);
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}