import type { Event, EventsResponse } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLoaderData, useFetcher } from 'react-router';
import { MapContainer, TileLayer } from 'react-leaflet';
import { EventsList, EventsMarkers, MapBounds, PanOnHover } from '@/components';
import 'leaflet/dist/leaflet.css';

const Events = () => {
  const initialData = useLoaderData<EventsResponse>();
  const fetcher = useFetcher<EventsResponse>();
  const [allEvents, setAllEvents] = useState(initialData.results);
  const [currentPage, setCurrentPage] = useState(initialData.currentPage);
  const [hasNextPage, setHasNextPage] = useState(initialData.hasNextPage);
  const [highlightedEvent, setHighlightedEvent] = useState<Event | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const loadMoreEvents = useCallback(async () => {
    if (fetcher.state === 'loading' || !hasNextPage) return;
    fetcher.load(`/events?page=${currentPage + 1}&limit=10`);
  }, [currentPage, hasNextPage, fetcher]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      const fetchedData = fetcher.data;
      setAllEvents((prev) => [...prev, ...fetchedData.results]);
      setCurrentPage(fetchedData.currentPage);
      setHasNextPage(fetchedData.hasNextPage);
    }
  }, [fetcher.data, fetcher.state]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreEvents();
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [loadMoreEvents]);

  return (
    <>
      <title>Upcoming Events</title>
      <div className='flex flex-col md:flex-row justify-between gap-5 my-3'>
        <div className='w-full md:w-2/5 p-4 overflow-y-auto'>
          <h1 className='text-2xl font-bold p-4'>Upcoming Events</h1>
          <div className='grid grid-cols-2 gap-4'>
            <EventsList events={allEvents} setHighlightedEvent={setHighlightedEvent} />
            <div ref={observerRef} className='h-4'></div>
          </div>
          {fetcher.state === 'loading' && (
            <div className='w-full flex items-center justify-center'>
              <span className='loading loading-ring loading-xl text-primary'></span>
            </div>
          )}
        </div>
        <div className='hidden md:block md:w-3/5 h-[870px] rounded-2xl overflow-hidden sticky top-20'>
          <MapContainer zoom={13} className='h-full '>
            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
            <MapBounds events={allEvents} />
            <PanOnHover event={highlightedEvent} />
            <EventsMarkers events={allEvents} />
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default Events;
