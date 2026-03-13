import React from 'react';
import { SupportedLanguage } from '../types';
import { Globe2 } from 'lucide-react';

interface LanguageSelectorProps {
  selected: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onChange }) => {
  return (
    <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
          <Globe2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest">Language / Harshe</h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Select your preferred language</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.values(SupportedLanguage).map((lang) => (
          <button
            key={lang}
            onClick={() => onChange(lang)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 flex-grow sm:flex-grow-0 text-center ${
              selected === lang
                ? 'bg-brand-green text-white shadow-md shadow-green-900/20'
                : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
};
