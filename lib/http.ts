import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from './supabase';

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function bearer(request: Request): string | null {
  const match = /^Bearer\s+([A-Za-z0-9_-]+)$/.exec(request.headers.get('authorization') ?? '');
  return match ? match[1] : null;
}

/** Returns a 503 response when Supabase is not configured, otherwise null. */
export function requireBackend(): NextResponse | null {
  return isSupabaseConfigured()
    ? null
    : json({ error: 'Gift database is not configured. Connect Supabase to enable hosted gifts.' }, 503);
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as T) : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Wraps a route handler so thrown ApiErrors become JSON and anything else becomes a generic 500. */
export function handle<C = unknown>(fn: (request: Request, context: C) => Promise<Response>) {
  return async (request: Request, context?: C): Promise<Response> => {
    try {
      return await fn(request, context as C);
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error(error);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  };
}
