
import React, { useState, useEffect, useRef } from 'react';
import { AppState, SupportedLanguage, DiagnosisResult, PestIdentificationResult, UserProfile } from './types';
import { Header } from './components/Header';
import { CameraCapture } from './components/CameraCapture';
import { DiagnosisReport } from './components/DiagnosisReport';
import { PestReport } from './components/PestReport';
import { analyzeCropImage, identifyPest } from './services/geminiService';
import { LandingPage } from './components/LandingPage';
import { ChatInterface } from './components/ChatInterface';
import { NutrientScanner } from './components/NutrientScanner';
import { InputCalculator } from './components/InputCalculator';
import { LiveTalk } from './components/LiveTalk';
import { FarmMapper } from './components/FarmMapper';
import { Auth } from './components/Auth';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const InformativeLoading: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    "Consulting regional agronomic databases...",
    "Analyzing leaf venation for early stress signs...",
    "Cross-referencing with known pest phenotypes...",
    "Evaluating microclimate impact on your crops...",
    "Noma is preparing your personalized farm report...",
    "Finalizing diagnosis with historical regional data..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-12">
        {/* Animated Background Rings */}
        <div className="absolute inset-0 scale-150 border-2 border-brand-green/10 rounded-full animate-ping"></div>
        <div className="absolute inset-0 scale-110 border-4 border-brand-green/5 rounded-full animate-pulse [animation-duration:3s]"></div>
        
        {/* Main Logo Spinner */}
        <div className="w-28 h-28 bg-white rounded-[40px] shadow-2xl flex items-center justify-center relative z-10 border border-gray-50">
           <div className="w-16 h-16 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-green" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C12 22 4 18 4 10C4 5 7 2 12 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="6" r="2.5" fill="currentColor"/>
              </svg>
           </div>
        </div>
      </div>
      
      <h2 className="text-xl font-black text-gray-900 mb-2">Analyzing Samples</h2>
      <div className="h-12 flex items-center justify-center">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse transition-all duration-500">
          {messages[msgIndex]}
        </p>
      </div>
      
      {/* Progress Bar Emulation */}
      <div className="w-full max-w-[200px] h-1.5 bg-gray-100 rounded-full mt-8 overflow-hidden">
        <div className="h-full bg-brand-green w-1/2 animate-[progress_10s_ease-in-out_infinite]"></div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(20%); }
          100% { width: 100%; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const savedLang = localStorage.getItem('noma_language');
    return (savedLang as SupportedLanguage) || SupportedLanguage.ENGLISH;
  });

  useEffect(() => {
    localStorage.setItem('noma_language', language);
  }, [language]);

  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [pestResult, setPestResult] = useState<PestIdentificationResult | null>(null);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [farmArea, setFarmArea] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        // Recover profile from local storage if available
        const savedUser = localStorage.getItem(`noma_profile_${firebaseUser.uid}`);
        if (savedUser) {
          setUserProfile({ ...JSON.parse(savedUser), isGuest: false });
        } else {
          // Fallback if no profile stored
          setUserProfile({
            fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Farmer",
            location: "Regional Hub",
            primaryCrop: "Maize",
            isGuest: false
          });
        }
        setAppState(AppState.HOME);
      } else {
        // Guest Mode: Allow access without forcing Auth
        if (firebaseUser && !firebaseUser.emailVerified) {
          await signOut(auth);
        }
        setUserProfile({
          fullName: "Guest Farmer",
          location: "Regional Hub",
          primaryCrop: "Maize",
          isGuest: true
        });
        
        if (isInitialLoad.current) {
          setAppState(AppState.HOME);
        }
      }
      isInitialLoad.current = false;
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthComplete = (user: UserProfile) => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      localStorage.setItem(`noma_profile_${firebaseUser.uid}`, JSON.stringify(user));
    }
    setUserProfile({ ...user, isGuest: false });
    setAppState(AppState.HOME);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // userProfile will be reset to Guest by the onAuthStateChanged listener
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const handleGuestSignup = () => {
    setAppState(AppState.AUTH);
  };

  const handleCapture = async (base64Image: string) => {
    if (appState === AppState.PEST_SCAN) {
      setAppState(AppState.ANALYZING);
      try {
        const result = await identifyPest(base64Image, language);
        setPestResult(result);
        setAppState(AppState.PEST_RESULT);
      } catch (error: any) {
        if (error.message?.includes("offline")) {
          alert("You are currently offline. Please connect to the internet to analyze images.");
        } else {
          alert("Failed to identify pest.");
        }
        setAppState(AppState.HOME);
      }
    } else {
      setAppState(AppState.ANALYZING);
      try {
        const result = await analyzeCropImage(base64Image, language);
        setDiagnosisResult(result);
        setAppState(AppState.RESULT);
      } catch (error: any) {
        if (error.message?.includes("offline")) {
          alert("You are currently offline. Please connect to the internet to analyze images.");
        } else {
          alert("Failed to analyze image.");
        }
        setAppState(AppState.HOME);
      }
    }
  };

  const renderContent = () => {
    if (isInitializing) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
        </div>
      );
    }

    if (appState === AppState.AUTH) {
      return <Auth onAuthComplete={handleAuthComplete} />;
    }

    switch (appState) {
      case AppState.HOME:
        return (
          <LandingPage 
            language={language}
            setLanguage={setLanguage}
            userProfile={userProfile}
            onStartDiagnosis={() => setAppState(AppState.CAMERA)}
            onStartPest={() => setAppState(AppState.PEST_SCAN)}
            onStartNutrient={() => setAppState(AppState.NUTRIENT_FLOW)}
            onStartChat={(c) => { setChatContext(c); setAppState(AppState.CHAT); }}
            onStartLive={() => setAppState(AppState.LIVE_TALK)}
            onOpenCalculator={() => setAppState(AppState.CALCULATOR)}
            onStartMapper={() => setAppState(AppState.FARM_MAPPER)}
            onSignup={handleGuestSignup}
          />
        );
      case AppState.FARM_MAPPER:
        return <FarmMapper language={language} onHome={() => setAppState(AppState.HOME)} onSetSize={setFarmArea} />;
      case AppState.LIVE_TALK:
        return <LiveTalk language={language} onEnd={() => setAppState(AppState.HOME)} />;
      case AppState.NUTRIENT_FLOW:
        return <NutrientScanner language={language} onHome={() => setAppState(AppState.HOME)} onChat={(c) => { setChatContext(c); setAppState(AppState.CHAT); }} />;
      case AppState.CALCULATOR:
        return <InputCalculator language={language} onBack={() => setAppState(AppState.HOME)} externalArea={farmArea} />;
      case AppState.CAMERA:
      case AppState.PEST_SCAN:
        return <CameraCapture onCapture={handleCapture} />;
      case AppState.ANALYZING:
        return <InformativeLoading />;
      case AppState.RESULT:
        return (
          <DiagnosisReport 
            result={diagnosisResult!} 
            language={language} 
            onReset={() => setAppState(AppState.HOME)} 
            onChat={(c) => { setChatContext(c); setAppState(AppState.CHAT); }}
            userProfile={userProfile}
            onSignup={handleGuestSignup}
          />
        );
      case AppState.PEST_RESULT:
        return (
          <PestReport 
            result={pestResult!} 
            language={language} 
            onReset={() => setAppState(AppState.HOME)} 
            onChat={(c) => { setChatContext(c); setAppState(AppState.CHAT); }}
            userProfile={userProfile}
            onSignup={handleGuestSignup}
          />
        );
      case AppState.CHAT:
        return (
          <ChatInterface 
            language={language} 
            onBack={() => setAppState(AppState.HOME)} 
            initialContext={chatContext} 
            userProfile={userProfile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-gray-900 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        {appState !== AppState.AUTH && !isInitializing && (
          <Header 
            currentState={appState} 
            userProfile={userProfile} 
            onNavigate={setAppState} 
            onLogout={handleLogout} 
            onLogin={handleGuestSignup}
          />
        )}
        <main>{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;
