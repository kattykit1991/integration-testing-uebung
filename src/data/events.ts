import type { Event, EventsResponse } from '@/types';
import { type LoaderFunction } from 'react-router';

const API_URL = import.meta.env.VITE_EVENTS_API_URL;

export const getAllEvents: LoaderFunction = async ({ request }) => {
  if (!API_URL)
    throw new Error(
      'Something tells me you forgot to set the VITE_EVENTS_API_URL environment variable.'
    );
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || '1';
  const limit = url.searchParams.get('limit') || '10';

  const res = await fetch(`${API_URL}/events?page=${page}&limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to fetch events');
  }
  const data = (await res.json()) as EventsResponse;

  const isValid = (n: unknown, max: number) => Number.isFinite(n) && Math.abs(n as number) <= max;
  data.results = data.results.filter(
    (e: Event) => isValid(e.latitude, 90) && isValid(e.longitude, 180)
  );
  return data;
};
