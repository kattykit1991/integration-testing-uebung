import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

const apiUrl = 'http://localhost:3001/api';
const authFields = { name: 'Ada', email: 'ada@example.com', password: 'password123' };
const eventFields = {
  title: 'Community meetup',
  description: 'Meet the neighbours',
  date: '2026-12-01T18:00',
  location: 'Berlin',
  latitude: '52.52',
  longitude: '13.405'
};

const formArgs = (fields: Record<string, string>): ActionFunctionArgs => ({
  request: new Request('http://localhost/submit', {
    method: 'POST',
    body: new URLSearchParams(fields)
  }),
  url: new URL('http://localhost/submit'),
  pattern: '/submit',
  params: {},
  context: new RouterContextProvider()
});

const loaderArgs = (search = ''): LoaderFunctionArgs => ({
  request: new Request(`http://localhost/events${search}`),
  url: new URL(`http://localhost/events${search}`),
  pattern: '/events',
  params: {},
  context: new RouterContextProvider()
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_EVENTS_API_URL', apiUrl);
  vi.stubGlobal('fetch', vi.fn());
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('authentication actions', () => {
  it.each([
    ['loginAction', '/auth/login', 'Login failed'],
    ['registerAction', '/users', 'Registration failed']
  ] as const)('%s supplies a fallback for an HTTP error without a message', async (name, path, message) => {
    const actions = await import('@/actions/auth');
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 500 }));

    expect(await actions[name](formArgs(authFields))).toEqual({ error: message });
    expect(fetch).toHaveBeenCalledWith(`${apiUrl}${path}`, expect.objectContaining({ method: 'POST' }));
  });

  it.each(['loginAction', 'registerAction'] as const)('%s reports a network failure', async (name) => {
    const actions = await import('@/actions/auth');
    vi.mocked(fetch).mockRejectedValue(new Error('Network unavailable'));

    expect(await actions[name](formArgs(authFields))).toEqual({ error: 'Network unavailable' });
  });

  it.each(['loginAction', 'registerAction'] as const)('%s handles a rejection that is not an Error', async (name) => {
    const actions = await import('@/actions/auth');
    vi.mocked(fetch).mockRejectedValue('Connection closed');

    expect(await actions[name](formArgs(authFields))).toEqual({ error: 'Something went very wrong!' });
  });

  it.each([
    ['name', '', 'Name is required'],
    ['email', 'invalid', 'Invalid email address'],
    ['password', 'short', 'Password must be at least']
  ])('rejects an invalid registration %s before sending a request', async (field, value, message) => {
    const { registerAction } = await import('@/actions/auth');

    expect(await registerAction(formArgs({ ...authFields, [field]: value }))).toEqual({
      error: expect.stringContaining(message)
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('event creation action', () => {
  it('submits validated coordinates, the organizer and the session token', async () => {
    const { createEventAction } = await import('@/actions/events');
    localStorage.setItem('user', JSON.stringify({ id: 7 }));
    localStorage.setItem('token', 'session-token');
    vi.mocked(fetch).mockResolvedValue(Response.json({ id: 42 }, { status: 201 }));

    expect(await createEventAction(formArgs(eventFields))).toEqual({
      success: true,
      message: 'Event created successfully'
    });
    expect(fetch).toHaveBeenCalledExactlyOnceWith(`${apiUrl}/events`, {
      method: 'POST',
      body: JSON.stringify({ ...eventFields, latitude: 52.52, longitude: 13.405, organizerId: 7 }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }
    });
  });

  it.each([
    ['title', '', 'Title is required'],
    ['date', 'not-a-date', 'Invalid date format'],
    ['location', '', 'Location is required'],
    ['latitude', '-91', 'Latitude must be ≥ -90°'],
    ['latitude', '91', 'Latitude must be ≤ 90°'],
    ['longitude', '-181', 'Longitude must be ≥ -180°'],
    ['longitude', '181', 'Longitude must be ≤ 180°'],
    ['latitude', 'north', 'Latitude must be a number']
  ])('rejects invalid %s=%s without contacting the API', async (field, value, message) => {
    const { createEventAction } = await import('@/actions/events');

    expect(await createEventAction(formArgs({ ...eventFields, [field]: value }))).toEqual({
      error: expect.stringContaining(message)
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports a network failure without returning success', async () => {
    const { createEventAction } = await import('@/actions/events');
    vi.mocked(fetch).mockRejectedValue(new Error('Network unavailable'));

    expect(await createEventAction(formArgs(eventFields))).toEqual({ error: 'Network unavailable' });
  });

  it('handles non-Error rejections', async () => {
    const { createEventAction } = await import('@/actions/events');
    vi.mocked(fetch).mockRejectedValue(null);

    expect(await createEventAction(formArgs(eventFields))).toEqual({ error: 'Something went very wrong!' });
  });
});

describe('event loader', () => {
  it.each([
    ['', '1', '10'],
    ['?page=3&limit=5', '3', '5']
  ])('loads the requested page for %s', async (search, page, limit) => {
    const { getAllEvents } = await import('@/data/events');
    const data = { results: [], totalCount: 0, currentPage: Number(page) };
    vi.mocked(fetch).mockResolvedValue(Response.json(data));

    expect(await getAllEvents(loaderArgs(search))).toEqual(data);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(`${apiUrl}/events?page=${page}&limit=${limit}`);
  });

  it('keeps boundary coordinates and removes nonnumeric or out-of-range positions', async () => {
    const { getAllEvents } = await import('@/data/events');
    const positions = [[90, 180], [-90, -180], [0, 0], [91, 0], [0, 181], [-91, 0], [0, -181], [null, 0], [0, '13']];
    const results = positions.map(([latitude, longitude], id) => ({ id, latitude, longitude }));
    vi.mocked(fetch).mockResolvedValue(Response.json({ totalCount: 9, results }));

    expect(await getAllEvents(loaderArgs())).toEqual({ totalCount: 9, results: results.slice(0, 3) });
  });

  it('rejects an unsuccessful API response', async () => {
    const { getAllEvents } = await import('@/data/events');
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 503 }));

    await expect(getAllEvents(loaderArgs())).rejects.toThrow('Failed to fetch events');
  });

  it('reports a missing API URL before making a request', async () => {
    vi.stubEnv('VITE_EVENTS_API_URL', '');
    const { getAllEvents } = await import('@/data/events');

    await expect(getAllEvents(loaderArgs())).rejects.toThrow('VITE_EVENTS_API_URL');
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('homepage loader', () => {
  it('returns the user and event totals from the API', async () => {
    const { getHomePageData } = await import('@/data/homepage');
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ totalCount: 12 }))
      .mockResolvedValueOnce(Response.json({ totalCount: 34 }));

    expect(await getHomePageData(loaderArgs())).toEqual({ userCount: 12, eventsCount: 34 });
    expect(fetch).toHaveBeenCalledWith(`${apiUrl}/users`);
    expect(fetch).toHaveBeenCalledWith(`${apiUrl}/events`);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([[503, 200], [200, 503]])('rejects failed user/event requests (%s/%s)', async (usersStatus, eventsStatus) => {
    const { getHomePageData } = await import('@/data/homepage');
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({}, { status: usersStatus }))
      .mockResolvedValueOnce(Response.json({}, { status: eventsStatus }));

    await expect(getHomePageData(loaderArgs())).rejects.toThrow('Failed to fetch data');
  });

  it('reports missing configuration without calling the API', async () => {
    vi.stubEnv('VITE_EVENTS_API_URL', '');
    const { getHomePageData } = await import('@/data/homepage');

    await expect(getHomePageData(loaderArgs())).rejects.toThrow('VITE_EVENTS_API_URL');
    expect(fetch).not.toHaveBeenCalled();
  });
});
