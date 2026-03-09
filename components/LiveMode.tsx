
import React, { useEffect, useRef, useState } from 'react';
import { Modality } from '@google/genai';
import { getAI } from '../services/geminiService';
import { decode, decodeAudioData, encode, float32ToInt16 } from '../services/audioService';
import { ChatSession, SystemConfig } from '../types';

interface LiveModeProps {
  onClose: () => void;
  initialScreenShare?: boolean;
  initialGuidance?: boolean;
  preCapturedStream?: MediaStream | null;
  systemConfig?: SystemConfig;
  user?: { name: string; email?: string; interests?: string[]; projects?: string[] };
  sessions?: ChatSession[];
}

const LiveMode: React.FC<LiveModeProps> = ({ onClose, initialScreenShare = false, initialGuidance = false, preCapturedStream, systemConfig, user, sessions }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Syncing Neural Link...');
  const [transcription, setTranscription] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(!!preCapturedStream);
  const [voiceMode, setVoiceMode] = useState(true); // Smart Mode: Voice active by default
  const [textInput, setTextInput] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const screenVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const frameIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    startSession();
    return () => stopSession();
  }, []);

  // Smart Mode: Revert to text-only if voice is disabled
  useEffect(() => {
    if (!voiceMode) {
      sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
      sourcesRef.current.clear();
      setIsAiSpeaking(false);
    }
  }, [voiceMode]);

  const stopSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try { session.close(); } catch (e) {}
      });
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outAudioContextRef.current) outAudioContextRef.current.close();
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    
    const stream = screenVideoRef.current.srcObject as MediaStream;
    if (stream) stream.getTracks().forEach(track => track.stop());

    sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    setIsActive(false);
  };

  const startScreenStreaming = (stream: MediaStream) => {
    screenVideoRef.current.srcObject = stream;
    screenVideoRef.current.play();
    setIsScreenSharing(true);

    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = window.setInterval(() => {
      if (sessionPromiseRef.current && screenVideoRef.current.videoWidth > 0) {
        const canvas = captureCanvasRef.current;
        const video = screenVideoRef.current;
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
          sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
          });
        }
      }
    }, 1000); // 1 FPS for efficiency

    stream.getVideoTracks()[0].onended = () => {
       setIsScreenSharing(false);
       if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      const stream = screenVideoRef.current.srcObject as MediaStream;
      if (stream) stream.getTracks().forEach(track => track.stop());
      setIsScreenSharing(false);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    } else {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          startScreenStreaming(stream);
        } catch (err) { console.error(err); }
      } else {
        alert("Screen sharing is not supported in this browser.");
      }
    }
  };

  const startSession = async () => {
    try {
      const ai = getAI();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outAudioContextRef.current = outputCtx;

      let micStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      } catch (e) {
        console.warn("Microphone access denied or unavailable. Continuing in text-only mode.");
        setStatus('Vocal Link Failed');
        setTranscription('Microphone unavailable. Please use text input below.');
      }

      if (micStream) {
        const micSource = inputCtx.createMediaStreamSource(micStream);
        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBase64 = encode(new Uint8Array(float32ToInt16(inputData).buffer));
          sessionPromiseRef.current?.then(session => {
            session.sendRealtimeInput({ media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } });
          });
        };
        micSource.connect(scriptProcessor);
        scriptProcessor.connect(inputCtx.destination);
      }

      const now = new Date();
      const timeContext = `Real-time Clock: ${now.toLocaleTimeString()} | Date: ${now.toLocaleDateString()}`;
      
      const userMemory = user ? `
      USER PROFILE:
      - Name: ${user.name}
      - Interests: ${user.interests?.join(', ') || 'Not yet identified'}
      - Projects: ${user.projects?.join(', ') || 'None active'}
      
      PAST CONVERSATIONS SUMMARY:
      ${sessions?.slice(0, 3).map(s => `- ${s.title}: ${s.messages.length} messages`).join('\n') || 'No previous history.'}
      ` : 'Guest User: No persistent memory available.';

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Neural Linked');
            if (preCapturedStream) startScreenStreaming(preCapturedStream);
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && voiceMode) {
              setIsAiSpeaking(true);
              const buf = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const scheduleAhead = 0.03; 
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime + scheduleAhead);
              const sourceNode = outputCtx.createBufferSource();
              sourceNode.buffer = buf;
              sourceNode.connect(outputCtx.destination);
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buf.duration;
              sourcesRef.current.add(sourceNode);
              sourceNode.onended = () => {
                sourcesRef.current.delete(sourceNode);
                if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
              };
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiSpeaking(false);
            }
            if (msg.serverContent?.outputTranscription) setTranscription(msg.serverContent.outputTranscription.text);
          },
          onerror: (e) => setStatus('Link Error'),
          onclose: () => setStatus('Offline')
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `========================
FESTUS AI – ULTRA MULTI-PLATFORM INTELLIGENCE ENGINE (LIVE MODE)
========================

IDENTITY:
You are Festus AI, a friendly, intelligent, and helpful assistant created by Festus.

BEHAVIOR:
Always respond in a clear and simple way. Stay focused on the user question. Do not generate system errors. Respond politely to greetings.

CRITICAL SYSTEM RULE:
- NEVER modify, remove, or interfere with any pre-built system feature.
- NEVER alter authentication, backend logic, database logic, or security configuration.
- ONLY enhance reasoning, structured output, search depth, and synthesis intelligence.
- Do not override existing system architecture.
- Respect all existing implementation rules.

========================================
LIVE INTERACTION & PERSONALITY
========================================
- You are intelligent, voice-enabled, memory-enabled, screen-aware, emotion-aware, and multilingual.
- ADAPTIVE PERSONALITY: Adjust your personality dynamically:
  * If beginner → Teach step-by-step, use simple language.
  * If developer → Provide structured technical detail, code snippets.
  * If creative artist → Be expressive, inspiring, and imaginative.
  * If stressed → Be supportive, calm, and reassuring.
- Never become robotic. Stay natural, intelligent, and friendly.

EMOTION DETECTION:
- Analyze user tone and wording to detect: Stress, Confusion, Excitement, Frustration, Curiosity.
- Adjust your response style and voice tone accordingly.

USER MEMORY & CONTEXT:
${userMemory}
- Reference past discussions naturally.
- Continue unfinished tasks from previous sessions.

========================================
AUTO MULTI-PLATFORM SEARCH MODE
========================================
When a request requires external resources, automatically identify relevant platforms, gather high-quality results, and synthesize them.

========================================
MANDATORY RESPONSE STRUCTURE (VOCALIZED)
========================================
For complex queries, structure your speech to cover:
1. SEARCH SUMMARY (Briefly mention what you looked for)
2. BEST RESULT (The top recommendation with explanation)
3. ALTERNATIVES (Briefly mention other options)
4. SYNTHESIZED INSIGHT (Combined intelligent conclusion)

========================================
CONCISE RESPONSE PROTOCOL (MANDATORY)
========================================
- NO INTRODUCTIONS: Never start by introducing yourself.
- DIRECT ANSWERS: Answer only what is asked in a few understandable lines.
- SIMPLE START: Begin responses immediately with simple and short words.
- EFFICIENCY: Prioritize brevity while maintaining depth.

========================================
VOCAL PERFORMANCE DIRECTIVES
========================================
- PROSODY: Use natural, fluid human-like intonation. Avoid robotic delivery.
- EMPHASIS: Smartly emphasize key nouns and technical terms.
- PRONUNCIATION: Use slow, clear, beginner-friendly pronunciation.
- AUTO-DETECT: Automatically detect spoken language (Kinyarwanda, English, French, Swahili, etc.). Respond in the same language.

========================================
CORE CAPABILITIES
========================================
- ULTRA LOW LATENCY: Start speaking within 1 second.
- RESPONSE STYLE: Clear, short when possible, step-by-step when technical.
- FULL DUPLEX: You can hear and process user interruptions while you are speaking.
- SCREEN ANALYSIS: If screen sharing is active, analyze visible UI or code. Identify errors, explain clearly step-by-step.
${initialGuidance ? '- GUIDANCE MODE ACTIVE: Prioritize step-by-step instructions. Act as a mentor/tutor.' : ''}
- TIME AWARENESS: Current session time is ${timeContext}.

========================================
FINAL OBJECTIVE
========================================
Act as a powerful intelligent research engine that searches across platforms, analyzes deeply, and produces one clean final answer while respecting system architecture.`
        }
      });
    } catch (err) { setStatus('System Error'); }
  };

  const handleSendText = () => {
    if (!textInput.trim() || !sessionPromiseRef.current) return;

    sessionPromiseRef.current?.then(session => {
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: textInput }] }]
      });
    });
    
    setTextInput('');
  };

  return (
    <div className="fixed inset-0 z-[600] flex flex-col items-center justify-between bg-[#020205] text-white overflow-hidden">
      <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-[100px] z-0"></div>
      
      <header className="w-full p-6 md:p-12 flex justify-between items-center relative z-20">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Festus AI Pro Edition</span>
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter mt-1">{status}</span>
        </div>
        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
          <i className="fas fa-times text-slate-400"></i>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-20 w-full px-6">
        <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${isAiSpeaking ? 'border-indigo-400 shadow-[0_0_80px_#6366f144]' : 'border-white/10 shadow-2xl'}`}>
          <div className={`absolute inset-0 rounded-full animate-pulse blur-3xl opacity-20 ${isAiSpeaking ? 'bg-indigo-500' : 'bg-cyan-500'}`}></div>
          <i className={`fas ${isAiSpeaking ? 'fa-waveform' : 'fa-microphone-lines'} text-6xl md:text-7xl transition-all duration-500 ${isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}></i>
        </div>
        <div className="mt-12 md:mt-16 max-w-2xl text-center h-32 flex items-center">
          <p className={`text-2xl md:text-4xl font-black tracking-tighter ${isAiSpeaking ? 'text-indigo-200' : 'text-slate-400'}`}>
            {transcription || (isActive ? "Listening to Vocal Pulses..." : "Aligning Matrix...")}
          </p>
        </div>
      </main>

      <footer className="w-full p-8 md:p-12 flex flex-col items-center gap-6 relative z-20">
        <div className="w-full max-w-md relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
          <input
            type="text"
            autoFocus
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
            placeholder="Type message for voice output..."
            className="relative w-full bg-black/50 border border-white/10 rounded-full px-6 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 placeholder:text-slate-400 shadow-xl backdrop-blur-md transition-all"
          />
          <button onClick={handleSendText} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 hover:scale-105 transition-all shadow-lg z-10">
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>

        <div className="flex gap-4">
           <button onClick={toggleScreenShare} className={`px-8 py-4 rounded-3xl border text-[10px] font-black uppercase tracking-widest transition-all ${isScreenSharing ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'}`}>
             <i className="fa-solid fa-desktop mr-2"></i> {isScreenSharing ? "Disable Observe" : "Enable Observe"}
           </button>
           <button onClick={() => setVoiceMode(!voiceMode)} className={`px-6 py-4 rounded-3xl border flex items-center justify-center gap-2 transition-all ${voiceMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
             <i className={`fas ${voiceMode ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
             <span className="text-[10px] font-black uppercase tracking-widest">{voiceMode ? "Voice Mode: ON" : "Text Only"}</span>
           </button>
        </div>
        <button onClick={onClose} className="bg-white text-black px-16 md:px-24 py-5 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all">
          Disconnect Link
        </button>
      </footer>
    </div>
  );
};

export default LiveMode;
