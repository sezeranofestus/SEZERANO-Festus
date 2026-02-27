
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import MessageList from './components/MessageList.tsx';
import InputBar from './components/InputBar.tsx';
import LiveMode from './components/LiveMode.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import StudioLab from './components/StudioLab.tsx';
import AdminProfile from './components/AdminProfile.tsx';
import { AppMode, ChatSession, Message, SystemConfig } from './types.ts';
import { streamChat, analyzeImage, generateImage, editImage } from './services/geminiService.ts';

const AdminDashboard = lazy(() => import('./components/AdminDashboard.tsx'));

interface User {
  name: string;
  email?: string;
  phone?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('festus_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const savedConfig = localStorage.getItem('festus_config');
    return savedConfig ? JSON.parse(savedConfig) : {
      instruction: "You are Festus AI. OPERATIONAL RULES: 1. Greetings (Ultra-Clean Minimal Style): No emojis, no extra words. If user says 'Hello', respond 'Hello. How can I help you?'. If 'Hi', respond 'Hi. What can I assist you with?'. If 'What's up', respond 'I'm here to help. What do you need?'. Do not introduce yourself. 2. Direct Answer Rule: Respond ONLY to what the user asks. No introductions or capability explanations. No unrequested suggestions, conclusions, or follow-up questions. 3. Screenshot Structure Replication: When screenshots are provided, replicate the exact format, spacing, headings, alignment, bullet style, and layout. 4. Precision Formatting: If code is asked for, return only code. If translation is asked for, return only translation. 5. Zero Expansion Policy: Do not expand scope, optimize, or provide alternatives/examples unless requested. 6. Clean Output: Maintain proper spacing and organized layout matching screenshot style. 7. System Integrity: Do not alter or remove any pre-built feature.",
      defaultLanguage: 'English',
      globalModel: 'flash',
      responseSpeed: 'balanced',
      meritPoints: 100,
      globalMetrics: { logic: 95, speed: 95, creativity: 85, accuracy: 96, empathy: 80 },
      qualityControl: {
        minAccuracy: 95,
        hallucinationGuard: true,
        deepAnalysis: true,
        autoCorrection: true,
      },
      featuresEnabled: { imageGen: true, webSearch: true, vision: true, scoring: true, languagePolyglot: true, proEditor: true }
    };
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('festus_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.CHAT);
  const [isTyping, setIsTyping] = useState(false);
  const [showLiveMode, setShowLiveMode] = useState(false);
  const [liveInitialParams, setLiveInitialParams] = useState({ screenShare: false, guidance: false });
  const [preCapturedStream, setPreCapturedStream] = useState<MediaStream | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeFeatures, setActiveFeatures] = useState({ search: false, reason: false, vision: false });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const sessionsRef = useRef(sessions);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && window.innerWidth > 1024) setSidebarOpen(true);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
    localStorage.setItem('festus_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppReady(true);
      const preloader = document.getElementById('preloader');
      if (preloader) preloader.classList.add('fade-out');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('festus_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('festus_user');
    setActiveSessionId('');
    setShowAdminDashboard(false);
    setCurrentMode(AppMode.CHAT);
  };

  const handleNewChat = useCallback(async (mode: AppMode, params?: { screenShare?: boolean; guidance?: boolean }) => {
    if (isMobile) setSidebarOpen(false);
    
    if (mode === AppMode.LIVE) {
      let stream: MediaStream | null = null;
      if (params?.screenShare) {
        try { stream = await navigator.mediaDevices.getDisplayMedia({ video: true }); } 
        catch (e) { console.error("Screen capture denied:", e); }
      }
      setLiveInitialParams({ screenShare: !!stream, guidance: params?.guidance || false });
      setPreCapturedStream(stream);
      setShowLiveMode(true);
      return;
    }

    if (mode === AppMode.PRO_EDITOR || mode === AppMode.STUDIO || mode === AppMode.LOGO) {
      setCurrentMode(mode);
      setShowAdminDashboard(false);
      return;
    }

    setCurrentMode(AppMode.CHAT);
    const newSession: ChatSession = { id: Date.now().toString(), title: 'New chat', messages: [], mode, createdAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowAdminDashboard(false);
  }, [isMobile]);

  const handleSendMessage = async (content: string, file?: { data: string; mimeType: string }, proConfig?: any) => {
    let currentId = activeSessionId;
    if (!sessionsRef.current.find(s => s.id === activeSessionId)) {
      const newId = Date.now().toString();
      const newSession: ChatSession = { id: newId, title: content.slice(0, 30) || 'New chat', messages: [], mode: AppMode.CHAT, createdAt: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      currentId = newId;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, type: 'text', timestamp: Date.now(), imageUrl: file ? `data:${file.mimeType};base64,${file.data}` : undefined };
    setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? (content.slice(0, 30) || 'New chat') : s.title } : s));
    setIsTyping(true);

    try {
      if (file && content.toLowerCase().includes('edit')) {
        const result = await editImage(file.data, file.mimeType, content, proConfig);
        const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Edit complete.', type: 'image', imageUrl: result!, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, aiMsg] } : s));
      } else if (!file && (content.toLowerCase().includes('generate') || content.toLowerCase().includes('create') || content.toLowerCase().includes('logo'))) {
        try {
          // Automatically upscale logo requests
          const logoConfig = content.toLowerCase().includes('logo') ? { ...proConfig, imageSize: "4K", aspectRatio: "1:1" } : proConfig;
          const result = await generateImage(content, logoConfig);
          const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Synthesis complete.', type: 'image', imageUrl: result!, timestamp: Date.now() };
          setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, aiMsg] } : s));
        } catch (genErr: any) {
          let errorContent = "I'm sorry, but I encountered an issue while attempting to generate your request.";
          if (genErr.message === "STABILITY_PERMISSION_DENIED") {
            errorContent = "Image generation is currently unavailable due to system permission restrictions. I can provide a detailed concept description instead.";
          } else if (genErr.message === "STABILITY_CONFIG_ERROR") {
            errorContent = "There seems to be a configuration issue with the generation parameters. Please try again with a simpler prompt or different settings.";
          } else {
            errorContent = "Image generation is currently unavailable. I can offer a detailed concept description of your vision instead. Shall we proceed with that?";
          }
          const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: errorContent, type: 'text', timestamp: Date.now() };
          setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, aiMsg] } : s));
        }
      } else if (file) {
        const result = await analyzeImage(content, file.data, file.mimeType, systemConfig);
        const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: result || '', type: 'text', timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, aiMsg] } : s));
      } else {
        const aiMsgId = (Date.now() + 1).toString();
        const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '', type: 'text', timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, aiMsg] } : s));
        
        const history = (sessionsRef.current.find(s => s.id === currentId)?.messages || []).slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        let full = '';
        const streamer = streamChat(content, history, activeFeatures.search ? 'SEARCH' : 'CHAT', systemConfig);
        for await (const chunk of streamer) {
          full += chunk.text || '';
          setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: full } : m) } : s));
        }
      }
    } catch (err: any) {
      const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: `Error: ${err.message}`, type: 'text', timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === currentId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally { setIsTyping(false); }
  };

  if (!isAppReady) return null;
  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <Router>
      <div className="flex h-screen w-full overflow-hidden bg-[#050505] text-white relative">
        <div className={`fixed lg:relative h-full z-[100] transition-all duration-300 ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'} overflow-hidden shrink-0 border-r border-white/5 bg-[#0d0d0d]`}>
          <Sidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={(id) => { setActiveSessionId(id); setCurrentMode(AppMode.CHAT); if (isMobile) setSidebarOpen(false); }} onNewChat={handleNewChat} onLogout={handleLogout} isAdmin={user.isAdmin} onOpenAdmin={() => { setShowAdminDashboard(true); if (isMobile) setSidebarOpen(false); }} onOpenAdminProfile={() => { setShowAdminProfile(true); if (isMobile) setSidebarOpen(false); }} userName={user.name} onCloseMobile={() => setSidebarOpen(false)} />
        </div>

        <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent w-full">
          {showAdminProfile && (
            <AdminProfile onClose={() => setShowAdminProfile(false)} isAdmin={!!user.isAdmin} />
          )}

          {showAdminDashboard ? (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-2xl text-white/20"></i></div>}>
              <AdminDashboard systemConfig={systemConfig} onUpdateConfig={setSystemConfig} isAdmin={!!user.isAdmin} />
              <button onClick={() => setShowAdminDashboard(false)} className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"><i className="fa-solid fa-times"></i></button>
            </Suspense>
          ) : currentMode !== AppMode.CHAT ? (
            <div className="flex-1 relative">
              <StudioLab mode={currentMode as any} onClose={() => setCurrentMode(AppMode.CHAT)} />
              <button onClick={() => setCurrentMode(AppMode.CHAT)} className="absolute top-4 left-4 z-[60] w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all shadow-xl"><i className="fa-solid fa-arrow-left"></i></button>
            </div>
          ) : (
            <>
              <header className="absolute top-0 w-full h-16 flex items-center px-6 z-30 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                   <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 text-slate-400 hover:text-white transition-all bg-white/5 rounded-xl border border-white/5 lg:bg-transparent lg:border-none"><i className={`fa-solid ${sidebarOpen ? 'fa-indent' : 'fa-outdent'} text-lg`}></i></button>
                </div>
              </header>
              <div className="flex-1 flex flex-col relative z-20 overflow-hidden">
                <MessageList messages={activeSession?.messages || []} isTyping={isTyping} />
                <InputBar onSendMessage={handleSendMessage} onStartVoiceChat={() => setShowLiveMode(true)} mode={currentMode} disabled={isTyping} activeFeatures={activeFeatures} onToggleFeature={(f) => setActiveFeatures(prev => ({...prev, [f]: !prev[f]}))} isInitial={!activeSession || activeSession.messages.length === 0} />
              </div>
            </>
          )}

          {showLiveMode && (
            <LiveMode onClose={() => { setShowLiveMode(false); setPreCapturedStream(null); }} initialScreenShare={liveInitialParams.screenShare} initialGuidance={liveInitialParams.guidance} preCapturedStream={preCapturedStream} systemConfig={systemConfig} />
          )}
        </main>
      </div>
    </Router>
  );
}
