
import React, { useState, useEffect } from 'react';
import { DiagnosisResult, SupportedLanguage, UserProfile } from '../types';
import { generateSpeech } from '../services/geminiService';

interface DiagnosisReportProps {
  result: DiagnosisResult;
  language: SupportedLanguage;
  onReset: () => void;
  onChat: (context: string) => void;
  userProfile: UserProfile | null;
  onSignup: () => void;
}

export const DiagnosisReport: React.FC<DiagnosisReportProps> = ({ result, language, onReset, onChat, userProfile, onSignup }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    // Pre-load audio when component mounts
    const loadAudio = async () => {
      setIsLoadingAudio(true);
      const textToRead = `${result.crop}. ${result.diagnosis}. ${result.description}`;
      const buffer = await generateSpeech(textToRead, language);
      setAudioBuffer(buffer);
      setIsLoadingAudio(false);
    };
    loadAudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, language]);

  const playAudio = () => {
    if (!audioBuffer) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    setIsPlaying(true);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Noma AI - Crop Diagnosis',
      text: `Noma AI diagnosed my ${result.crop} with ${result.diagnosis}. Diagnosis: ${result.description}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      } catch (err) {
        console.error('Failed to copy report:', err);
      }
    }
  };

  const severityColor = {
    'Low': 'bg-yellow-100 text-yellow-800',
    'Medium': 'bg-orange-100 text-orange-800',
    'High': 'bg-red-100 text-red-800',
    'None': 'bg-green-100 text-green-800'
  }[result.severity] || 'bg-gray-100 text-gray-800';

  const handleDiscuss = () => {
    const context = `I analyzed a ${result.crop} crop. The diagnosis was ${result.diagnosis} (${result.severity} severity). Description: ${result.description}. Organic advice given: ${result.advice.organic.join(', ')}.`;
    onChat(context);
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      {/* Audio Player Banner */}
      <div className="bg-brand-green text-white p-4 rounded-2xl shadow-lg mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm opacity-90">Listen to Advice</h3>
          <p className="text-xs opacity-75">{language}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
            title="Share Report"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
          <button 
            onClick={playAudio}
            disabled={isLoadingAudio || !audioBuffer}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition disabled:opacity-50 text-brand-green"
          >
            {isLoadingAudio ? (
              <svg className="animate-spin h-6 w-6 text-brand-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isPlaying ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Diagnosis */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">{result.crop}</p>
              <h2 className="text-2xl font-bold text-gray-900">{result.diagnosis}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${severityColor}`}>
              {result.severity} Risk
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed mt-2">{result.description}</p>
        </div>
        
        {userProfile?.isGuest && (
          <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
             <p className="text-xs text-gray-500 font-bold">Save this diagnosis to your history?</p>
             <button 
               onClick={onSignup}
               className="text-xs font-black text-brand-green uppercase tracking-wide hover:underline"
             >
               Sign Up to Save
             </button>
          </div>
        )}
      </div>

      {/* Action Plan */}
      <h3 className="font-bold text-lg text-gray-800 mb-3 px-1">Action Plan</h3>
      
      <div className="space-y-4">
        {/* Organic */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-l-4 border-l-brand-green border-gray-100">
          <div className="flex items-center gap-2 mb-3">
             <div className="p-1.5 bg-green-100 rounded-lg text-brand-green">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
               </svg>
             </div>
             <h4 className="font-semibold text-gray-900">Low Cost / Organic Solution</h4>
          </div>
          <ul className="space-y-2">
            {result.advice.organic.map((step, i) => (
              <li key={i} className="flex gap-3 text-gray-700 text-sm">
                <span className="font-bold text-brand-green">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Chemical */}
        {result.advice.chemical.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-l-4 border-l-brand-orange border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-orange-100 rounded-lg text-brand-orange">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.761 2.154 18 5.06 18h9.879c2.906 0 4.244-3.239 2.353-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a4 4 0 00-2.329.313l.83-824a3 3 0 00.879-2.12z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Stronger / Chemical Solution</h4>
            </div>
            <ul className="space-y-2">
              {result.advice.chemical.map((step, i) => (
                <li key={i} className="flex gap-3 text-gray-700 text-sm">
                  <span className="font-bold text-brand-orange">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-8">
        <button 
            onClick={onReset}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold active:scale-95 transition-transform"
        >
            Scan New
        </button>
        <button 
            onClick={handleDiscuss}
            className="flex-1 py-3.5 bg-brand-green text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            Ask Advisor
        </button>
      </div>

      {showShareToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-xs font-black shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          Report summary copied!
        </div>
      )}
    </div>
  );
};
