import { createAPIRoute } from '@tanstack/react-start/api';
import { db } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { readBody } from 'h3';
import { parseISO, addMinutes } from 'date-fns';

export const API = createAPIRoute({
  async handler(event) {
    const { method } = event;

    if (method === 'POST') {
      const session = await getSession(event);
      if (!session) {
        return { status: 401, body: { message: 'Authentication required' } };
      }

      const body = await readBody(event);
      const { date, time } = body;

      if (!date || !time) {
        return { status: 400, body: { message: 'Date and time are required' } };
      }

      try {
        const startTime = parseISO(`${date}T${time}:00`);
        const endTime = addMinutes(startTime, 120);

        await db.appointment.create({
          data: {
            userId: session.userId as string,
            startTime,
            endTime,
            status: 'PENDING',
          },
        });

        return { status: 201, body: { message: 'Appointment booked successfully' } };
      } catch (e) {
        return { status: 500, body: { message: 'Booking failed' } };
      }
    }

    return { status: 405, body: { message: 'Method Not Allowed' } };
  },
});
