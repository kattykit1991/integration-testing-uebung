import type { Event } from '@/types';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const PanOnHover = ({ event }: { event: Event | null }) => {
  const map = useMap();

  useEffect(() => {
    if (event) {
      const padding = 0.01;
      const { latitude, longitude } = event;

      map.panTo([latitude, longitude]);
      const bounds = L.latLngBounds(
        [latitude - padding, longitude - padding],
        [latitude + padding, longitude + padding]
      );
      map.flyToBounds(bounds, {
        padding: [20, 20],
        maxZoom: 16,
        animate: true
      });
    }
  }, [map, event]);

  return null;
};
export default PanOnHover;
