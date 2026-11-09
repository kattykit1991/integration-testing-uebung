import type { Event } from '@/types';
import { Marker, Popup } from 'react-leaflet';

const EventsMarkers = ({ events }: { events: Event[] }) => {
  return events.map((event) => (
    <Marker key={event.id} position={[event.latitude, event.longitude]}>
      <Popup>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <p>
          <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Location:</strong> {event.location}
        </p>
      </Popup>
    </Marker>
  ));
};
export default EventsMarkers;
