import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { createChatSession, sendChatMessage } from '../services/geminiService';
import { ChatMessage, SupportedLanguage, UserProfile } from '../types';

interface ChatInterfaceProps {
  language: SupportedLanguage;
  initialContext?: string;
  userProfile: UserProfile | null;
  onBack?: () => void;
}

const MAX_CHARS = 1000;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ language, initialContext, userProfile, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);

  const chatHistoryKey = `noma_chat_history_${userProfile?.isGuest ? 'guest' : userProfile?.fullName}`;

  useEffect(() => {
    const initChat = () => {
      try {
        const profileContext = userProfile 
          ? `User is ${userProfile.fullName}, a ${userProfile.primaryCrop} farmer in ${userProfile.location}. ${userProfile.isGuest ? "User is a guest." : ""}`
          : "User is a guest farmer.";
        
        const fullContext = `${profileContext} ${initialContext || ""}`;
        
        const savedHistory = localStorage.getItem(chatHistoryKey);
        let loadedMessages: ChatMessage[] = [];
        let geminiHistory: any[] = [];

        if (savedHistory && !initialContext) {
            try {
                const parsed = JSON.parse(savedHistory);
                loadedMessages = parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
                geminiHistory = loadedMessages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }]
                }));
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
        
        chatSessionRef.current = createChatSession(language, fullContext, geminiHistory.length > 0 ? geminiHistory : undefined);
        setErrorState(null);

        if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
        } else {
            // Initial greeting
            const greetings: Record<SupportedLanguage, string> = {
              [SupportedLanguage.ENGLISH]: `Hello ${userProfile?.fullName.split(' ')[0] || "Farmer"}! I am Noma, your farming advisor. How can I help your farm today?`,
              [SupportedLanguage.HAUSA]: `Sannu ${userProfile?.fullName.split(' ')[0] || "Manomi"}! Ni ne Noma, mai ba ku shawara kan noma. Ta yaya zan taimake ku a gonar ku yau?`,
              [SupportedLanguage.YORUBA]: `Pẹlẹ o ${userProfile?.fullName.split(' ')[0] || "Agbe"}! Emi ni Noma, oludamoran agbe rẹ. Bawo ni MO ṣe le ṣe iranlọwọ fun oko rẹ loni?`,
              [SupportedLanguage.IGBO]: `Nnọọ ${userProfile?.fullName.split(' ')[0] || "Onye Ọrụ Ugbo"}! Abụ m Noma, onye ndụmọdụ ọrụ ugbo gị. Kedu ka m ga-esi nyere gị aka n'ugbo gị taa?`,
              [SupportedLanguage.SWAHILI]: `Hujambo ${userProfile?.fullName.split(' ')[0] || "Mkulima"}! Mimi ni Noma, mshauri wako wa kilimo. Nawezaje kukusaidia shambani mwako leo?`,
              [SupportedLanguage.ARABIC]: `مرحباً ${userProfile?.fullName.split(' ')[0] || "مزارع"}! أنا نعمة، مستشارك الزراعي. كيف يمكنني مساعدة مزرعتك اليوم؟`,
              [SupportedLanguage.FRENCH]: `Bonjour ${userProfile?.fullName.split(' ')[0] || "Agriculteur"}! Je suis Noma, votre conseiller agricole. Comment puis-je vous aider aujourd'hui?`
            };

            setMessages([
              {
                id: '1',
                role: 'model',
                text: initialContext 
                  ? (language === SupportedLanguage.ENGLISH ? "I see the report. Let's discuss what we can do about it. What questions do you have?" : "I see the report. Let's talk.") 
                  : greetings[language] || greetings[SupportedLanguage.ENGLISH],
                timestamp: new Date()
              }
            ]);
        }
      } catch (e) {
        setErrorState("Could not start Noma Advisor. Please refresh the page.");
      }
    };

    initChat();
    inputRef.current?.focus();
  }, [language, initialContext, userProfile, chatHistoryKey]);

  useEffect(() => {
    if (messages.length > 0) {
        localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }
  }, [messages, chatHistoryKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmedInput = inputText.trim();
    
    // 1. Basic Validation
    if (!trimmedInput) return;
    if (isLoading) return;

    // 2. Offline Check
    if (!navigator.onLine) {
      setErrorState("You are currently offline. Please check your internet connection and try again.");
      return;
    }

    // 3. Session Check
    if (!chatSessionRef.current) {
      setErrorState("Advisor session lost. Re-connecting...");
      try {
        chatSessionRef.current = createChatSession(language, initialContext);
      } catch (e) {
        setErrorState("Connection failed. Please refresh.");
        return;
      }
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmedInput,
      timestamp: new Date()
    };

    // Optimistic Update
    setMessages(prev => [...prev, userMsg]);
    const previousInput = inputText;
    setInputText('');
    setIsLoading(true);
    setErrorState(null);

    try {
      const responseText = await sendChatMessage(chatSessionRef.current, userMsg.text);
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      
      // Restore input on failure
      setInputText(previousInput);
      setErrorState("Failed to send message. Please check your signal and try again.");
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm sorry, I couldn't receive your message. It might be a bad signal. I've kept your text in the box so you can try sending it again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    let langCode = 'en-US';
    if (language === SupportedLanguage.FRENCH) langCode = 'fr-FR';
    else if (language === SupportedLanguage.ARABIC) langCode = 'ar-SA';
    else if (language === SupportedLanguage.SWAHILI) langCode = 'sw-KE';
    
    recognition.lang = langCode;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorState(null);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (text) {
        setInputText(text);
      }
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'network') {
        setErrorState("Voice input needs internet. Check your connection.");
      }
    };
    recognition.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-md mx-auto bg-[#FAFAF9]">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm text-base leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-green-700 to-green-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              <div className={`text-[10px] mt-1 font-medium ${msg.role === 'user' ? 'text-green-100/70' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none px-5 py-4 border border-gray-100 shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-green-600/40 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-green-600/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-green-600/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 pb-safe">
        {errorState && (
          <div className="mb-3 px-4 py-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex justify-between items-center animate-in slide-in-from-bottom-1">
            <span className="flex-1 font-medium">{errorState}</span>
            <button 
              onClick={() => setErrorState(null)}
              className="ml-2 p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        
        <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 focus-within:bg-white transition-all">
          <button 
            onClick={startListening}
            className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
              isListening 
                ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse' 
                : 'bg-white text-gray-500 shadow-sm hover:text-green-600 border border-gray-100 active:scale-95'
            }`}
            title="Voice Input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <div className="flex-1 relative pb-1">
            <textarea
              ref={inputRef as any}
              rows={1}
              value={inputText}
              maxLength={MAX_CHARS}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorState) setErrorState(null);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your question..."
              className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-base py-2 resize-none max-h-32"
              disabled={isLoading}
            />
            {inputText.length > MAX_CHARS * 0.8 && (
              <span className={`absolute -bottom-1 right-2 text-[9px] font-bold ${inputText.length >= MAX_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
                {inputText.length}/{MAX_CHARS}
              </span>
            )}
          </div>
          
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="p-3 rounded-full bg-green-700 text-white shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none hover:bg-green-800 active:scale-95 transition-all flex-shrink-0 mb-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};