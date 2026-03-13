
import React, { useState, useEffect } from 'react';
import { AppState, UserProfile } from '../types';

interface HeaderProps {
  onNavigate: (state: AppState) => void;
  onLogout: () => void;
  onLogin: () => void;
  currentState: AppState;
  userProfile: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onLogout, onLogin, currentState, userProfile }) => {
  const isHome = currentState === AppState.HOME;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getInitials = () => {
    if (!userProfile?.fullName) return "F";
    return userProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Noma AI',
      text: 'Check out Noma AI - my virtual agronomy advisor. It helps me with crop diagnosis and farm management!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
    setShowProfileMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 transition-all duration-300 backdrop-blur-md bg-white/90 border-b border-green-100">
      <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between relative">
        <button 
          onClick={() => onNavigate(AppState.HOME)} 
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 relative">
             <div className="absolute inset-0 bg-green-100 rounded-xl rotate-3 transition-transform group-hover:rotate-6"></div>
             <div className="absolute inset-0 bg-gradient-to-br from-brand-green to-green-600 rounded-xl shadow-lg flex items-center justify-center -rotate-3 transition-transform group-hover:rotate-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C12 22 4 18 4 10C4 5 7 2 12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22C12 22 20 18 20 10C20 5 17 2 12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5"/>
                  <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 12L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="6" r="2" fill="currentColor"/>
                </svg>
             </div>
          </div>
          
          <div className="flex flex-col items-start leading-none">
            <span className="font-extrabold text-xl tracking-tight text-gray-900">Noma<span className="text-brand-green">AI</span></span>
            <span className="text-[10px] font-semibold text-brand-orange uppercase tracking-wider">Agri-Advisor</span>
          </div>
        </button>

        {isOffline && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full shadow-sm">
            <div className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Offline Mode</span>
          </div>
        )}
        
        {!isHome ? (
          <button 
            onClick={() => onNavigate(AppState.HOME)}
            className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
           userProfile?.isGuest ? (
             <button 
               onClick={onLogin}
               className="px-4 py-2 bg-brand-green text-white text-xs font-bold rounded-full shadow-md active:scale-95 transition-transform"
             >
               Log In
             </button>
           ) : (
             <div className="relative">
               <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-100 to-orange-50 flex items-center justify-center text-brand-orange border border-orange-200 shadow-sm active:scale-90 transition-transform"
               >
                 <span className="font-bold text-sm">{getInitials()}</span>
               </button>
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>

               {showProfileMenu && (
                 <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in zoom-in-95">
                   <div className="p-3 border-b border-gray-50 mb-1">
                      <p className="text-xs font-black text-gray-900 truncate">{userProfile?.fullName}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{userProfile?.primaryCrop} Farmer</p>
                   </div>
                   <button 
                      onClick={handleShareApp}
                      className="w-full text-left p-3 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-black flex items-center gap-2"
                   >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Share App
                   </button>
                   <button 
                      onClick={() => { onLogout(); setShowProfileMenu(false); }}
                      className="w-full text-left p-3 text-red-500 hover:bg-red-50 rounded-xl text-xs font-black flex items-center gap-2"
                   >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Log Out
                   </button>
                 </div>
               )}
             </div>
           )
        )}
      </div>

      {showShareToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-xs font-black shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          Link copied to clipboard!
        </div>
      )}
    </header>
  );
};
