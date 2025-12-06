import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix para los iconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Iconos personalizados para origen y destino
const originIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#10b981" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const destinationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface MapSelectorProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  onOriginSelect: (lat: number, lng: number) => void;
  onDestinationSelect: (lat: number, lng: number) => void;
  selectionMode: 'origin' | 'destination' | null;
  onSelectionModeChange: (mode: 'origin' | 'destination' | null) => void;
  mapHeight?: number; // Altura personalizada del mapa
}

// Componente para manejar clicks en el mapa
function MapClickHandler({
  onOriginSelect,
  onDestinationSelect,
  selectionMode,
}: {
  onOriginSelect: (lat: number, lng: number) => void;
  onDestinationSelect: (lat: number, lng: number) => void;
  selectionMode: 'origin' | 'destination' | null;
}) {
  useMapEvents({
    click: (e) => {
      if (selectionMode === 'origin') {
        onOriginSelect(e.latlng.lat, e.latlng.lng);
      } else if (selectionMode === 'destination') {
        onDestinationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Componente para actualizar la posición de los marcadores cuando cambian las props
function UpdatableMarker({ 
  position, 
  icon, 
  children,
  markerKey 
}: { 
  position: [number, number]; 
  icon: L.Icon; 
  children: React.ReactNode;
  markerKey: string;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  return (
    <Marker
      key={markerKey}
      position={position}
      icon={icon}
      ref={markerRef}
    >
      {children}
    </Marker>
  );
}

// Componente para ajustar los bounds del mapa cuando hay origen y destino
function MapBounds({ origin, destination }: { origin: { lat: number; lng: number } | null; destination: { lat: number; lng: number } | null }) {
  const map = useMapEvents({});
  
  useEffect(() => {
    if (origin && destination && origin.lat !== 0 && origin.lng !== 0 && destination.lat !== 0 && destination.lng !== 0) {
      const bounds = L.latLngBounds([origin, destination]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin && origin.lat !== 0 && origin.lng !== 0) {
      map.setView([origin.lat, origin.lng], map.getZoom());
    } else if (destination && destination.lat !== 0 && destination.lng !== 0) {
      map.setView([destination.lat, destination.lng], map.getZoom());
    }
  }, [origin, destination, map]);
  
  return null;
}

const MapSelector: React.FC<MapSelectorProps> = ({
  origin,
  destination,
  onOriginSelect,
  onDestinationSelect,
  selectionMode,
  onSelectionModeChange,
  mapHeight = 500,
}) => {
  const [center, setCenter] = useState<[number, number]>([4.6097, -74.0817]); // Bogotá por defecto
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Debug: Log cuando cambian las props
  useEffect(() => {
    console.log('🗺️ MapSelector recibió nuevas props:', { origin, destination });
  }, [origin, destination]);

  // Obtener ubicación del usuario al cargar
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setIsLoadingLocation(false);
        },
        () => {
          setIsLoadingLocation(false);
        }
      );
    }
  }, []);

  // Ajustar el centro del mapa cuando se seleccionan puntos
  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds([origin, destination]);
      // El mapa se ajustará automáticamente con el componente MapBounds
    } else if (origin) {
      setCenter([origin.lat, origin.lng]);
    } else if (destination) {
      setCenter([destination.lat, destination.lng]);
    }
  }, [origin, destination]);


  return (
    <div className="space-y-4">
      {/* Controles de selección */}
      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={() => onSelectionModeChange(selectionMode === 'origin' ? null : 'origin')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            selectionMode === 'origin'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
          {origin ? 'Cambiar Origen' : 'Seleccionar Origen'}
        </button>
        <button
          type="button"
          onClick={() => onSelectionModeChange(selectionMode === 'destination' ? null : 'destination')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            selectionMode === 'destination'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
          {destination ? 'Cambiar Destino' : 'Seleccionar Destino'}
        </button>
        <button
          type="button"
          onClick={() => {
            onOriginSelect(0, 0);
            onDestinationSelect(0, 0);
            onSelectionModeChange(null);
          }}
          disabled={!origin && !destination}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            (origin || destination)
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          Limpiar Todo
        </button>
      </div>

      {/* Instrucciones */}
      {selectionMode && (
        <div className={`p-3 rounded-lg ${
          selectionMode === 'origin' ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
        }`}>
          <p className="text-sm text-white">
            {selectionMode === 'origin'
              ? '🟢 Haz clic en el mapa para seleccionar el origen'
              : '🔴 Haz clic en el mapa para seleccionar el destino'}
          </p>
        </div>
      )}

      {/* Mapa */}
      <div className="border border-slate-700 rounded-lg overflow-hidden" style={{ height: `${mapHeight}px`, zIndex: 0 }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler
            onOriginSelect={onOriginSelect}
            onDestinationSelect={onDestinationSelect}
            selectionMode={selectionMode}
          />
          <MapBounds origin={origin} destination={destination} />
          {origin && origin.lat !== 0 && origin.lng !== 0 && (
            <UpdatableMarker
              markerKey={`origin-${origin.lat}-${origin.lng}`}
              position={[origin.lat, origin.lng]}
              icon={originIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-green-600">Origen</p>
                  <p className="text-xs text-slate-600">
                    {origin.lat.toFixed(6)}, {origin.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </UpdatableMarker>
          )}
          {destination && destination.lat !== 0 && destination.lng !== 0 && (
            <UpdatableMarker
              markerKey={`destination-${destination.lat}-${destination.lng}`}
              position={[destination.lat, destination.lng]}
              icon={destinationIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold text-red-600">Destino</p>
                  <p className="text-xs text-slate-600">
                    {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </UpdatableMarker>
          )}
          {origin && destination && origin.lat !== 0 && origin.lng !== 0 && destination.lat !== 0 && destination.lng !== 0 && (
            <Polyline
              key={`polyline-${origin.lat}-${origin.lng}-${destination.lat}-${destination.lng}`}
              positions={[[origin.lat, origin.lng], [destination.lat, destination.lng]]}
              color="#3b82f6"
              weight={3}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapSelector;

