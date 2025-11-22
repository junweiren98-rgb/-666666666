import React, { useState, useEffect, useRef } from 'react';
import { RetroCamera } from './components/RetroCamera';
import { Polaroid } from './components/Polaroid';
import { MapView } from './components/MapView';
import { Photo, DropZoneRect } from './types';

// Trash icon component
const TrashIcon = () => (
  <svg className="w-10 h-10 mb-2 fill-current" viewBox="0 0 24 24">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

// Publish icon component
const PublishIcon = () => (
  <svg className="w-10 h-10 mb-2 fill-current" viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [printingPhoto, setPrintingPhoto] = useState<Photo | null>(null);
  const [view, setView] = useState<'studio' | 'map'>('studio');
  const publishZoneRef = useRef<HTMLDivElement>(null);
  const trashZoneRef = useRef<HTMLDivElement>(null);

  // Load photos from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('retro_photos');
    if (saved) {
      setPhotos(JSON.parse(saved));
    }
  }, []);

  const getDropZones = (): DropZoneRect[] => {
    const zones: DropZoneRect[] = [];
    if (publishZoneRef.current) {
      zones.push({ id: 'publish', rect: publishZoneRef.current.getBoundingClientRect() });
    }
    if (trashZoneRef.current) {
      zones.push({ id: 'trash', rect: trashZoneRef.current.getBoundingClientRect() });
    }
    return zones;
  };

  const handleCapture = (imgData: string) => {
    if (printingPhoto) return; // Prevent double click while printing

    const newPhoto: Photo = {
      id: Date.now().toString(),
      imgData,
      text: '',
      lat: 39.9042, // Default fallback
      lng: 116.4074,
      timestamp: Date.now(),
      x: window.innerWidth / 2 - 100, // Center-ish
      y: window.innerHeight / 2 + 50,
      rotation: (Math.random() * 20) - 10
    };

    // Fetch location immediately (optimistic)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        newPhoto.lat = pos.coords.latitude + (Math.random() - 0.5) * 0.005; // Add tiny jitter to avoid stacking
        newPhoto.lng = pos.coords.longitude + (Math.random() - 0.5) * 0.005;
      });
    }

    setPrintingPhoto(newPhoto);

    // Animation duration match (2s for eject + some buffer)
    setTimeout(() => {
      setPhotos(prev => [...prev, newPhoto]);
      setPrintingPhoto(null);
    }, 2100);
  };

  const handleTextUpdate = (id: string, text: string) => {
    const updated = photos.map(p => p.id === id ? { ...p, text } : p);
    setPhotos(updated);
    // Only persist published photos usually, but here we persist desk state too for fun
    localStorage.setItem('retro_photos', JSON.stringify(updated));
  };

  const handleDragEnd = (id: string, x: number, y: number, droppedZone?: 'publish' | 'trash') => {
    if (droppedZone === 'trash') {
      const updated = photos.filter(p => p.id !== id);
      setPhotos(updated);
      localStorage.setItem('retro_photos', JSON.stringify(updated));
      return;
    }

    if (droppedZone === 'publish') {
      const photo = photos.find(p => p.id === id);
      if (photo) {
        // In a real app, we'd upload here. For now, we just save to LS as "published" implies saving.
        // We also remove it from the desk view to simulate "sending it away".
        const updated = photos.filter(p => p.id !== id); // Remove from desk
        
        // But we need to keep it in map storage. 
        // Since our map reads from the same state in this demo, 
        // let's just keep it but maybe visually fly it away?
        // For simplicity of this single-state demo: 
        // We will keep it in state, but maybe mark it? 
        // Actually, let's just alert and save.
        
        const updatedWithPos = photos.map(p => p.id === id ? { ...p, x, y } : p);
        setPhotos(updatedWithPos);
        localStorage.setItem('retro_photos', JSON.stringify(updatedWithPos));
        alert("Photo published to the map!");
      }
      return;
    }

    // Just moving on desk
    const updated = photos.map(p => p.id === id ? { ...p, x, y } : p);
    setPhotos(updated);
  };

  return (
    <div className="relative w-full h-screen bg-[#333] overflow-hidden">
      {/* Studio View */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 bg-[#e8e8e8] z-10 flex flex-col md:flex-row overflow-hidden ${view === 'map' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          backgroundImage: 'radial-gradient(#dcdcdc 2px, transparent 2px)',
          backgroundSize: '20px 20px'
        }}
      >
        
        {/* Left/Top: Camera Area */}
        <div className="flex-1 relative flex justify-center items-center h-[60vh] md:h-full z-20 pointer-events-none">
           {/* Pointer events allowed on camera body explicitly */}
           <div className="pointer-events-auto">
             <RetroCamera onCapture={handleCapture} />
           </div>
        </div>

        {/* Right/Bottom: Action Zone */}
        <div className="w-full md:w-[300px] h-[30vh] md:h-full p-6 flex md:flex-col justify-center gap-4 z-0 pointer-events-none">
          <div 
            ref={publishZoneRef}
            className="flex-1 border-4 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-white/40 backdrop-blur-sm pointer-events-auto transition-all hover:bg-white hover:text-[#eecdc8] hover:border-[#eecdc8] hover:scale-105"
          >
             <PublishIcon />
             <span>Publish</span>
          </div>
          <div 
            ref={trashZoneRef}
            className="flex-1 border-4 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-white/40 backdrop-blur-sm pointer-events-auto transition-all hover:bg-white hover:text-red-400 hover:border-red-400 hover:scale-105"
          >
            <TrashIcon />
            <span>Delete</span>
          </div>
        </div>

        {/* Photo Layer (The Desk) */}
        <div className="absolute inset-0 pointer-events-none z-10">
           {/* Active Photos on Desk */}
           {photos.map(photo => (
             <div key={photo.id} className="pointer-events-auto">
               <Polaroid 
                  data={photo} 
                  onUpdateText={handleTextUpdate}
                  onDragEnd={handleDragEnd}
                  getDropZones={getDropZones}
               />
             </div>
           ))}

           {/* Currently Printing Photo */}
           {printingPhoto && (
             <Polaroid 
                key="printing"
                data={printingPhoto}
                isPrinting={true}
                onUpdateText={() => {}}
                onDragEnd={() => {}}
                getDropZones={() => []}
             />
           )}
        </div>
      </div>

      {/* Map View */}
      <MapView photos={photos} active={view === 'map'} />

      {/* Switcher Button */}
      <button 
        onClick={() => setView(prev => prev === 'studio' ? 'map' : 'studio')}
        className="fixed bottom-6 left-6 px-6 py-3 bg-[#333] text-white rounded-full shadow-xl z-50 font-bold active:scale-95 transition-transform flex items-center gap-2"
      >
        {view === 'studio' ? '🌍 Map View' : '📸 Studio View'}
      </button>
    </div>
  );
};

export default App;
