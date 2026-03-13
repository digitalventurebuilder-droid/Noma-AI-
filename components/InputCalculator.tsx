
import React, { useState } from 'react';
import { SupportedLanguage, InputAnalysisResult } from '../types';
import { analyzeFarmInput } from '../services/geminiService';
import { CameraCapture } from './CameraCapture';

interface InputCalculatorProps {
  language: SupportedLanguage;
  onBack: () => void;
  externalArea?: number;
}

export const InputCalculator: React.FC<InputCalculatorProps> = ({ language, onBack, externalArea }) => {
  const [mode, setMode] = useState<'CALCULATE' | 'SCAN'>('CALCULATE');
  const [scanResult, setScanResult] = useState<InputAnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Simple Calculator State
  const [crop, setCrop] = useState('Maize');
  const [inputType, setInputType] = useState('Urea');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const handleCalculate = () => {
    let baseDosage = "";
    if (inputType === 'Urea') {
      baseDosage = "Mix 2 matchboxes (50g) per 10L.";
    } else if (inputType === 'NPK') {
      baseDosage = "Use 1 bottle cap per plant.";
    } else {
        baseDosage = "Follow label instructions.";
    }

    if (externalArea && externalArea > 0) {
      setCalcResult(`${baseDosage} For your ${externalArea} sqm land, you need approximately ${(externalArea / 400).toFixed(1)} bags of input.`);
    } else {
      setCalcResult(baseDosage);
    }
  };

  const handleScan = async (base64: string) => {
    setIsScanning(true);
    try {
      const result = await analyzeFarmInput(base64, language);
      setScanResult(result);
    } catch (error: any) {
      if (error.message?.includes("offline")) {
        alert("You are currently offline. Please connect to the internet to scan inputs.");
      } else {
        alert("Failed to analyze input.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  if (mode === 'SCAN' && !scanResult && !isScanning) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
         <div className="p-4 bg-white shadow-sm flex items-center gap-2">
            <button onClick={() => setMode('CALCULATE')} className="p-2 rounded-full hover:bg-gray-100">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="font-black text-lg">Scan Packaging</h2>
         </div>
         <div className="p-4">
             <CameraCapture onCapture={handleScan} />
         </div>
      </div>
    );
  }

  if (isScanning) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-10 animate-in fade-in duration-500">
            <div className="relative mb-8">
               <div className="w-20 h-20 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-orange animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4" /></svg>
               </div>
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Analyzing Label</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
               Checking for authenticity and dosage...
            </p>
        </div>
      );
  }

  if (scanResult) {
      return (
        <div className="p-4 pb-20 max-w-md mx-auto animate-in zoom-in duration-300">
             <button onClick={() => { setScanResult(null); setMode('CALCULATE'); }} className="mb-4 text-brand-green font-black flex items-center gap-1">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               Back to Calculator
            </button>
            <div className={`p-6 rounded-[32px] border mb-4 shadow-sm ${scanResult.isLikelyAuthentic ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                <h3 className="font-black text-lg mb-1">{scanResult.productName}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest">{scanResult.isLikelyAuthentic ? '✓ Verified Product' : '⚠ Suspected Counterfeit'}</span>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
                <h4 className="font-black text-gray-400 mb-4 uppercase text-[10px] tracking-[0.2em]">Application Advice</h4>
                <div className="p-4 bg-green-50 rounded-2xl mb-4 border border-green-100">
                   <p className="text-lg text-brand-green font-black">{scanResult.dosage}</p>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{scanResult.usage}</p>
                {scanResult.safetyWarning && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                     <svg className="w-5 h-5 text-brand-orange shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     <p className="text-xs font-bold text-orange-900 leading-snug">{scanResult.safetyWarning}</p>
                  </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-20 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-2xl font-black text-brand-green">Dosage Calculator</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button className="bg-brand-green text-white p-4 rounded-[32px] shadow-lg flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
             <span className="font-black text-[10px] uppercase">Manual Entry</span>
        </button>
        <button onClick={() => setMode('SCAN')} className="bg-white border-2 border-brand-green text-brand-green p-4 rounded-[32px] shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4" /></svg>
             <span className="font-black text-[10px] uppercase">Smart Scan</span>
        </button>
      </div>

      {externalArea && externalArea > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
           <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A2 2 0 013 15.487V5.513a2 2 0 011.553-1.943L9 2l5.447 2.724A2 2 0 0116 6.669V16.669a2 2 0 01-1.553 1.943L9 20z" /></svg>
           </div>
           <div>
              <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Farm Mapper Active</p>
              <p className="text-sm font-black text-blue-900">{externalArea} sqm land detected</p>
           </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-900 mb-4 text-xs uppercase tracking-widest">Configure Inputs</h3>
        <div className="space-y-4">
            <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Crop</label>
                <select value={crop} onChange={(e) => setCrop(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black outline-none focus:ring-2 focus:ring-brand-green/20">
                    <option>Maize</option>
                    <option>Rice</option>
                    <option>Tomato</option>
                    <option>Cassava</option>
                </select>
            </div>
            <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Input</label>
                <select value={inputType} onChange={(e) => setInputType(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black outline-none focus:ring-2 focus:ring-brand-green/20">
                    <option value="Urea">Urea (Fertilizer)</option>
                    <option value="NPK">NPK 15-15-15</option>
                    <option value="SSP">SSP (Phosphorus)</option>
                </select>
            </div>
            <button onClick={handleCalculate} className="w-full py-4 bg-brand-orange text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 mt-2">
                Calculate Dose
            </button>

            {calcResult && (
                <div className="mt-4 p-5 bg-green-50 border border-green-200 rounded-[32px] text-green-900 animate-in zoom-in-95 duration-300">
                    <span className="block text-[10px] font-black text-green-700 uppercase mb-2 tracking-widest">Recommendation</span>
                    <p className="font-black text-sm leading-relaxed">{calcResult}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
