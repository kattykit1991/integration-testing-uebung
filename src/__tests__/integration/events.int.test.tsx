import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ReactNode } from 'react';
import type { Event, EventsResponse } from '@/types';
import { Events, Home, NotFound } from '@/pages';
import { ErrorBoundary, Loading } from '@/components';
import { getAllEvents, getHomePageData } from '@/data';

const map = vi.hoisted(() => ({ fitBounds: vi.fn(), panTo: vi.fn(), flyToBounds: vi.fn() }));
const markerPositions = vi.hoisted(() => vi.fn());

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ position }: { position: [number, number] }) => {
    markerPositions(position);
    return null;
  },
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMap: () => map
}));

const firstEvent: Event = {
  id: 1, title: 'Berlin meetup', description: 'Meet local developers',
  date: '2026-12-01T18:00:00Z', location: 'Berlin', latitude: 52.52, longitude: 13.405,
  organizerId: 7, createdAt: '2026-11-01', updatedAt: '2026-11-01'
};
const secondEvent: Event = { ...firstEvent, id: 2, title: 'Hamburg meetup', description: 'Meet in Hamburg', location: 'Hamburg', latitude: 53.55, longitude: 10 };

const page = (results: Event[], currentPage = 1, hasNextPage = false): EventsResponse => ({
  results, currentPage, hasNextPage, hasPreviousPage: currentPage > 1,
  totalCount: 2, totalPages: 2
});

const observers: { callback: IntersectionObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
let router: ReturnType<typeof createMemoryRouter>;

const renderRoutes = (path: string) => {
  router = createMemoryRouter([
    { path: '/', element: <Home />, loader: getHomePageData, errorElement: <ErrorBoundary />, hydrateFallbackElement: <Loading /> },
    { path: '/events', element: <Events />, loader: getAllEvents, errorElement: <ErrorBoundary />, hydrateFallbackElement: <Loading /> },
    { path: '*', element: <NotFound /> }
  ], { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
};

const intersect = async (isIntersecting: boolean) => {
  const observer = observers.at(-1)!;
  await act(async () => {
    observer.callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  observers.length = 0;
  vi.stubGlobal('IntersectionObserver', class {
    observe = vi.fn();
    disconnect = vi.fn();
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      observers.push(this);
    }
  });
  vi.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  cleanup();
  router?.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('event browsing', () => {
  it('shows API events and moves the map to the selected event', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(page([firstEvent, secondEvent])));
    renderRoutes('/events');

    expect(await screen.findByRole('heading', { name: firstEvent.title })).toBeInTheDocument();
    expect(screen.getByText(firstEvent.description)).toBeInTheDocument();
    expect(markerPositions).toHaveBeenCalledWith([52.52, 13.405]);
    expect(markerPositions).toHaveBeenCalledWith([53.55, 10]);
    expect(map.fitBounds).toHaveBeenLastCalledWith([[52.52, 13.405], [53.55, 10]]);
    expect(map.panTo).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('heading', { name: secondEvent.title }));

    expect(map.panTo).toHaveBeenCalledExactlyOnceWith([53.55, 10]);
    const [bounds, options] = map.flyToBounds.mock.calls[0];
    expect(bounds.getSouthWest().lat).toBeCloseTo(53.54);
    expect(bounds.getSouthWest().lng).toBeCloseTo(9.99);
    expect(bounds.getNorthEast().lat).toBeCloseTo(53.56);
    expect(bounds.getNorthEast().lng).toBeCloseTo(10.01);
    expect(options).toEqual({ padding: [20, 20], maxZoom: 16, animate: true });
  });

  it('loads the next page on intersection, prevents duplicate requests and stops at the last page', async () => {
    let resolveNext!: (response: Response) => void;
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json(page([firstEvent], 1, true)))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNext = resolve; }));
    const view = renderRoutes('/events');
    await screen.findByRole('heading', { name: firstEvent.title });
    expect(observers.at(-1)!.observe).toHaveBeenCalledWith(expect.any(HTMLDivElement));

    await intersect(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    await intersect(true);
    expect(fetch).toHaveBeenLastCalledWith('http://localhost:3001/api/events?page=2&limit=10');
    expect(view.container.querySelector('.loading')).toBeInTheDocument();
    await intersect(true);
    expect(fetch).toHaveBeenCalledTimes(2);

    await act(async () => { resolveNext(Response.json(page([secondEvent], 2))); });

    expect(await screen.findByRole('heading', { name: secondEvent.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: firstEvent.title })).toBeInTheDocument();
    expect(view.container.querySelector('.loading')).not.toBeInTheDocument();
    expect(map.fitBounds).toHaveBeenLastCalledWith([[52.52, 13.405], [53.55, 10]]);
    await intersect(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(observers.every((observer) => observer.disconnect.mock.calls.length > 0)).toBe(true);
  });

  it('renders an empty result without event cards', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json(page([])));
    renderRoutes('/events');

    expect(await screen.findByRole('heading', { name: 'Upcoming Events' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });
});

describe('public routes and errors', () => {
  it('shows homepage totals and navigates to the event list', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/users')
      ? Response.json({ totalCount: 17 })
      : Response.json({ ...page([firstEvent]), totalCount: 23 }));
    renderRoutes('/');

    expect(await screen.findByText('17')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Event' })).toHaveAttribute('href', '/app');
    fireEvent.click(screen.getByRole('link', { name: 'Explore Events' }));

    expect(await screen.findByRole('heading', { name: 'Upcoming Events' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/events');
  });

  it('offers a home link for an unknown URL', async () => {
    renderRoutes('/missing');

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '404 Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/');
  });

  it('shows a useful message when the events API fails', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 503 }));
    renderRoutes('/events');

    expect(await screen.findByRole('heading', { name: 'An Error Occurred' })).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch events/)).toBeInTheDocument();
  });

  it.each([
    [() => new Response('Service unavailable', { status: 503 }), '503', 'Service unavailable'],
    [() => 'Unexpected rejection', 'An Error Occurred', 'Something went very wrong']
  ])('renders route errors (%s)', async (error, heading, message) => {
    router = createMemoryRouter([{
      path: '/', element: <Home />, errorElement: <ErrorBoundary />,
      loader: () => { throw error(); }
    }]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(message))).toBeInTheDocument();
  });
});
