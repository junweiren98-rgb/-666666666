export interface Photo {
  id: string;
  imgData: string;
  text: string;
  lat: number;
  lng: number;
  timestamp: number;
  // Visual state for the desk
  x: number;
  y: number;
  rotation: number;
}

export interface DropZoneRect {
  id: 'publish' | 'trash';
  rect: DOMRect;
}
