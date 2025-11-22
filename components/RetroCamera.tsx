import React, { useRef, useEffect, useState, useCallback } from 'react';

interface RetroCameraProps {
  onCapture: (imgData: string) => void;
  className?: string;
}

export const RetroCamera: React.FC<RetroCameraProps> = ({ onCapture, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isShutterPressed, setShutterPressed] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleShutterClick = useCallback(() => {
    if (!videoRef.current) return;

    setShutterPressed(true);
    setTimeout(() => setShutterPressed(false), 150);

    const canvas = document.createElement('canvas');
    // Use actual video dimensions
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror the image
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0);
      onCapture(canvas.toDataURL('image/png'));
    }
  }, [onCapture]);

  return (
    <div className={`relative w-[340px] h-[340px] select-none ${className}`}>
      {/* Slot for paper ejection - visually behind camera body but logically positioned */}
      <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-[220px] h-[15px] bg-[#2a2a2a] rounded-lg shadow-inner z-0"></div>

      {/* Camera Body */}
      <div className="relative w-full h-full rounded-[60px] z-10 shadow-[20px_30px_50px_rgba(0,0,0,0.15)] transition-transform duration-100"
           style={{
             background: 'linear-gradient(135deg, #fffefb 0%, #f4f0e6 100%)',
             boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.8), inset -5px -5px 15px rgba(0,0,0,0.05), 20px 30px 50px rgba(0,0,0,0.15)'
           }}>
        
        {/* Flash Unit */}
        <div className="absolute top-[30px] right-[35px] w-[60px] h-[60px] bg-[#333] rounded-xl border-2 border-[#ccc] overflow-hidden shadow-sm">
          <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.4)_40%,rgba(255,255,255,0.1))]"></div>
        </div>

        {/* Viewfinder Window */}
        <div className="absolute top-[35px] left-[40px] w-[40px] h-[30px] bg-[#111] rounded border-[3px] border-[#dcdcdc] shadow-inner"></div>

        {/* Lens Assembly */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[240px] h-[240px] rounded-full flex justify-center items-center">
            {/* 1. Pink Base Ring */}
            <div className="absolute w-full h-full rounded-full shadow-[5px_10px_20px_rgba(0,0,0,0.1)]"
                 style={{ background: 'linear-gradient(135deg, #eecdc8, #eebbb5)' }}></div>
            
            {/* 2. Chrome Ring */}
            <div className="absolute w-[85%] h-[85%] rounded-full border border-[#aaa] shadow-inner"
                 style={{ 
                   background: 'conic-gradient(#d7d7d7, #ffffff, #d7d7d7, #999999, #d7d7d7, #ffffff, #d7d7d7)' 
                 }}></div>
            
            {/* 3. Black Barrel & Video */}
            <div className="absolute w-[70%] h-[70%] rounded-full bg-[#1a1a1a] border-4 border-[#333] overflow-hidden shadow-[inset_0_0_20px_#000] flex justify-center items-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover opacity-90 transform -scale-x-100"
              />
            </div>
        </div>

        {/* Shutter Button */}
        <button 
          className="absolute bottom-[30px] right-[30px] w-[60px] h-[60px] rounded-full border-4 border-white cursor-pointer z-20 active:scale-95 transition-all outline-none"
          style={{ 
            background: '#eecdc8',
            boxShadow: isShutterPressed ? 'inset 2px 2px 5px rgba(0,0,0,0.3)' : '3px 5px 10px rgba(0,0,0,0.15), inset 2px 2px 5px rgba(255,255,255,0.8)'
          }}
          onClick={handleShutterClick}
          aria-label="Take photo"
        ></button>

        {/* Decorative grip strip */}
        <div className="absolute bottom-[30px] left-[30px] w-[80px] h-[15px] bg-[#dcdcdc] rounded-full opacity-50"></div>
      </div>
    </div>
  );
};
