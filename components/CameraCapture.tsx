
import React, { useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      // Remove data URL prefix for API
      const base64Data = preview.split(',')[1];
      onCapture(base64Data);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 flex flex-col items-center justify-center min-h-[70vh]">
      {!preview ? (
        <div className="w-full space-y-4">
          {/* Camera Trigger */}
          <div 
              className="group w-full aspect-[3/4] max-h-[400px] border-3 border-dashed border-gray-300 rounded-[32px] flex flex-col items-center justify-center bg-white cursor-pointer hover:border-brand-green hover:bg-green-50/30 transition-all duration-300 shadow-sm"
              onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 text-brand-green group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Take a Photo</h3>
            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest text-center px-8">Real-time scan with camera</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Gallery Upload Trigger */}
          <button 
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-5 bg-white border-2 border-gray-100 rounded-[28px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-black text-gray-900 text-sm uppercase tracking-widest">Upload from Gallery</span>
            <input
              type="file"
              accept="image/*"
              ref={galleryInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
            <div className="relative w-full aspect-[3/4] max-h-[500px] rounded-[32px] overflow-hidden shadow-2xl mb-8 ring-4 ring-white">
                <img src={preview} alt="Crop Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-50"></div>
            </div>
            
            <div className="flex gap-4 w-full">
                <button 
                    onClick={handleRetake}
                    className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-200 text-gray-700 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-colors"
                >
                    Retake
                </button>
                <button 
                    onClick={handleConfirm}
                    className="flex-1 py-4 px-6 rounded-2xl bg-brand-green text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all"
                >
                    Analyze Sample
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
