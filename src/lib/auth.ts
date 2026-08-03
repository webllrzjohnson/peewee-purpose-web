import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { getCookie, setCookie, deleteCookie, H3Event } from 'h3';

const COOKIE_NAME = 'auth_session';
const SECRET = process.env.AUTH_SECRET || 'default_secret_change_me';

export async function encrypt(payload: JWTPayload) {
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

export async function getSession(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;
  try {
    return await decrypt(token);
  } catch (e) {
    return null;
  }
}

export async function createSession(event: H3Event, userId: string) {
  const token = await encrypt({ userId });
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(event: H3Event) {
  deleteCookie(event, COOKIE_NAME);
}
