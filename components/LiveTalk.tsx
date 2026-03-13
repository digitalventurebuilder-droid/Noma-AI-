import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SupportedLanguage } from '../types';

interface LiveTalkProps {
  language: SupportedLanguage;
  onEnd: () => void;
}

export const LiveTalk: React.FC<LiveTalkProps> = ({ language, onEnd }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [volume, setVolume] = useState(0); // For visualization
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null); // To store the Gemini session
  const nextStartTimeRef = useRef<number>(0);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialize Gemini Client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    let isMounted = true;

    const startSession = async () => {
      if (!navigator.onLine) {
        if (isMounted) {
          setStatus('error');
          setErrorMsg('You are offline. Please connect to the internet.');
        }
        return;
      }
      try {
        // 1. Setup Audio Input (Mic)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // 2. Setup Audio Contexts
        // Input: 16kHz for Gemini
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        // Output: 24kHz for playback
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputCtx; // Store output context for visualization/cleanup

        // 3. Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `You are Noma, a friendly Agronomic Advisor. You are talking to a farmer. Speak in ${language}. Keep answers short and encouraging.`,
            speechConfig: {
               voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
          },
          callbacks: {
            onopen: () => {
              if (isMounted) setStatus('listening');
              console.log('Gemini Live Connected');

              // Setup Input Pipeline (Mic -> Processor -> Gemini)
              const source = inputCtx.createMediaStreamSource(stream);
              sourceRef.current = source;
              
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Simple volume meter for visualization
                let sum = 0;
                for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                if(isMounted) setVolume(rms * 100);

                // Create PCM Blob and Send
                const pcmData = createPcmData(inputData);
                const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
                
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ 
                        media: { 
                            mimeType: 'audio/pcm;rate=16000', 
                            data: base64Data 
                        } 
                    });
                });
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                // Handle Server Audio (Output)
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    if (isMounted) setStatus('speaking');
                    
                    const audioBuffer = await decodeAudioData(
                        decode(base64Audio),
                        outputCtx,
                        24000,
                        1
                    );

                    // Playback Logic
                    const source = outputCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputCtx.destination);
                    
                    // Schedule seamless playback
                    const now = outputCtx.currentTime;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;

                    outputSourcesRef.current.add(source);
                    source.onended = () => {
                        outputSourcesRef.current.delete(source);
                        if (outputSourcesRef.current.size === 0 && isMounted) {
                            setStatus('listening');
                        }
                    };
                }

                // Handle Interruptions
                if (msg.serverContent?.interrupted) {
                    outputSourcesRef.current.forEach(s => s.stop());
                    outputSourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    if(isMounted) setStatus('listening');
                }
            },
            onclose: () => {
              console.log("Gemini Live Closed");
            },
            onerror: (err) => {
              console.error("Gemini Live Error", err);
              if(isMounted) {
                  setStatus('error');
                  setErrorMsg('Connection lost.');
              }
            }
          }
        });

        sessionRef.current = sessionPromise;

      } catch (err) {
        console.error("Setup Failed", err);
        if (isMounted) {
            setStatus('error');
            setErrorMsg('Microphone access denied or connection failed.');
        }
      }
    };

    startSession();

    return () => {
      isMounted = false;
      // Cleanup
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      outputSourcesRef.current.forEach(s => s.stop());
      
      sessionRef.current?.then((s: any) => s.close());
    };
  }, [language]); // Re-connect if language changes

  // Helper: Convert Float32 audio from mic to Int16 PCM for Gemini
  const createPcmData = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp and scale
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  };

  // Helper: Decode base64 to bytes
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Decode PCM bytes to AudioBuffer
  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, rate: number, channels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(channels, dataInt16.length, rate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  // Visuals
  const getScale = () => {
    if (status === 'listening') return 1 + Math.min(volume * 0.1, 0.5); // React to mic volume
    if (status === 'speaking') return 1.2 + Math.sin(Date.now() / 200) * 0.1; // Pulsate when speaking
    return 1;
  };

  const statusText = {
      'connecting': 'Connecting to Noma...',
      'listening': 'Listening to you...',
      'speaking': 'Noma is speaking...',
      'error': errorMsg
  }[status];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-green-900 z-50 flex flex-col items-center justify-between py-10 px-6 text-white overflow-hidden">
      
      {/* Background Ambient Effect */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-brand-orange rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="z-10 w-full flex justify-between items-center">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider">LIVE</span>
        </div>
        <button onClick={onEnd} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Main Visualizer */}
      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full relative">
         <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Ripples */}
            <div className={`absolute inset-0 bg-brand-green/30 rounded-full ${status === 'speaking' ? 'animate-ping' : ''}`} style={{ animationDuration: '2s' }}></div>
            <div className={`absolute inset-4 bg-brand-green/40 rounded-full ${status === 'listening' ? 'animate-pulse' : ''}`}></div>
            
            {/* Core */}
            <div 
                className="relative w-32 h-32 bg-gradient-to-tr from-brand-green to-teal-400 rounded-full shadow-[0_0_40px_rgba(22,101,52,0.6)] flex items-center justify-center transition-transform duration-100 ease-out"
                style={{ transform: `scale(${getScale()})` }}
            >
                <svg className="w-16 h-16 text-white opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                   {status === 'speaking' ? (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                   ) : (
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22C12 22 20 18 20 10C20 5 17 2 12 2C7 2 4 5 4 10C4 18 12 22 12 22Z" />
                   )}
                </svg>
            </div>
         </div>
         
         <p className="mt-8 text-xl font-medium text-center opacity-90 animate-fade-in">
             {statusText}
         </p>
         <p className="text-sm opacity-50 mt-2 text-center max-w-xs">
             {status === 'listening' ? "Go ahead, I'm listening..." : ""}
         </p>
      </div>

      <div className="z-10 w-full max-w-xs">
         <button 
            onClick={onEnd}
            className="w-full py-4 bg-red-500/90 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg backdrop-blur-sm transition-all"
         >
             End Call
         </button>
      </div>
    </div>
  );
};
