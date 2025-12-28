
import React, { useEffect, useRef, useState } from 'react';

// Fix: Declare google as a global variable to resolve "Cannot find name 'google'" errors
declare const google: any;

interface MarkerProps {
  id: string;
  position: [number, number];
  label: string;
  type?: 'truck' | 'destination' | 'pickup';
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MarkerProps[];
  showRoute?: {
    start: [number, number];
    end: [number, number];
  };
}

const MapView: React.FC<MapViewProps> = ({ center, zoom = 13, markers = [], showRoute }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Fix: Use any for google.maps types to resolve "Cannot find namespace 'google'" errors
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const directionsRendererRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(!!(window as any).google?.maps);

  useEffect(() => {
    const handleLoad = () => setIsLoaded(true);
    window.addEventListener('google-maps-loaded', handleLoad);
    return () => window.removeEventListener('google-maps-loaded', handleLoad);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;

    if (!mapRef.current) {
      // Fix: 'google' is now declared globally and can be used as a constructor
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: zoom,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#6c727a" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#e9e9e9" }]
          }
        ]
      });

      // Fix: 'google' is now declared globally
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 6,
          strokeOpacity: 0.8
        }
      });
    }

    // Update markers
    const currentMarkerIds = new Set(markers.map(m => m.id));
    
    // Remove old markers
    Object.keys(markersRef.current).forEach(id => {
      if (!currentMarkerIds.has(id)) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });

    // Add/Update markers
    markers.forEach(m => {
      const position = { lat: m.position[0], lng: m.position[1] };
      
      if (markersRef.current[m.id]) {
        markersRef.current[m.id].setPosition(position);
      } else {
        // Fix: Use any for markers and icons to avoid namespace issues
        let icon: any = '';
        
        if (m.type === 'truck') {
          icon = {
            path: 'M10 17h4V5H2v12h3m15 0h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5M7.5 17.5r2.5M17.5 17.5r2.5',
            fillColor: '#0f172a',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 1.2,
            anchor: new google.maps.Point(12, 12)
          };
        } else if (m.type === 'destination') {
          icon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 8
          };
        } else {
          icon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 8
          };
        }

        markersRef.current[m.id] = new google.maps.Marker({
          position,
          map: mapRef.current!,
          title: m.label,
          icon
        });
      }
    });

    // Handle Route drawing using Google Directions Service
    if (showRoute) {
      // Fix: 'google' is now declared globally
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: showRoute.start[0], lng: showRoute.start[1] },
          destination: { lat: showRoute.end[0], lng: showRoute.end[1] },
          travelMode: google.maps.TravelMode.DRIVING
        },
        (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current?.setDirections(result);
          }
        }
      );
    } else {
      directionsRendererRef.current?.setDirections({ routes: [] } as any);
    }

    // Handle smooth centering when the main position changes (e.g. driver moving)
    const centerLatLng = { lat: center[0], lng: center[1] };
    if (mapRef.current) {
      mapRef.current.panTo(centerLatLng);
    }

  }, [isLoaded, center, zoom, markers, showRoute]);

  return (
    <div ref={mapContainerRef} className="w-full h-full bg-slate-100 relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default MapView;
