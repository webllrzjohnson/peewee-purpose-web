import { createAPIRoute } from '@tanstack/react-start/api';
import { db } from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';
import { createSession, destroySession } from '@/lib/auth';
import { eventHandler, readBody, setCookie } from 'h3';

export const API = createAPIRoute({
  async handler(event) {
    const { method } = event;

    if (method === 'POST') {
      const body = await readBody(event);
      const { email, password } = body;

      if (!email || !password) {
        return { status: 400, body: { message: 'Email and password are required' } };
      }

      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        return { status: 401, body: { message: 'Invalid email or password' } };
      }

      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return { status: 401, body: { message: 'Invalid email or password' } };
      }

      await createSession(event, user.id);
      return { status: 200, body: { message: 'Logged in successfully' } };
    }

    return { status: 405, body: { message: 'Method Not Allowed' } };
  },
});
