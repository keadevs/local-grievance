'use client';

import L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import { Button } from '@/components/ui';

/** Pune city centre (Shivajinagar) — default map focus. */
const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

// Default Leaflet marker images resolve to broken paths under bundlers; use an
// inline SVG pin instead so no external asset is required.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 24 32"><path fill="#1b5ff5" stroke="#fff" stroke-width="1.5" d="M12 .8C6.6.8 2.2 5.2 2.2 10.6 2.2 18 12 31 12 31s9.8-13 9.8-20.4C21.8 5.2 17.4.8 12 .8z"/><circle cx="12" cy="10.6" r="3.6" fill="#fff"/></svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

function ClickHandler({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvents({
    click(event) {
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

function Recenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 16));
  }, [map, position]);
  return null;
}

/** MODULE 2 - geolocation picker used when filing a complaint. */
export default function MapPicker({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const position: [number, number] | null = latitude != null && longitude != null ? [latitude, longitude] : null;

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location services.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Could not read your location. Tap on the map to drop a pin instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" loading={locating} onClick={locate}>
          Use my current location
        </Button>
        <span className="text-xs text-slate-500">
          {position ? `Pinned at ${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Tap the map to drop a pin'}
        </span>
      </div>

      <div className="h-72 overflow-hidden rounded-xl ring-1 ring-slate-200 sm:h-80">
        <MapContainer center={position ?? PUNE_CENTER} zoom={position ? 16 : 12} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickHandler onChange={onChange} />
          <Recenter position={position} />
          {position && <Marker position={position} icon={pinIcon} />}
        </MapContainer>
      </div>

      {error && <p className="text-xs font-medium text-amber-700">{error}</p>}
    </div>
  );
}
