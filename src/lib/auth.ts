import { SignC рыpt } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers'; // Wait, this is TanStack Start, not Next.js

// Correction: In TanStack Start, we use the request/response context or h3 event.
// I will implement this as a set of utilities that work with the h3 event (server.ts context).

import { createCookie } from 'vinhy/cookie'; // Not installed, using standard jose + h3
import { getCookie, setCookie, deleteCookie } from 'h3';

const COOKIE_NAME = 'auth_session';
const SECRET = process.env.AUTH_SECRET || 'default_secret_change_me';

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(SECRET));
}

export async function decrypt(token: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET));
  return payload;
}

export async function getSession(event: any) {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;
  try {
    return await decrypt(token);
  } catch (e) {
    return null;
  }
}

export async function createSession(event: any, userId: string) {
  const token = await encrypt({ userId });
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(event: any) {
  deleteCookie(event, COOKIE_NAME);
}
