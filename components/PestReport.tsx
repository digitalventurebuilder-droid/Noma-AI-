
import React, { useState, useEffect } from 'react';
import { PestIdentificationResult, SupportedLanguage, UserProfile } from '../types';
import { generateSpeech } from '../services/geminiService';

interface PestReportProps {
  result: PestIdentificationResult;
  language: SupportedLanguage;
  onReset: () => void;
  onChat: (context: string) => void;
  userProfile: UserProfile | null;
  onSignup: () => void;
}

export const PestReport: React.FC<PestReportProps> = ({ result, language, onReset, onChat, userProfile, onSignup }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    const loadAudio = async () => {
      setIsLoadingAudio(true);
      const textToRead = `${result.pestName}. It is a ${result.type}. ${result.description}. Threat level is ${result.threatLevel}.`;
      const buffer = await generateSpeech(textToRead, language);
      setAudioBuffer(buffer);
      setIsLoadingAudio(false);
    };
    loadAudio();
  }, [result, language]);

  const playAudio = () => {
    if (!audioBuffer) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    setIsPlaying(true);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Noma AI - Pest Report',
      text: `Noma AI found a ${result.pestName} (${result.type}) on my farm. Threat level: ${result.threatLevel}. Details: ${result.description}`,
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

  const threatColor = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-orange-100 text-orange-800',
    'High': 'bg-red-100 text-red-800'
  }[result.threatLevel] || 'bg-gray-100 text-gray-800';

  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <div className="bg-brand-orange text-white p-4 rounded-2xl shadow-lg mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm opacity-90">Listen to Identification</h3>
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
            className="w-12 h-12 rounded-full bg-white text-brand-orange flex items-center justify-center hover:bg-white/90 transition disabled:opacity-50"
          >
            {isLoadingAudio ? '...' : isPlaying ? '■' : '▶'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">{result.type}</p>
              <h2 className="text-2xl font-bold text-gray-900">{result.pestName}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${threatColor}`}>
              {result.threatLevel} Threat
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed mt-2">{result.description}</p>
        </div>

        {userProfile?.isGuest && (
          <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between">
             <p className="text-xs text-gray-500 font-bold">Save this report to your history?</p>
             <button 
               onClick={onSignup}
               className="text-xs font-black text-brand-orange uppercase tracking-wide hover:underline"
             >
               Sign Up to Save
             </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-l-4 border-l-brand-orange border-gray-100">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            🌿 Local Remedies
          </h4>
          <ul className="space-y-2">
            {result.localRemedies.map((r, i) => (
              <li key={i} className="flex gap-3 text-gray-700 text-sm">
                <span className="font-bold text-brand-orange">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-l-4 border-l-brand-green border-gray-100">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            🛡️ Prevention
          </h4>
          <ul className="space-y-2">
            {result.preventiveMeasures.map((m, i) => (
              <li key={i} className="flex gap-3 text-gray-700 text-sm">
                <span className="font-bold text-brand-green">•</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onReset} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold">
          Back Home
        </button>
        <button onClick={() => onChat(`I found a ${result.pestName} on my farm. Can you tell me more about its control?`)} className="flex-1 py-3.5 bg-brand-orange text-white rounded-xl font-bold">
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
