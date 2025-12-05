import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL?.replace(/\/+$/, '') || 'https://nestjsbladserver.onrender.com';

export async function DELETE(req: Request, context: { params: any }) {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ message: 'Position ID is required' }, { status: 400 });
    }

    const incomingHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      incomingHeaders[key] = value;
    });

    const headers: Record<string, string> = {};
    if (incomingHeaders['authorization']) headers['authorization'] = incomingHeaders['authorization'];
    if (incomingHeaders['cookie']) headers['cookie'] = incomingHeaders['cookie'];
    if (incomingHeaders['content-type']) headers['content-type'] = incomingHeaders['content-type'];
    if (incomingHeaders['accept']) headers['accept'] = incomingHeaders['accept'];

    const url = `${BACKEND}/positions/${id}`;
    // Do not log sensitive headers; only log the endpoint
    console.log('[proxy DELETE] forwarding to backend:', url);

    const backendResponse = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const forwardedHeaders: Record<string, string> = {};
    const ct = backendResponse.headers.get('content-type');
    if (ct) forwardedHeaders['content-type'] = ct;
    const setCookie = backendResponse.headers.get('set-cookie');
    if (setCookie) forwardedHeaders['set-cookie'] = setCookie;

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: forwardedHeaders,
    });
  } catch (err) {
    console.error('Proxy /api/positions/[id] DELETE error');
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}