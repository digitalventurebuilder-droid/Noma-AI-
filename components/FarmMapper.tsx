
import React, { useState, useEffect } from 'react';
import { SupportedLanguage, FarmMappingResult } from '../types';
import { mapFarmLocation } from '../services/geminiService';

interface FarmMapperProps {
  language: SupportedLanguage;
  onHome: () => void;
  onSetSize: (area: number) => void;
}

export const FarmMapper: React.FC<FarmMapperProps> = ({ language, onHome, onSetSize }) => {
  const [mapping, setMapping] = useState<FarmMappingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0 });
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const result = await mapFarmLocation(latitude, longitude, language);
        setMapping(result);
        setIsLoading(false);
      }, () => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [language]);

  const calculateArea = () => {
    const area = dimensions.length * dimensions.width;
    onSetSize(area);
    alert(`Farm size set to ${area} sqm. This will update your fertilizer calculations!`);
    onHome();
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 mb-6">
        <div className="h-56 bg-gray-50 relative overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-center">
               <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <svg className="w-6 h-6 text-blue-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse px-10 leading-relaxed">
                  Pinging regional satellite data...<br/>Detecting soil spatial context
               </p>
            </div>
          ) : coords ? (
             <div className="w-full h-full bg-[url('https://api.placeholder.com/400/200')] bg-cover flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-xl mb-3 border border-gray-50 transform -rotate-3 hover:rotate-0 transition-transform">
                   <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white shadow-sm flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   <p className="text-[10px] font-black text-gray-900 tracking-wider">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                   </p>
                </div>
             </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center px-10">
               <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <p className="text-sm font-black text-gray-800 uppercase tracking-tight">Location Access Denied</p>
               <p className="text-[10px] font-bold text-gray-400 leading-snug">Please enable GPS to get spatial soil analysis for your farm.</p>
            </div>
          )}
        </div>

        <div className="p-8">
           <h3 className="font-black text-gray-900 text-lg mb-2">Regional Insights</h3>
           <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              {isLoading ? "Consulting spatial data..." : mapping?.locationDescription}
           </p>
           
           <div className="flex flex-wrap gap-2 mb-2">
              {mapping?.links.map((link, i) => (
                <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-colors">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                   {link.title.toUpperCase()}
                </a>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 mb-8">
         <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-[0.2em] mb-6">Size Your Land (Meters)</h3>
         <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Length</label>
               <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:ring-2 focus:ring-brand-green/20" 
                  placeholder="0"
                  onChange={(e) => setDimensions({...dimensions, length: Number(e.target.value)})}
               />
            </div>
            <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Width</label>
               <input 
                  type="number" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:ring-2 focus:ring-brand-green/20" 
                  placeholder="0"
                  onChange={(e) => setDimensions({...dimensions, width: Number(e.target.value)})}
               />
            </div>
         </div>
         <div className="mt-6 p-5 bg-orange-50 rounded-[28px] flex justify-between items-center border border-orange-100 shadow-inner">
            <span className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Total Area</span>
            <span className="text-xl font-black text-brand-orange">{dimensions.length * dimensions.width} sqm</span>
         </div>
         <button 
            onClick={calculateArea}
            className="w-full mt-6 py-5 bg-brand-green text-white font-black rounded-2xl shadow-xl shadow-green-900/20 transition-all active:scale-95"
         >
            Confirm Land Size
         </button>
      </div>
    </div>
  );
};
