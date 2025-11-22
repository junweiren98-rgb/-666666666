import React, { useState, useRef, useEffect } from 'react';
import { Photo, DropZoneRect } from '../types';

interface PolaroidProps {
  data: Photo;
  isPrinting?: boolean;
  onUpdateText: (id: string, text: string) => void;
  onDragEnd: (id: string, x: number, y: number, droppedZone?: 'publish' | 'trash') => void;
  getDropZones: () => DropZoneRect[];
}

export const Polaroid: React.FC<PolaroidProps> = ({ 
  data, 
  isPrinting = false, 
  onUpdateText, 
  onDragEnd,
  getDropZones
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: data.x, y: data.y });
  const ref = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Sync props to state if not dragging (e.g. when first created or loaded)
  useEffect(() => {
    if (!isDragging) {
      setPos({ x: data.x, y: data.y });
    }
  }, [data.x, data.y, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPrinting) return;
    // Don't drag if clicking editable text area
    if ((e.target as HTMLElement).isContentEditable) return;

    setIsDragging(true);
    const rect = ref.current!.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Capture pointer to track movement outside the div
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Check collision
    const zones = getDropZones();
    const photoRect = ref.current!.getBoundingClientRect();
    const photoCenter = {
      x: photoRect.left + photoRect.width / 2,
      y: photoRect.top + photoRect.height / 2
    };

    let droppedZone: 'publish' | 'trash' | undefined;

    for (const zone of zones) {
      if (
        photoCenter.x >= zone.rect.left &&
        photoCenter.x <= zone.rect.right &&
        photoCenter.y >= zone.rect.top &&
        photoCenter.y <= zone.rect.bottom
      ) {
        droppedZone = zone.id;
        break;
      }
    }

    onDragEnd(data.id, pos.x, pos.y, droppedZone);
  };

  const style: React.CSSProperties = isPrinting 
    ? {
        // Fixed position relative to camera slot during printing
        top: 'calc(50% - 170px)',
        left: 'calc(50% - 270px)', // Adjusted for camera position
        transform: 'rotate(0deg)',
        zIndex: 5, // Behind camera body (z-10)
      } 
    : {
        // Absolute position on the desk
        top: pos.y,
        left: pos.x,
        transform: `rotate(${data.rotation}deg) scale(${isDragging ? 1.05 : 1})`,
        zIndex: isDragging ? 1000 : 100,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        position: 'absolute'
      };

  return (
    <div
      ref={ref}
      className={`
        w-[200px] h-[250px] bg-white p-3 pb-12 shadow-lg flex flex-col select-none cursor-grab active:cursor-grabbing
        ${isPrinting ? 'absolute animate-eject' : ''}
      `}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="w-full h-[190px] bg-gray-100 border border-gray-200 overflow-hidden">
        <img 
          src={data.imgData} 
          alt="Memory" 
          className={`w-full h-full object-cover pointer-events-none ${isPrinting ? 'animate-develop' : ''}`}
          style={{ animationDelay: '1s' }}
        />
      </div>
      <div 
        className="mt-3 text-center text-xl text-gray-700 outline-none border-b border-transparent focus:border-dashed focus:border-gray-400 empty:before:content-['Write_something...'] empty:before:text-gray-300"
        contentEditable={!isPrinting}
        suppressContentEditableWarning
        onBlur={(e) => onUpdateText(data.id, e.currentTarget.innerText)}
      >
        {data.text}
      </div>
    </div>
  );
};
