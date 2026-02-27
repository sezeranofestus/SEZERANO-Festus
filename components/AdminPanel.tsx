
import React, { useState, useEffect, useRef } from 'react';
import { SystemConfig, IntelligenceMetrics, AppMode, Message } from '../types';
import MessageList from './MessageList';
import InputBar from './InputBar';
// Fix: Added analyzeImage import to handle vision capabilities in the lab
import { streamChat, analyzeImage } from '../services/geminiService';

interface AdminPanelProps {
  onClose: () => void;
  systemConfig: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

type TabId = 'overview' | 'neural_lab' | 'analytics' | 'core_tuning' | 'features';

const CreatorCommandCenter: React.FC<AdminPanelProps> = ({ onClose, systemConfig, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [localConfig, setLocalConfig] = useState<SystemConfig>({ ...systemConfig });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState('');
  
  // Chat Lab State
  const [labMessages, setLabMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // Fix: Added state for features in the neural chat lab to resolve InputBar missing props
  const [labFeatures, setLabFeatures] = useState({ search: false, reason: false, vision: false });

  // Simulated live metrics
  const [uptime, setUptime] = useState('00:00:00');
  const [metrics, setMetrics] = useState({
    cpu: 8,
    ram: 32,
    latency: 120,
    activeUsers: 12,
    totalVisits: 1420
  });

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
      
      setMetrics(prev => ({
        ...prev,
        cpu: Math.floor(5 + Math.random() * 10),
        ram: Math.floor(30 + Math.random() * 5),
        latency: Math.floor(110 + Math.random() * 20),
        activeUsers: Math.floor(8 + Math.random() * 15)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fix: Updated handleSendMessage signature and implementation to handle file uploads and lab features
  const handleSendMessage = async (content: string, file?: { data: string; mimeType: string }) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      type: 'text',
      timestamp: Date.now(),
      imageUrl: file?.data ? `data:${file.mimeType};base64,${file.data}` : undefined
    };
    setLabMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Fix: Implemented vision vs text branching in the neural lab
      if (file || labFeatures.vision) {
        const result = await analyzeImage(content || "Analyze this image.", file?.data || '', file?.mimeType || 'image/png', localConfig);
        const aiMsg: Message = { id: Date.now().toString(), role: 'assistant', content: result || '', type: 'text', timestamp: Date.now() };
        setLabMessages(prev => [...prev, aiMsg]);
      } else {
        const history = labMessages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const aiMsgId = (Date.now() + 1).toString();
        setLabMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', type: 'text', timestamp: Date.now() }]);

        let fullContent = '';
        const mode = labFeatures.search ? 'SEARCH' : 'CHAT';
        const streamer = streamChat(content, history, mode, {
          ...localConfig,
          globalModel: labFeatures.reason ? 'pro' : localConfig.globalModel
        });

        for await (const chunk of streamer) {
          fullContent += chunk.text || '';
          setLabMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullContent } : m));
        }
      }
    } catch (err: any) {
      setLabMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Lab Error: ${err.message}`, type: 'text', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleFeature = (feature: keyof SystemConfig['featuresEnabled']) => {
    setLocalConfig(prev => ({
      ...prev,
      featuresEnabled: { ...prev.featuresEnabled, [feature]: !prev.featuresEnabled[feature] }
    }));
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    const steps = ['Syncing Neural Weights...', 'Optimizing Context Window...', 'Deploying Core Evolution...'];
    let idx = 0;
    const interval = setInterval(() => {
      setDeployStep(steps[idx]);
      idx++;
      if (idx >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          onUpdateConfig(localConfig);
          setIsDeploying(false);
          setDeployStep('');
        }, 1000);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-[#020617] text-slate-100 flex overflow-hidden font-sans select-none animate-in fade-in duration-500">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[#050814] border-r border-white/5 flex flex-col p-6 shadow-2xl relative z-10">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-crown text-white"></i>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-shiny uppercase leading-none">Creator OS</h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sezerano Festus</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview', icon: 'fa-gauge-high', label: 'System Overview' },
            { id: 'neural_lab', icon: 'fa-flask', label: 'Neural Chat Lab' },
            { id: 'analytics', icon: 'fa-chart-line', label: 'Visitor Metrics' },
            { id: 'core_tuning', icon: 'fa-microchip', label: 'Intelligence Core' },
            { id: 'features', icon: 'fa-toggle-on', label: 'Protocol Matrix' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === tab.id 
                ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <i className={`fas ${tab.icon} ${activeTab === tab.id ? 'text-cyan-400' : 'group-hover:text-indigo-400'}`}></i>
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase mb-2">
              <span>Uptime</span>
              <span className="text-cyan-400">{uptime}</span>
            </div>
            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
              <span>Health</span>
              <span className="text-green-500">Nominal</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Close Terminal
          </button>
        </div>
      </aside>

      {/* Main Command Center Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              {activeTab === 'overview' && 'System Dashboard'}
              {activeTab === 'neural_lab' && 'Neural AI Lab'}
              {activeTab === 'analytics' && 'Visitor Analytics'}
              {activeTab === 'core_tuning' && 'Intelligence Tuning'}
              {activeTab === 'features' && 'Feature Evolution'}
            </h2>
            <div className="h-6 w-px bg-white/10"></div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Status: ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-[10px] font-black text-slate-500 uppercase">Master Architect</p>
               <p className="text-sm font-bold text-white">Sezerano Festus</p>
             </div>
             <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
               <img src="https://raw.githubusercontent.com/StackBlitz-User/Festus-Assets/main/festus_admin.jpg" className="w-full h-full object-cover" alt="Admin" />
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#020617]">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'CPU LOAD', val: `${metrics.cpu}%`, icon: 'fa-microchip', color: 'text-cyan-400' },
                  { label: 'MEMORY', val: `${metrics.ram}%`, icon: 'fa-memory', color: 'text-indigo-400' },
                  { label: 'LATENCY', val: `${metrics.latency}ms`, icon: 'fa-bolt', color: 'text-amber-400' },
                  { label: 'CONCURRENT', val: metrics.activeUsers, icon: 'fa-users', color: 'text-rose-400' }
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.07] transition-all group">
                    <i className={`fas ${item.icon} text-2xl mb-6 opacity-30 group-hover:opacity-100 transition-opacity ${item.color}`}></i>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-4xl font-black text-white">{item.val}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-10">Real-time Traffic (Visits)</h3>
                    <div className="flex items-end gap-2 h-40">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg hover:bg-indigo-500 transition-all cursor-help" style={{ height: `${20 + Math.random() * 80}%` }}></div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-6 text-[10px] font-bold text-slate-500 uppercase">
                      <span>00:00</span>
                      <span>12:00</span>
                      <span>23:59</span>
                    </div>
                 </div>
                 <div className="bg-gradient-to-br from-indigo-900/10 to-transparent rounded-[2.5rem] p-10 border border-white/5 flex flex-col justify-center items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-indigo-600/20 flex items-center justify-center mb-6">
                      <i className="fa-solid fa-server text-4xl text-indigo-400"></i>
                    </div>
                    <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Mainframe Status</h4>
                    <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed uppercase tracking-widest">
                      Global intelligence nodes are synchronized. All clusters reporting nominal latency.
                    </p>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: NEURAL Chat Lab (The AI Interface for Creator) */}
          {activeTab === 'neural_lab' && (
            <div className="h-full flex flex-col bg-[#050814] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
               <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                     <i className="fa-solid fa-flask-vial text-white text-xs"></i>
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest">Sandboxed Neural Testing</span>
                 </div>
                 <button 
                  onClick={() => setLabMessages([])}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                 >
                   Clear Lab
                 </button>
               </div>
               <div className="flex-1 overflow-hidden relative">
                 <MessageList messages={labMessages} isTyping={isTyping} />
               </div>
               <div className="p-6 bg-black/40 border-t border-white/5">
                 {/* Fix: Added missing activeFeatures and onToggleFeature props for InputBar */}
                 <InputBar 
                  onSendMessage={handleSendMessage} 
                  onStartVoiceChat={() => {}} 
                  mode={AppMode.CHAT} 
                  disabled={isTyping} 
                  activeFeatures={labFeatures}
                  onToggleFeature={(f) => setLabFeatures(prev => ({...prev, [f]: !prev[f]}))}
                 />
               </div>
            </div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5">
                 <h3 className="text-xs font-black text-white uppercase tracking-widest mb-10">Visitor Geographical Clusters</h3>
                 <div className="space-y-6">
                    {[
                      { l: 'Rwanda', v: '840 Hits', p: 60, c: 'bg-indigo-500' },
                      { l: 'Kenya', v: '320 Hits', p: 20, c: 'bg-cyan-500' },
                      { l: 'USA', v: '142 Hits', p: 10, c: 'bg-rose-500' },
                      { l: 'Others', v: '118 Hits', p: 10, c: 'bg-slate-600' }
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between text-[11px] font-black uppercase">
                           <span className="text-slate-400">{item.l}</span>
                           <span className="text-white">{item.v}</span>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full ${item.c} rounded-full`} style={{ width: `${item.p}%` }}></div>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {/* TAB: CORE TUNING */}
          {activeTab === 'core_tuning' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-500">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-4">Neural Architecture Initialization</label>
                <textarea 
                  value={localConfig.instruction}
                  onChange={(e) => setLocalConfig({...localConfig, instruction: e.target.value})}
                  className="w-full h-80 bg-[#0a0f1e] border border-white/5 rounded-[2.5rem] p-10 text-lg text-indigo-100 font-mono outline-none focus:border-indigo-500/30 transition-all shadow-inner leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Core Model Cluster</p>
                    <div className="flex gap-4">
                       {['flash', 'pro'].map(m => (
                         <button 
                           key={m}
                           onClick={() => setLocalConfig({...localConfig, globalModel: m as any})}
                           className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${localConfig.globalModel === m ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                         >
                           {m} 3.0 Engine
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="p-8 bg-white/5 rounded-3xl border border-white/5 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Merit Points Multiplier</p>
                    <input 
                      type="number" 
                      value={localConfig.meritPoints}
                      onChange={(e) => setLocalConfig({...localConfig, meritPoints: parseInt(e.target.value)})}
                      className="bg-transparent text-4xl font-black text-white outline-none"
                    />
                 </div>
              </div>
            </div>
          )}

          {/* TAB: FEATURES */}
          {activeTab === 'features' && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
               {[
                { id: 'imageGen', label: 'Image Synthesis', icon: 'fa-palette', desc: 'Allows AI to generate visual artwork.' },
                { id: 'webSearch', label: 'Search Grounding', icon: 'fa-globe', desc: 'Real-time facts from the web.' },
                { id: 'vision', label: 'Vision Perception', icon: 'fa-eye', desc: 'Analyzing uploaded image data.' },
                { id: 'scoring', label: 'Analysis Scoring', icon: 'fa-ranking-star', desc: 'Detailed intelligence feedback cards.' },
                { id: 'languagePolyglot', label: 'Global Polyglot', icon: 'fa-language', desc: 'Universal language mastery core.' }
               ].map(feat => (
                 <div 
                   key={feat.id}
                   onClick={() => handleToggleFeature(feat.id as any)}
                   className={`p-10 rounded-[3rem] border-2 transition-all cursor-pointer flex gap-6 items-center ${localConfig.featuresEnabled[feat.id as keyof SystemConfig['featuresEnabled']] ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-white/5 border-white/5 grayscale opacity-40'}`}
                 >
                   <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                     <i className={`fas ${feat.icon} text-2xl`}></i>
                   </div>
                   <div className="flex-1">
                     <h4 className="text-lg font-black text-white mb-1 uppercase tracking-tight">{feat.label}</h4>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">{feat.desc}</p>
                   </div>
                   <div className={`w-12 h-6 rounded-full relative transition-all ${localConfig.featuresEnabled[feat.id as keyof SystemConfig['featuresEnabled']] ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localConfig.featuresEnabled[feat.id as keyof SystemConfig['featuresEnabled']] ? 'right-1' : 'left-1'}`}></div>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </section>

        <footer className="h-24 border-t border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-xl relative z-10">
           <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Ready for Core Re-Initialization</p>
           </div>

           <button 
             onClick={handleDeploy}
             disabled={isDeploying}
             className="btn-shine bg-white text-black px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
           >
             {isDeploying ? 'Deploying...' : 'Commit Evolution'}
           </button>
        </footer>

        {isDeploying && (
          <div className="absolute inset-0 z-[500] bg-[#020617] flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 mb-10 relative">
               <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10"></div>
               <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
               <div className="absolute inset-4 rounded-full bg-indigo-600 flex items-center justify-center">
                  <i className="fa-solid fa-bolt text-white text-2xl animate-pulse"></i>
               </div>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Synchronizing Intelligence</h2>
            <p className="text-indigo-400 font-mono text-xs tracking-widest uppercase">{deployStep}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreatorCommandCenter;
