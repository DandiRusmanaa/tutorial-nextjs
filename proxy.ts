import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const handler = NextAuth(authConfig) as any;

export async function proxy(request: Request) {
  // Delegate handling to NextAuth's auth handler.
  // Use `any` here because the exact signature can vary between NextAuth/Next.js versions.
  if (typeof handler.auth === 'function') {
    return handler.auth(request);
  }

  // Fallback: if the handler itself is callable, call it directly.
  if (typeof handler === 'function') {
    return handler(request);
  }

  // If neither is callable, return the request unchanged.
  return new Response(null, { status: 204 });
}

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

// Provide a default export for environments that expect it.
export default proxy;
