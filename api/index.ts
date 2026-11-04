import type { Request, Response } from 'express';
import app from '../server.ts';

export default function handler(request: Request, response: Response) {
  const incomingUrl = new URL(request.url || '/', 'http://vercel.local');
  const routePath = incomingUrl.searchParams.get('__route');
  const segments = routePath?.split('/') || [];

  if (!routePath || segments.some((segment) => !/^[A-Za-z0-9._-]+$/.test(segment) || segment === '.' || segment === '..')) {
    return response.status(404).json({ error: 'Not found' });
  }

  const query = new URLSearchParams(incomingUrl.searchParams);
  query.delete('__route');
  const search = query.toString();
  request.url = `/api/${routePath}${search ? `?${search}` : ''}`;

  return app(request, response);
}
