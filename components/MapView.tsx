import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Photo } from '../types';

interface MapViewProps {
  photos: Photo[];
  active: boolean;
}

export const MapView: React.FC<MapViewProps> = ({ photos, active }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([39.9042, 116.4074], 3);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 13);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    photos.forEach(photo => {
      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background:#eecdc8;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([photo.lat, photo.lng], { icon }).addTo(map);
      
      // Improved Popup Styling to match Polaroid Component proportions
      // Using a slightly larger size and correct aspect ratio
      const popupContent = `
        <div style="
          width: 180px; 
          background: white;
          padding: 10px 10px 30px 10px;
          border-radius: 2px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          font-family: 'Patrick Hand', cursive;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            width: 160px;
            height: 170px;
            background: #f8f8f8;
            border: 1px solid #eee;
            overflow: hidden;
            margin-bottom: 10px;
          ">
            <img src="${photo.imgData}" style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            ">
          </div>
          <p style="
            margin: 0;
            width: 100%;
            font-size: 18px;
            color: #333;
            text-align: center;
            line-height: 1.2;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${photo.text || 'Untitled'}</p>
          <p style="
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #999;
          ">${new Date(photo.timestamp).toLocaleDateString()}</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 220,
        minWidth: 180,
        className: 'polaroid-popup' // Helper class if we needed global styles, but inline works for content
      });
      markersRef.current.push(marker);
    });
  }, [photos]);

  // Handle view visibility transitions
  useEffect(() => {
    if (active && mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [active]);

  return (
    <div 
      className={`absolute top-0 left-0 w-full h-full transition-all duration-500 bg-[#e8e8e8] ${active ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 pointer-events-none z-0'}`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};