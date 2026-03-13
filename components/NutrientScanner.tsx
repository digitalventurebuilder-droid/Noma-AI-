
import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage, NutrientAnalysisResult, NutrientOption } from '../types';
import { analyzeNutrientDeficiency, generateSpeech } from '../services/geminiService';
import { CameraCapture } from './CameraCapture';

interface NutrientScannerProps {
  language: SupportedLanguage;
  onHome: () => void;
  onChat: (context?: string) => void;
}

type WizardStep = 'CONTEXT' | 'GUIDANCE' | 'CAMERA' | 'ANALYZING' | 'NEGOTIATION' | 'PLAN';

export const NutrientScanner: React.FC<NutrientScannerProps> = ({ language, onHome, onChat }) => {
  const [step, setStep] = useState<WizardStep>('CONTEXT');
  const [cropType, setCropType] = useState('');
  const [cropAge, setCropAge] = useState('');
  const [analysis, setAnalysis] = useState<NutrientAnalysisResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<NutrientOption | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play audio guidance when entering specific steps
  useEffect(() => {
    const playGuidance = async () => {
      let text = "";
      if (step === 'GUIDANCE') {
        text = "Please take a clear picture of one leaf. Use a leaf from the middle of the plant. Make sure there is good daylight.";
      } else if (step === 'NEGOTIATION' && analysis) {
        text = `${analysis.explanation}. I found three ways to help. Which one can you do?`;
      }

      if (text) {
        const buffer = await generateSpeech(text, language);
        if (buffer) playAudio(buffer);
      }
    };
    playGuidance();
  }, [step, analysis, language]);

  const playAudio = (buffer: AudioBuffer) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    setIsPlaying(true);
  };

  const handleCapture = async (base64: string) => {
    setStep('ANALYZING');
    try {
      const result = await analyzeNutrientDeficiency(base64, cropType, cropAge, language);
      setAnalysis(result);
      setStep('NEGOTIATION');
    } catch (error: any) {
      if (error.message?.includes("offline")) {
        alert("You are currently offline. Please connect to the internet to analyze nutrients.");
      } else {
        alert("Something went wrong. Please try again.");
      }
      setStep('CONTEXT');
    }
  };

  const renderContext = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-[40px] shadow-sm border border-gray-50 animate-in fade-in duration-300">
      <h2 className="text-2xl font-black mb-2 text-gray-900">Crop Profile</h2>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">Helping Noma identify stage-specific nutrient needs.</p>
      
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Crop Type</label>
          <input 
            type="text" 
            placeholder="e.g. Maize, Tomato (Optional)" 
            className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 outline-none font-bold focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Growth Stage</label>
          <div className="relative">
            <select 
              className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50 outline-none font-bold focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all appearance-none pr-10"
              value={cropAge}
              onChange={(e) => setCropAge(e.target.value)}
            >
              <option value="">I don't know (Optional)</option>
              <option value="Just planted">Just planted (Seedling)</option>
              <option value="Growing">Growing (Vegetative stage)</option>
              <option value="Near harvest">Near harvest (Flowering/Fruiting)</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setStep('GUIDANCE')}
          className="w-full py-5 bg-brand-green text-white font-black rounded-2xl shadow-xl shadow-green-900/10 mt-4 transition-all active:scale-95"
        >
          Proceed to Scanner
        </button>
      </div>
    </div>
  );

  const renderGuidance = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-[40px] text-center border border-gray-50 animate-in slide-in-from-right duration-300">
      <div className="w-20 h-20 bg-green-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-brand-green shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
      </div>
      <h2 className="text-xl font-black mb-2">Scanner Tips</h2>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">For the most accurate leaf analysis.</p>
      
      <div className="text-left space-y-4 mb-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
        <div className="flex gap-4">
            <span className="w-6 h-6 rounded-full bg-green-100 text-brand-green flex items-center justify-center text-xs font-black shrink-0">1</span>
            <p className="text-sm font-bold text-gray-700">Use one leaf from the middle of the plant.</p>
        </div>
        <div className="flex gap-4">
            <span className="w-6 h-6 rounded-full bg-green-100 text-brand-green flex items-center justify-center text-xs font-black shrink-0">2</span>
            <p className="text-sm font-bold text-gray-700">Ensure good daylight (natural brightness).</p>
        </div>
        <div className="flex gap-4">
            <span className="w-6 h-6 rounded-full bg-green-100 text-brand-green flex items-center justify-center text-xs font-black shrink-0">3</span>
            <p className="text-sm font-bold text-gray-700">Keep your hand steady during capture.</p>
        </div>
      </div>
      
      <button 
        onClick={() => setStep('CAMERA')}
        className="w-full py-5 bg-brand-green text-white font-black rounded-2xl shadow-xl shadow-green-900/10 transition-all active:scale-95"
      >
        Open Camera
      </button>
    </div>
  );

  const renderNegotiation = () => {
    if (!analysis) return null;
    return (
      <div className="max-w-md mx-auto pb-20 p-4 animate-in zoom-in duration-300">
        <div className="bg-white p-6 rounded-[32px] shadow-sm mb-6 border-l-4 border-brand-orange border border-gray-100">
          <h2 className="text-xl font-black text-gray-900 mb-2">{analysis.explanation}</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Noma's Visual Estimate • {cropAge || 'General'}</p>
        </div>

        <h3 className="font-black text-gray-900 text-xs uppercase tracking-[0.2em] mb-4 ml-2">Tailored Solutions</h3>

        <div className="space-y-4">
          <div 
            onClick={() => { setSelectedOption(analysis.options.A); setStep('PLAN'); }}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 cursor-pointer hover:border-brand-green hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="flex justify-between items-center mb-2">
               <span className="bg-green-100 text-brand-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Free / Local</span>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{analysis.options.A.duration}</span>
            </div>
            <h4 className="font-black text-gray-900 text-lg mb-1 group-hover:text-brand-green transition-colors">{analysis.options.A.title}</h4>
            <p className="text-gray-500 text-sm font-medium line-clamp-2">{analysis.options.A.description}</p>
          </div>

          <div 
            onClick={() => { setSelectedOption(analysis.options.B); setStep('PLAN'); }}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 cursor-pointer hover:border-brand-green hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="flex justify-between items-center mb-2">
               <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Low Cost</span>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{analysis.options.B.duration}</span>
            </div>
            <h4 className="font-black text-gray-900 text-lg mb-1 group-hover:text-brand-green transition-colors">{analysis.options.B.title}</h4>
            <p className="text-gray-500 text-sm font-medium line-clamp-2">{analysis.options.B.description}</p>
          </div>

          <div 
            onClick={() => { setSelectedOption(analysis.options.C); setStep('PLAN'); }}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 cursor-pointer hover:border-brand-green hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="flex justify-between items-center mb-2">
               <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Best Practice</span>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{analysis.options.C.duration}</span>
            </div>
            <h4 className="font-black text-gray-900 text-lg mb-1 group-hover:text-brand-green transition-colors">{analysis.options.C.title}</h4>
            <p className="text-gray-500 text-sm font-medium line-clamp-2">{analysis.options.C.description}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPlan = () => {
    if (!selectedOption) return null;
    return (
        <div className="max-w-md mx-auto p-4 pb-20 animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 overflow-hidden mb-6 border border-gray-100">
                <div className="bg-brand-green p-6 text-white">
                    <h2 className="text-2xl font-black mb-1">Action Plan</h2>
                    <p className="opacity-80 text-xs font-bold uppercase tracking-widest">{selectedOption.title}</p>
                </div>
                <div className="p-8">
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">Required Materials</h3>
                    <div className="flex flex-wrap gap-2 mb-8">
                        {selectedOption.materials.map((m, i) => (
                            <span key={i} className="bg-gray-50 px-4 py-2 rounded-2xl text-xs font-black text-gray-700 border border-gray-100">{m}</span>
                        ))}
                    </div>

                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-4">Step-by-Step</h3>
                    <div className="space-y-6">
                        {selectedOption.instructions.map((inst, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-orange-500/20">
                                    {i + 1}
                                </div>
                                <p className="text-gray-700 font-medium leading-relaxed">{inst}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-5 bg-blue-50 rounded-[28px] text-blue-800 text-[10px] font-black flex items-center gap-3 border border-blue-100">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        COMPLETION TIME: {selectedOption.duration.toUpperCase()}
                    </div>
                </div>
            </div>

            <button 
                onClick={() => onChat(`I have a plan for nutrient deficiency using ${selectedOption.title}. I have questions about how to apply it to my ${cropType || 'crop'}.`)}
                className="w-full py-5 bg-white border-2 border-brand-green text-brand-green font-black rounded-2xl mb-4 flex items-center justify-center gap-2 hover:bg-green-50 transition-all active:scale-95 shadow-sm"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Chat with Noma
            </button>

            <button 
                onClick={onHome}
                className="w-full py-5 bg-brand-green text-white font-black rounded-2xl mb-4 shadow-xl shadow-green-900/10 transition-all active:scale-95"
            >
                Return Home
            </button>
        </div>
    );
  };

  const InformativeScanning: React.FC = () => {
    const [msgIdx, setMsgIdx] = useState(0);
    const msgs = [
      "Analyzing chlorophyll absorption...",
      "Measuring spectral leaf reflectance...",
      "Identifying nutrient imbalance patterns...",
      "Consulting regional soil benchmarks...",
      "Noma is preparing your treatment plan..."
    ];
    useEffect(() => {
      const i = setInterval(() => setMsgIdx(p => (p + 1) % msgs.length), 2000);
      return () => clearInterval(i);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-10 animate-in fade-in duration-500">
          <div className="relative mb-8">
             <div className="w-20 h-20 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-brand-green rounded-full animate-pulse"></div>
             </div>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Leaf Analysis</h2>
          <div className="h-10 flex items-center justify-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
               {msgs[msgIdx]}
            </p>
          </div>
      </div>
    );
  };

  return (
    <div className="min-h-[80vh]">
      {step === 'CONTEXT' && renderContext()}
      {step === 'GUIDANCE' && renderGuidance()}
      {step === 'CAMERA' && <CameraCapture onCapture={handleCapture} />}
      {step === 'ANALYZING' && <InformativeScanning />}
      {step === 'NEGOTIATION' && renderNegotiation()}
      {step === 'PLAN' && renderPlan()}
    </div>
  );
};
