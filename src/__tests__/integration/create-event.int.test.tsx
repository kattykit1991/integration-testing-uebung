import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider } from '@/contexts';
import { ProtectedLayout } from '@/layouts';
import { CreateEvent } from '@/pages';
import { ErrorBoundary, Loading } from '@/components';
import { getAllEvents } from '@/data';
import { createEventAction } from '@/actions';
import type { Event, EventsResponse } from '@/types';

const user = { id: 7, name: 'Ada', email: 'ada@example.com' };
const ownEvent: Event = {
  id: 1, title: 'My meetup', description: 'An evening with friends', location: 'Berlin',
  date: '2026-12-01T18:00:00Z', latitude: 52.52, longitude: 13.405,
  organizerId: user.id, createdAt: '2026-11-01', updatedAt: '2026-11-01'
};
const otherEvent: Event = { ...ownEvent, id: 2, title: 'Someone else’s event', organizerId: 99 };
const page = (results: Event[], currentPage = 1, hasNextPage = false): EventsResponse => ({
  results, currentPage, hasNextPage, hasPreviousPage: currentPage > 1, totalCount: results.length, totalPages: 2
});
let router: ReturnType<typeof createMemoryRouter>;
const dialogMethods = {
  showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
  close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
};

const renderPage = () => {
  router = createMemoryRouter([
    {
      path: '/app', element: <ProtectedLayout />, action: createEventAction,
      errorElement: <ErrorBoundary />, hydrateFallbackElement: <Loading />,
      children: [{ index: true, element: <CreateEvent />, loader: getAllEvents }]
    },
    { path: '/events', loader: getAllEvents }
  ], { initialEntries: ['/app'] });
  return render(<AuthProvider><RouterProvider router={router} /></AuthProvider>);
};

const fillEventForm = (dialog: HTMLDialogElement) => {
  for (const [name, value] of Object.entries({
    title: 'New meetup', description: 'Bring a friend', date: '2026-12-02T18:00',
    location: 'Berlin', latitude: '52.52', longitude: '13.405'
  })) {
    fireEvent.change(dialog.querySelector(`[name="${name}"]`)!, { target: { value } });
  }
};

const openDialog = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Create New Event' }));
  return screen.getByRole('dialog') as HTMLDialogElement;
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', 'session-token');
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) },
    close: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }) }
  });
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    const address = String(url);
    if (address.endsWith('/auth/profile')) return Response.json(user);
    if (address.includes('/events')) return Response.json(page([ownEvent, otherEvent]));
    throw new Error(`Unexpected request: ${address}`);
  });
});

afterEach(() => {
  cleanup();
  router?.dispose();
  vi.restoreAllMocks();
  for (const [name, descriptor] of Object.entries(dialogMethods)) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
  localStorage.clear();
});

describe('personal event management', () => {
  it('shows only the signed-in user’s events', async () => {
    renderPage();

    expect(await screen.findByText('Welcome back, Ada!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Events (1)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: ownEvent.title })).toBeInTheDocument();
    expect(screen.getByText(ownEvent.description)).toBeInTheDocument();
    expect(screen.queryByText(otherEvent.title)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load More Events' })).not.toBeInTheDocument();
  });

  it('uses the email as a greeting when the profile has no name', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/auth/profile')
      ? Response.json({ ...user, name: '' })
      : Response.json(page([])));
    renderPage();

    expect(await screen.findByText('Welcome back, ada@example.com!')).toBeInTheDocument();
    expect(screen.getByText("You haven't created any events yet.")).toBeInTheDocument();
  });

  it('appends the next page and replaces stale results after revalidation', async () => {
    let resolveNext!: (response: Response) => void;
    let deferNextPage = true;
    let initialPage = page([ownEvent], 1, true);
    const nextEvent = { ...ownEvent, id: 3, title: 'Next meetup' };
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (String(url).endsWith('/auth/profile')) return Response.json(user);
      if (String(url).includes('page=2') && deferNextPage) {
        deferNextPage = false;
        return new Promise((resolve) => { resolveNext = resolve; });
      }
      return Response.json(initialPage);
    });
    renderPage();
    const loadMore = await screen.findByRole('button', { name: 'Load More Events' });
    fireEvent.click(loadMore);

    expect(await screen.findByRole('button', { name: 'Loading...' })).toBeDisabled();
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/events?page=2&limit=10');
    await act(async () => { resolveNext(Response.json(page([nextEvent], 2))); });

    expect(await screen.findByRole('heading', { name: nextEvent.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Events (2)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load More Events' })).not.toBeInTheDocument();
    initialPage = page([]);
    await act(async () => { await router.revalidate(); });

    expect(await screen.findByText("You haven't created any events yet.")).toBeInTheDocument();
    expect(screen.queryByText(ownEvent.title)).not.toBeInTheDocument();
    expect(screen.queryByText(nextEvent.title)).not.toBeInTheDocument();
  });

  it('opens the dialog and clears entered values when cancelling or closing', async () => {
    renderPage();
    const dialog = await openDialog();
    fillEventForm(dialog);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(dialog.open).toBe(false);
    expect(dialog.querySelector('[name="title"]')).toHaveValue('');
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
    await openDialog();
    fillEventForm(dialog);
    fireEvent(dialog, new globalThis.Event('close'));

    expect(dialog.open).toBe(false);
    expect(dialog.querySelector('[name="description"]')).toHaveValue('');
  });

  it('shows validation errors and closes and resets the form only after successful submission', async () => {
    let resolvePost!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(async (url, options) => {
      if (String(url).endsWith('/auth/profile')) return Response.json(user);
      if (options?.method === 'POST') return new Promise((resolve) => { resolvePost = resolve; });
      return Response.json(page([]));
    });
    renderPage();
    const dialog = await openDialog();
    fillEventForm(dialog);
    fireEvent.change(dialog.querySelector('[name="latitude"]')!, { target: { value: '91' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }));

    expect(await screen.findByText(/Latitude must be ≤ 90°/)).toBeInTheDocument();
    expect(dialog.open).toBe(true);
    expect(vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(0);
    fireEvent.change(dialog.querySelector('[name="latitude"]')!, { target: { value: '52.52' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Create Event' })).toBeDisabled());
    await waitFor(() => expect(resolvePost).toBeTypeOf('function'));
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/events', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        title: 'New meetup', description: 'Bring a friend', date: '2026-12-02T18:00',
        location: 'Berlin', latitude: 52.52, longitude: 13.405, organizerId: user.id
      }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer session-token' }
    }));
    await act(async () => { resolvePost(Response.json({ id: 3 }, { status: 201 })); });

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(dialog.querySelector('[name="title"]')).toHaveValue('');
    expect(dialog.querySelector('[name="latitude"]')).toHaveValue(null);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
