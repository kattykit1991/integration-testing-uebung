import type { CreateActionResult } from '@/types';
import { type ActionFunction } from 'react-router';
import z from 'zod/v4';

const API_URL = import.meta.env.VITE_EVENTS_API_URL;

export const createEventAction: ActionFunction = async ({
  request
}): Promise<CreateActionResult> => {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const date = formData.get('date');
    const location = formData.get('location');
    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');
    const eventSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format'
      }),
      location: z.string().min(1, 'Location is required'),
      latitude: z.coerce
        .number('Latitude must be a number')
        .min(-90, { message: 'Latitude must be ≥ -90°' })
        .max(90, { message: 'Latitude must be ≤ 90°' }),

      longitude: z.coerce
        .number('Longitude must be a number')
        .min(-180, { message: 'Longitude must be ≥ -180°' })
        .max(180, { message: 'Longitude must be ≤ 180°' })
    });
    const { data, error, success } = eventSchema.safeParse({
      title,
      description,
      date,
      location,
      latitude,
      longitude
    });
    if (!success) throw new Error(z.prettifyError(error));
    const organizerId = JSON.parse(localStorage.getItem('user') || '{}').id;
    await fetch(`${API_URL}/events`, {
      method: 'POST',
      body: JSON.stringify({ ...data, organizerId }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return { success: true, message: 'Event created successfully' };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        error: error.message
      };
    }
    return {
      error: 'Something went very wrong!'
    };
  }
};
