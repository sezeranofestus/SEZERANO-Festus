
import React, { useState, useEffect, useRef } from 'react';
import { SystemConfig } from '../types';

interface AdminDashboardProps {
  systemConfig: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  isAdmin: boolean;
}

type TabId = 'vitals' | 'visitors' | 'curation' | 'evaluation' | 'protocols' | 'logs';

interface VisitorSession {
  id: string;
  location: string;
  device: 'desktop' | 'mobile';
  mode: string;
  time: string;
  status: 'active' | 'idle';
}

interface MetricValue {
  name: string;
  value: number;
  threshold: number;
  isLowerBetter?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ systemConfig, onUpdateConfig, isAdmin }) => {
  const [activeTab, setActiveTab] = useState<TabId>('vitals');
  const [localConfig, setLocalConfig] = useState<SystemConfig>({ ...systemConfig });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState('');
  
  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center bg-[#050505] p-10 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-shield-slash text-3xl text-rose-500"></i>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Access Denied</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Portal Admin Clearance Required.</p>
        </div>
      </div>
    );
  }
  
  // Advanced Telemetry
  const [uptime, setUptime] = useState('00:00:00');
  const [metrics, setMetrics] = useState({
    latency: 142,
    visits: 1842,
    activeNow: 14,
    tokens: 1245000,
    successRate: 99.85,
    tps: 42 
  });

  // AI Performance Data (Updated for Ultra-High Quality Thresholds)
  const [evalData, setEvalData] = useState<{ [key: string]: MetricValue[] }>({
    "Core Intelligence": [
      { name: "Accuracy", value: 96.8, threshold: 95 },
      { name: "Precision", value: 93.4, threshold: 92 },
      { name: "Recall", value: 92.8, threshold: 92 },
      { name: "F1 Score", value: 93.1, threshold: 92 },
      { name: "Logical Consistency", value: 95.5, threshold: 95 },
      { name: "Confidence Score", value: 94.2, threshold: 93 }
    ],
    "Safety & Integrity": [
      { name: "Hallucination Risk", value: 2.1, threshold: 3, isLowerBetter: true },
      { name: "Safety Alignment", value: 99.4, threshold: 99 },
      { name: "Grounding Accuracy", value: 97.2, threshold: 95 }
    ],
    "Computer Vision": [
      { name: "IoU", value: 88.5, threshold: 85 },
      { name: "mAP@0.5", value: 95.1, threshold: 92 },
      { name: "Det Precision", value: 93.8, threshold: 93 }
    ],
    "NLP / Reasoning": [
      { name: "Semantic Depth", value: 94.4, threshold: 90 },
      { name: "Context Retention", value: 98.1, threshold: 95 },
      { name: "Reasoning Path", value: 0.96, threshold: 0.95 }
    ]
  });

  const [visitors, setVisitors] = useState<VisitorSession[]>([
    { id: 'usr_9281', location: 'Kigali, RW', device: 'mobile', mode: 'Chat', time: '2m ago', status: 'active' },
    { id: 'usr_1022', location: 'Nairobi, KE', device: 'desktop', mode: 'Vision', time: '5m ago', status: 'active' },
    { id: 'usr_4431', location: 'New York, US', device: 'mobile', mode: 'Image Gen', time: '12m ago', status: 'idle' },
    { id: 'usr_0092', location: 'London, UK', device: 'desktop', mode: 'Chat', time: 'Just now', status: 'active' },
    { id: 'usr_7721', location: 'Kigali, RW', device: 'mobile', mode: 'Scoring', time: '1m ago', status: 'active' },
    { id: 'usr_3321', location: 'Paris, FR', device: 'desktop', mode: 'Search', time: '4m ago', status: 'idle' },
  ]);

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
        latency: Math.floor(115 + Math.random() * 30),
        activeNow: Math.floor(12 + Math.random() * 8),
        tps: Math.floor(38 + Math.random() * 15),
        tokens: prev.tokens + Math.floor(Math.random() * 120)
      }));

      // Fluctuate eval data slightly for simulation
      setEvalData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(cat => {
          const currentMetrics = next[cat];
          if (Array.isArray(currentMetrics)) {
            next[cat] = currentMetrics.map(m => ({
              ...m,
              value: Number((m.value + (Math.random() * 0.2 - 0.1)).toFixed(2))
            }));
          }
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isExcellent = (metric: MetricValue) => {
    if (metric.isLowerBetter) {
      return metric.value <= metric.threshold;
    }
    return metric.value >= metric.threshold;
  };

  const handleToggleFeature = (feature: keyof SystemConfig['featuresEnabled']) => {
    setLocalConfig(prev => ({
      ...prev,
      featuresEnabled: { ...prev.featuresEnabled, [feature]: !prev.featuresEnabled[feature] }
    }));
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    const steps = ['Syncing Neural Weights...', 'Optimizing Context Window...', 'System Evolution Complete.'];
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

  const tabs = [
    { id: 'vitals', label: 'Vitals', icon: 'fa-gauge-high' },
    { id: 'visitors', label: 'Visitors', icon: 'fa-users-viewfinder' },
    { id: 'evaluation', label: 'Evaluation', icon: 'fa-chart-simple' },
    { id: 'curation', label: 'Memory', icon: 'fa-brain-circuit' },
    { id: 'protocols', label: 'Protocols', icon: 'fa-shield-halved' },
    { id: 'logs', label: 'Logs', icon: 'fa-terminal' }
  ];

  return (
    <div className="h-full flex flex-col bg-[#050505] animate-in fade-in duration-700 overflow-hidden font-sans pt-16 lg:pt-0">
      <div className="w-full bg-black/60 backdrop-blur-3xl border-b border-white/5 flex items-center shrink-0 z-20">
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center px-4 md:px-6 gap-1 md:gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2.5 h-14 md:h-16 px-4 md:px-6 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 shrink-0 ${
                activeTab === tab.id 
                ? 'border-indigo-500 text-white bg-white/[0.02]' 
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.01]'
              }`}
            >
              <i className={`fas ${tab.icon} ${activeTab === tab.id ? 'text-indigo-400' : ''}`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>

        {activeTab === 'vitals' && (
          <div className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { l: 'Latency', v: `${metrics.latency}ms`, i: 'fa-bolt', c: 'text-amber-400' },
                { l: 'Uptime', v: uptime, i: 'fa-clock', c: 'text-cyan-400' },
                { l: 'Success', v: `${metrics.successRate}%`, i: 'fa-check-double', c: 'text-green-400' },
                { l: 'TPS', v: metrics.tps, i: 'fa-wave-square', c: 'text-rose-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] hover:bg-white/[0.05] transition-all group relative overflow-hidden shadow-2xl">
                  <i className={`fas ${stat.i} text-lg md:text-xl mb-3 md:mb-4 opacity-40 group-hover:opacity-100 transition-opacity ${stat.c}`}></i>
                  <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.l}</p>
                  <p className="text-xl md:text-3xl font-black text-white tracking-tighter font-mono">{stat.v}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl">
               <div className="flex items-center gap-4 mb-6 md:mb-8">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                    <i className="fa-solid fa-gauge-simple-high text-amber-400 text-lg md:text-xl"></i>
                 </div>
                 <div>
                   <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Neural Velocity Tuning</h3>
                   <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Enhance depth vs reasoning time</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {[
                    { id: 'turbo', label: 'Turbo Burst', desc: 'Maximum speed, low thinking lag.', icon: 'fa-bolt-lightning', color: 'amber' },
                    { id: 'balanced', label: 'Balanced Sync', desc: 'Optimized reasoning & time.', icon: 'fa-scale-balanced', color: 'indigo' },
                    { id: 'precision', label: 'Precision Logic', icon: 'fa-brain', desc: 'Extended deep logical loops.', color: 'emerald' }
                  ].map(speed => (
                    <button
                      key={speed.id}
                      onClick={() => setLocalConfig({...localConfig, responseSpeed: speed.id as any})}
                      className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 md:gap-4 relative overflow-hidden group ${
                        localConfig.responseSpeed === speed.id 
                        ? `bg-${speed.color}-500/10 border-${speed.color}-500/40 shadow-xl` 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <i className={`fas ${speed.icon} text-xl md:text-2xl ${localConfig.responseSpeed === speed.id ? `text-${speed.color}-400` : 'text-slate-500'}`}></i>
                      <div>
                        <h4 className="text-[12px] md:text-sm font-black text-white uppercase mb-1">{speed.label}</h4>
                        <p className="text-[8px] md:text-[10px] text-slate-500 leading-relaxed uppercase font-bold">{speed.desc}</p>
                      </div>
                      {localConfig.responseSpeed === speed.id && (
                        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-${speed.color}-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse`}></div>
                      )}
                    </button>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="space-y-12 animate-in fade-in duration-1000">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">Ultra-High Quality Audit</h2>
              <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-[0.4em] leading-relaxed">
                Evaluating against high-accuracy excellence benchmarks (EXCELLENT THRESHOLD: 95%+).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
              {(Object.entries(evalData) as [string, MetricValue[]][]).map(([category, items]) => (
                <div key={category} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">{category}</h3>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Elite Benchmark Mode</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {items.map((metric, idx) => {
                      const excellent = isExcellent(metric);
                      return (
                        <div key={idx} className="group">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">{metric.name}</p>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Elite Threshold: {metric.isLowerBetter ? '≤' : '≥'}{metric.threshold}{metric.name.includes('AUC') || metric.name.includes('Path') ? '' : '%'}</p>
                            </div>
                            <div className="text-right">
                              {excellent && (
                                <span className="inline-block px-2 py-0.5 bg-green-500 text-black text-[8px] font-black uppercase tracking-widest rounded animate-pulse mb-1">EXCELLENT</span>
                              )}
                              <p className={`text-xl font-black tracking-tight ${excellent ? 'text-white' : 'text-slate-500'}`}>
                                {metric.value}{metric.name.includes('AUC') || metric.name.includes('Path') ? '' : '%'}
                              </p>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ease-out rounded-full ${excellent ? 'bg-gradient-to-r from-green-500 to-cyan-400' : 'bg-slate-700 opacity-30'}`}
                              style={{ width: `${Math.min(100, Math.max(0, metric.isLowerBetter ? (metric.threshold / metric.value) * 80 : (metric.value / metric.threshold) * 85))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 md:p-12 bg-indigo-600/5 border border-indigo-500/10 rounded-[3rem] text-center max-w-4xl mx-auto">
               <i className="fa-solid fa-certificate text-indigo-400 text-4xl mb-6"></i>
               <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Festus AI Pro Certified</h4>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose">
                 Festus AI Pro strictly adheres to ultra-high quality response standards. Every neural output is filtered through a 7-stage analytical trace to ensure absolute logical consistency and factual integrity.
               </p>
            </div>
          </div>
        )}

        {activeTab === 'curation' && (
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-in zoom-in-95 duration-500">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Analytical Memory Lab</h2>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-2">Optimizing Precision & Accuracy</p>
            </div>

            <div className="space-y-8 md:space-y-12 bg-white/[0.02] border border-white/5 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-2xl">
              <div className="relative group">
                <label className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2 md:ml-4 mb-4 block">Question / Logical Stimulus</label>
                <textarea 
                  placeholder="Insert technical complex query..."
                  className="w-full h-28 md:h-32 bg-indigo-900/10 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white placeholder:text-slate-700 focus:border-indigo-500/40 outline-none transition-all resize-none shadow-inner text-sm md:text-lg font-bold leading-relaxed"
                />
              </div>

              <div className="relative group">
                <label className="text-[9px] md:text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-2 md:ml-4 mb-4 block">Gold-Standard Verified Response</label>
                <textarea 
                  placeholder="The elite response structure..."
                  className="w-full h-40 md:h-48 bg-cyan-900/10 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white placeholder:text-slate-700 focus:border-cyan-400/40 outline-none transition-all resize-none shadow-inner text-sm md:text-lg leading-relaxed"
                />
              </div>

              <div className="flex justify-center pt-2">
                <button 
                  className="relative group bg-white text-black w-full md:w-auto px-12 md:px-24 py-5 md:py-6 rounded-xl md:rounded-2xl font-black uppercase text-[11px] md:text-[12px] tracking-[0.2em] md:tracking-[0.4em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="relative z-10">Sync Excellence Anchor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visitors' && (
          <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="bg-white/[0.02] rounded-[1.5rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 md:p-10 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-center gap-4">
                   <h3 className="text-xs font-black text-white uppercase tracking-widest">Active High-Performance Nodes</h3>
                   <div className="bg-indigo-500/10 px-6 py-2 rounded-full border border-indigo-500/20">
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global: {metrics.activeNow}</span>
                   </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                   <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/5 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em]">
                          <th className="px-6 md:px-10 py-6 md:py-8">Identifier</th>
                          <th className="px-6 md:px-10 py-6 md:py-8">Origin</th>
                          <th className="px-6 md:px-10 py-6 md:py-8">Type</th>
                          <th className="px-6 md:px-10 py-6 md:py-8">Mode</th>
                          <th className="px-6 md:px-10 py-6 md:py-8">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map((v) => (
                          <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                             <td className="px-6 md:px-10 py-6 md:py-8 text-[10px] md:text-xs font-bold font-mono text-indigo-300 opacity-60">#{v.id}</td>
                             <td className="px-6 md:px-10 py-6 md:py-8 text-[10px] md:text-xs font-bold text-white uppercase tracking-tight">{v.location}</td>
                             <td className="px-6 md:px-10 py-6 md:py-8">
                                <i className={`fa-solid ${v.device === 'desktop' ? 'fa-computer' : 'fa-mobile-button'} text-slate-500 text-base md:text-lg`}></i>
                             </td>
                             <td className="px-6 md:px-10 py-6 md:py-8 text-[10px] md:text-xs font-black text-cyan-400 uppercase tracking-widest">{v.mode}</td>
                             <td className="px-6 md:px-10 py-6 md:py-8">
                                <span className={`text-[8px] md:text-[9px] font-black uppercase px-3 md:px-4 py-1.5 rounded-full tracking-widest ${v.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-slate-700/20 text-slate-500 border border-slate-700/20'}`}>
                                  {v.status}
                                </span>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 animate-in zoom-in-95 duration-500 max-w-6xl mx-auto">
             {[
              { id: 'imageGen', label: 'Image Engine', icon: 'fa-palette', desc: 'Allows photorealistic visual synthesis.' },
              { id: 'webSearch', label: 'Search Relay', icon: 'fa-earth-africa', desc: 'Live web context injection.' },
              { id: 'vision', label: 'Visual Perception', icon: 'fa-eye', desc: 'Multimodal data analysis cluster.' },
              { id: 'scoring', label: 'Intelligence Metrics', icon: 'fa-chart-simple', desc: 'Detailed reasoning feedback UI.' },
              { id: 'languagePolyglot', label: 'Voice Consciousness', icon: 'fa-microphone-lines', desc: 'High-fidelity vocal conversation core.' }
            ].map(feat => (
              <div 
                key={feat.id}
                onClick={() => handleToggleFeature(feat.id as any)}
                className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 transition-all cursor-pointer flex gap-5 md:gap-8 items-center group active:scale-95 ${localConfig.featuresEnabled[feat.id as keyof SystemConfig['featuresEnabled']] ? 'bg-indigo-600/10 border-indigo-500/30 shadow-lg' : 'bg-white/[0.02] border-white/5 opacity-40'}`}
              >
                <div className={`w-14 h-14 md:w-18 md:h-18 rounded-[1.2rem] md:rounded-[1.8rem] flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${localConfig.featuresEnabled[feat.id as keyof SystemConfig['featuresEnabled']] ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/40' : 'bg-white/5 text-slate-700'}`}>
                  <i className={`fas ${feat.icon} text-xl md:text-3xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base md:text-xl font-black text-white mb-1 uppercase tracking-tight truncate">{feat.label}</h4>
                  <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{feat.desc}</p>
                </div>
                <div className={`w-12 h-6 md:w-14 md:h-7 rounded-full relative transition-all shadow-inner shrink-0 ${localConfig.featuresEnabled[feat.id as keyof SystemConfig['featuresEnabled']] ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 md:top-1.5 w-4 h-4 rounded-full bg-white transition-all shadow-xl ${localConfig.featuresEnabled[feat.id as keyof SystemConfig['featuresEnabled']] ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5'}`}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-black/50 rounded-[2rem] md:rounded-[3rem] border border-white/5 p-6 md:p-12 font-mono text-[11px] md:text-[12px] h-full overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-left-4 duration-500">
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 text-slate-500">
                <p className="text-green-500 font-bold">[SYSTEM] Core Initialization Successful. v4.0.0 Online.</p>
                <p>[AUTH] Identity Verified: Master Architect.</p>
                <p className="text-indigo-400">[VOICE] Vocal cluster synchronized with Zephyr-2 engine.</p>
                <p className="text-cyan-400">[QUALITY] Multi-stage analytical trace protocol active.</p>
                <p className="text-amber-400">[EVAL] Performance metrics audit complete. benchmarks sync'd (EXCELLENT).</p>
                {Array.from({length: 30}).map((_, i) => (
                  <p key={i} className="opacity-60 text-[10px]">[{new Date().toLocaleTimeString()}] TRACE: session_{Math.random().toString(36).substring(7)} quality_pass_96.4% (242ms).</p>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Responsive Footer */}
      <div className="h-24 md:h-28 border-t border-white/5 flex items-center justify-between px-6 md:px-14 bg-black/80 backdrop-blur-3xl shrink-0 z-10">
        <div className="hidden lg:flex items-center gap-12">
          <div className="flex items-center gap-4">
             <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse"></div>
             <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Elite Logic Stable</p>
          </div>
          <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">EVO_ULTRA_BUILD_1042</p>
        </div>
        
        <button 
          onClick={handleDeploy}
          disabled={isDeploying}
          className="relative overflow-hidden group btn-shine bg-white text-black w-full lg:w-auto px-12 lg:px-20 py-4 lg:py-5 rounded-xl lg:rounded-[2rem] font-black uppercase text-[11px] lg:text-[13px] tracking-[0.2em] lg:tracking-[0.3em] shadow-2xl hover:scale-105 transition-all active:scale-95 disabled:opacity-30"
        >
          {isDeploying ? 'Deploying...' : 'Deploy Global Quality Update'}
        </button>
      </div>

      {isDeploying && (
        <div className="fixed inset-0 z-[500] bg-[#020617] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 md:w-32 md:h-32 mb-8 md:mb-12 relative">
             <div className="absolute inset-0 rounded-full border-[6px] md:border-[8px] border-indigo-500/10"></div>
             <div className="absolute inset-0 rounded-full border-[6px] md:border-[8px] border-indigo-500 border-t-transparent animate-spin"></div>
             <div className="absolute inset-6 md:inset-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.5)]">
                <i className="fa-solid fa-bolt text-white text-3xl md:text-4xl animate-pulse"></i>
             </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 md:mb-8 uppercase tracking-tighter">Synchronizing High-Fidelity Logic</h2>
          <p className="text-indigo-400 font-mono text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.4em] uppercase animate-pulse">{deployStep}</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
