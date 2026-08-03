import { createAPIRoute } from '@tanstack/react-start/api';
import { db } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { eventHandler, readBody } from 'h3';
import { parseISO, addMinutes, formatISO } from 'date-fns';

export const API = createAPIRoute({
  async handler(event) {
    const { method } = event;

    if (method === 'GET') {
      const query = event.node.req.url?.split('?')[1];
      const params = new URLSearchParams(query);
      const dateStr = params.get('date');

      if (!dateStr) {
        return { status: 400, body: { message: 'Date is required' } };
      }

      // Simplified slot generation for now: 9 AM to 5 PM, every 2 hours
      const slots = ['09:00', '11:00', '13:00', '15:00', '17:00'];
      
      // In a real scenario, we would check the db for existing appointments on this date
      // and filter out taken slots.
      
      return { status: 200, body: slots };
    }

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
        const endTime = addMinutes(startTime, 120); // 2-hour session

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
