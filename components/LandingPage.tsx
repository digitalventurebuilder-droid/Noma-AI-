
import React, { useEffect, useState } from 'react';
import { SupportedLanguage, MarketDataResponse, WeatherData, UserProfile } from '../types';
import { LanguageSelector } from './LanguageSelector';
import { fetchMarketPrices, getDailyTip, fetchWeather } from '../services/geminiService';
import { ManagementSection } from './ManagementSection';

interface LandingPageProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  userProfile: UserProfile | null;
  onStartDiagnosis: () => void;
  onStartNutrient: () => void;
  onStartChat: (context?: string) => void;
  onStartLive: () => void;
  onOpenCalculator: () => void;
  onStartPest: () => void;
  onStartMapper: () => void;
  onSignup: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  language, 
  setLanguage, 
  userProfile,
  onStartDiagnosis, 
  onStartNutrient, 
  onStartChat,
  onStartLive,
  onOpenCalculator,
  onStartPest,
  onStartMapper,
  onSignup
}) => {
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [dailyTip, setDailyTip] = useState<string>("Loading your tip...");
  const [isLoading, setIsLoading] = useState(true);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [activeView, setActiveView] = useState<'AGRONOMY' | 'MANAGEMENT'>('AGRONOMY');

  const loadWeather = () => {
    setIsWeatherLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const weather = await fetchWeather(latitude, longitude, language);
          setWeatherData(weather);
          setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setIsWeatherLoading(false);
        },
        async (error) => {
          const weather = await fetchWeather(6.5244, 3.3792, language);
          setWeatherData(weather);
          setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setIsWeatherLoading(false);
        }
      );
    } else {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    const loadMarketAndTip = async () => {
      setIsLoading(true);
      const [prices, tip] = await Promise.all([
        fetchMarketPrices(userProfile?.location || "Nigeria"),
        getDailyTip(language)
      ]);
      setMarketData(prices);
      setDailyTip(tip);
      setIsLoading(false);
    };

    loadMarketAndTip();
    loadWeather();
  }, [language, userProfile]);

  const handleStartAdvisorChat = () => {
    if (!navigator.onLine) {
      alert("You are currently offline. Please connect to the internet to use the Advisor.");
      return;
    }
    const context = `I am looking for some general farming advice and personalized solutions for my farm. Can you help me with some answers based on my profile as a ${userProfile?.primaryCrop} farmer in ${userProfile?.location}?`;
    onStartChat(context);
  };

  const handleFeatureClick = (featureAction: () => void) => {
    if (!navigator.onLine) {
      alert("This feature requires an internet connection. Please connect and try again.");
      return;
    }
    featureAction();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] pb-10 bg-[#FAFAF9]">
      <div className="px-5 pt-6 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Hi, {userProfile?.isGuest ? "Guest" : (userProfile?.fullName.split(' ')[0] || "Farmer")}
          </h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest text-[10px]">
            {activeView === 'AGRONOMY' ? 'Agronomy Dashboard' : 'Farm Management'} • {userProfile?.primaryCrop}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-2xl border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-tighter">Live Monitor</span>
        </div>
      </div>

      {userProfile?.isGuest && (
        <div className="px-5 mb-6">
          <div className="bg-brand-orange/10 border border-brand-orange/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-orange">You are in Guest Mode</p>
              <p className="text-[10px] text-gray-600">Sign up to save your farm data and history.</p>
            </div>
            <button 
              onClick={onSignup}
              className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-transform"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Switcher */}
      <div className="px-5 mb-8">
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-3xl border border-gray-100">
           <button 
              onClick={() => setActiveView('AGRONOMY')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeView === 'AGRONOMY' ? 'bg-white text-brand-green shadow-xl shadow-green-900/5' : 'text-gray-400'}`}
           >
              Agronomy Tools
           </button>
           <button 
              onClick={() => setActiveView('MANAGEMENT')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeView === 'MANAGEMENT' ? 'bg-white text-brand-green shadow-xl shadow-green-900/5' : 'text-gray-400'}`}
           >
              Management
           </button>
        </div>
      </div>

      {activeView === 'AGRONOMY' ? (
        <div className="animate-in fade-in duration-500">
          <div className="px-5 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/95 backdrop-blur-md p-5 rounded-[32px] border border-white shadow-xl shadow-gray-200/40 flex flex-col justify-between relative overflow-hidden transition-all active:scale-[0.98]">
                {isWeatherLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-2 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-2xl"></div>
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      <div className="h-4 w-2/3 bg-gray-100 rounded-full"></div>
                      <div className="h-2 w-1/2 bg-gray-50 rounded-full"></div>
                    </div>
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Detecting Microclimate...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start relative z-10">
                       <div className="flex flex-col">
                          <span className="text-3xl font-black text-gray-900 leading-none">{weatherData?.temp || "--"}</span>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-tighter">Hyperlocal</span>
                          </div>
                       </div>
                    </div>
                    <div className="mt-4 relative z-10">
                      <p className="text-xs font-black text-gray-800 uppercase tracking-wide truncate">{weatherData?.condition}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{weatherData?.locationName}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="relative mb-3">
                  <svg className="w-16 h-16" viewBox="0 0 36 36">
                    <path className="text-gray-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-green-600" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-gray-900">85%</span>
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Health Score</span>
              </div>
            </div>
          </div>

          <div className="px-5 mb-8 space-y-4">
            <button onClick={() => handleFeatureClick(onStartMapper)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[32px] p-4 text-white shadow-lg flex items-center gap-4 transition-all active:scale-[0.98]">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A2 2 0 013 15.487V5.513a2 2 0 011.553-1.943L9 2l5.447 2.724A2 2 0 0116 6.669V16.669a2 2 0 01-1.553 1.943L9 20z" /></svg>
               </div>
               <div className="text-left">
                  <h3 className="font-black text-sm uppercase tracking-widest">Farm Mapper</h3>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight">Size & analyze your land</p>
               </div>
               <div className="ml-auto bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Active</div>
            </button>

            <button 
              onClick={handleStartAdvisorChat} 
              className="w-full bg-white rounded-[32px] p-4 border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center gap-4 transition-all active:scale-[0.98] group"
            >
               <div className="w-12 h-12 bg-green-50 text-brand-green rounded-2xl flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
               </div>
               <div className="text-left">
                  <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest">Talk to Advisor</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Personalized text solutions</p>
               </div>
               <div className="ml-auto w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-brand-green transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
               </div>
            </button>
          </div>

          <div className="px-5 mb-8">
            <button 
                onClick={() => handleFeatureClick(onStartLive)}
                className="group w-full bg-white rounded-[32px] p-2 pr-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-4 transition-all hover:scale-[1.01] active:scale-95"
            >
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-brand-green to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 rounded-[24px] animate-pulse"></div>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </div>
                <div className="text-left flex-1">
                    <h2 className="text-lg font-black text-gray-900 leading-none mb-1">Live Advisor</h2>
                    <p className="text-xs text-gray-500 font-bold tracking-tight">Speak with Noma in Real-Time</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-brand-green group-hover:bg-green-100 transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
            </button>
          </div>

          <div className="px-5 mb-10">
             <h3 className="font-black text-gray-900 text-xs uppercase tracking-[0.2em] mb-4">Agronomy Tools</h3>
             <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handleFeatureClick(onStartDiagnosis)} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center active:scale-95 transition-all group">
                     <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     </div>
                     <span className="font-black text-gray-900 text-[10px] uppercase">Crop Doctor</span>
                 </button>

                 <button onClick={onOpenCalculator} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center active:scale-95 transition-all group">
                     <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                     </div>
                     <span className="font-black text-gray-900 text-[10px] uppercase">Calculator</span>
                 </button>

                 <button onClick={() => handleFeatureClick(onStartPest)} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center active:scale-95 transition-all group">
                     <div className="w-14 h-14 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-all">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V4m0 0L8 8m4-4l4 4m-4 4v4m0 0l4-4m-4 4l-4-4" /></svg>
                     </div>
                     <span className="font-black text-gray-900 text-[10px] uppercase">Pest Doctor</span>
                 </button>

                 <button onClick={() => handleFeatureClick(onStartNutrient)} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center gap-3 text-center active:scale-95 transition-all group">
                     <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                     <span className="font-black text-gray-900 text-[10px] uppercase">Nutrients</span>
                 </button>
             </div>
          </div>
          <div className="px-5">
             <LanguageSelector selected={language} onChange={setLanguage} />
          </div>
        </div>
      ) : (
        <ManagementSection />
      )}
    </div>
  );
};
