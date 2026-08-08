import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const COOKIE_NAME = "auth_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret = process.env["AUTH_SECRET"];

  if (secret) {
    return secret;
  }

  if (process.env["NODE_ENV"] === "production") {
    throw new Error("AUTH_SECRET is required in production");
  }

  return "development_only_auth_secret_change_me";
}

function getEncodedSecret() {
  return new TextEncoder().encode(getAuthSecret());
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

export async function encrypt(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedSecret());
}

export async function decrypt(token: string) {
  const { payload } = await jwtVerify(token, getEncodedSecret());
  return payload;
}

export async function getSession(request: Request) {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return null;

  try {
    return await decrypt(token);
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: string) {
  const token = await encrypt({ userId });
  const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : "";

  return `${COOKIE_NAME}=${encodeURIComponent(
    token,
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function destroySessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
