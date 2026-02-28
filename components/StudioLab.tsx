
import React, { useState, useRef, useEffect } from 'react';
import { generateImage, proEditImage } from '../services/geminiService';
import { AppMode, EditLayer } from '../types';

interface StudioLabProps {
  mode: AppMode.IMAGE | AppMode.LOGO | AppMode.STUDIO | AppMode.PRO_EDITOR;
  onClose?: () => void;
}

const StudioLab: React.FC<StudioLabProps> = ({ mode }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [layers, setLayers] = useState<EditLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<EditLayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tab, setTab] = useState<'GEN' | 'EDIT' | 'LOGO'>('GEN');
  
  // Pro Config
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "9:16">("1:1");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [style, setStyle] = useState('Cinematic');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const blendModes: EditLayer['blendMode'][] = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
  ];

  useEffect(() => {
    if (layers.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...layers]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [layers]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLayers([...history[historyIndex - 1]]);
    }
  };

  const updateLayer = (id: string, updates: Partial<EditLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleGenerate = async (logo = false) => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    try {
      const finalPrompt = logo ? `PROFESSIONAL LOGO: ${prompt}, minimalist, badge style, vector quality, transparent background.` : prompt;
      const img = await generateImage(finalPrompt, { aspectRatio, imageSize });
      const newLayer: EditLayer = {
        id: Date.now().toString(),
        name: logo ? `Logo Layer ${layers.length + 1}` : `Image Layer ${layers.length + 1}`,
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        type: 'image',
        data: img
      };
      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); }
  };

  const applyProEdit = async (instruction: string) => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.data) return;
    setIsProcessing(true);
    try {
      const base64 = activeLayer.data.split(',')[1];
      const result = await proEditImage(base64, "image/png", instruction, { aspectRatio });
      updateLayer(activeLayer.id, { data: result });
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Security: Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file format. Please upload PNG, JPEG, WEBP, or HEIC.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const newLayer: EditLayer = {
          id: Date.now().toString(),
          name: file.name,
          visible: true,
          opacity: 100,
          blendMode: 'normal',
          type: 'image',
          data: ev.target?.result as string
        };
        setLayers(prev => [newLayer, ...prev]);
        setActiveLayerId(newLayer.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const layer = layers.find(l => l.id === id);
    if (layer) updateLayer(id, { visible: !layer.visible });
  };

  return (
    <div className="flex h-full w-full bg-[#050505] text-white overflow-hidden relative pt-16 lg:pt-0">
      <aside className="w-80 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-40">
        <div className="flex border-b border-white/5">
          <button onClick={() => setTab('GEN')} className={`flex-1 h-14 text-[10px] font-black uppercase tracking-widest ${tab === 'GEN' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}>Generate</button>
          <button onClick={() => setTab('EDIT')} className={`flex-1 h-14 text-[10px] font-black uppercase tracking-widest ${tab === 'EDIT' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}>Pro Edit</button>
          <button onClick={() => setTab('LOGO')} className={`flex-1 h-14 text-[10px] font-black uppercase tracking-widest ${tab === 'LOGO' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}>Logo</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
          {tab === 'GEN' && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-3">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {['1:1', '16:9', '9:16', '4:3'].map(r => (
                    <button key={r} onClick={() => setAspectRatio(r as any)} className={`py-2.5 rounded-xl border text-[10px] font-black ${aspectRatio === r ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'border-white/5 text-slate-500'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-3">Target Fidelity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1K', '2K', '4K'].map(s => (
                    <button key={s} onClick={() => setImageSize(s as any)} className={`py-2.5 rounded-xl border text-[10px] font-black ${imageSize === s ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'border-white/5 text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your vision..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-indigo-500/50 resize-none" />
              <button onClick={() => handleGenerate()} disabled={isProcessing} className="w-full py-4 bg-indigo-600 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                {isProcessing ? 'Synthesizing...' : 'Generate Vision'}
              </button>
            </div>
          )}

          {tab === 'EDIT' && (
            <div className="space-y-4">
               <div className="flex items-center justify-between mb-2">
                 <p className="text-[10px] font-bold text-slate-500 uppercase">Nano Banana Tools</p>
                 <span className="text-[8px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">ENGINE ACTIVE</span>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { n: 'Remove Background', i: 'fa-eraser' },
                   { n: 'Smart Retouch', i: 'fa-wand-magic-sparkles' },
                   { n: 'Style Transfer', i: 'fa-palette' },
                   { n: 'Object Enhance', i: 'fa-cube' },
                   { n: 'Super Rez 4K', i: 'fa-up-right-and-down-left-from-center' },
                   { n: 'Color Correct', i: 'fa-sliders' }
                 ].map(tool => (
                   <button key={tool.n} onClick={() => applyProEdit(tool.n)} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all gap-2 group">
                     <i className={`fa-solid ${tool.i} text-slate-500 group-hover:text-indigo-400 transition-colors`}></i>
                     <span className="text-[8px] font-black uppercase text-slate-400 text-center group-hover:text-white transition-colors">{tool.n}</span>
                   </button>
                 ))}
               </div>
               <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">Color Grading</p>
                  <div className="grid grid-cols-1 gap-2">
                    {['Cinematic', 'Film Stock', 'HDR Enhance', 'B&W Pro', 'Vibrant Lux'].map(filter => (
                      <button key={filter} onClick={() => applyProEdit(`Apply ${filter} color grading`)} className="w-full py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">{filter}</button>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {tab === 'LOGO' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Logo Forge v2.0</p>
              </div>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Company name and style (e.g. Minimalist Tech Logo)..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-amber-500/50 resize-none" />
              <button onClick={() => handleGenerate(true)} disabled={isProcessing} className="w-full py-4 bg-amber-600 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
                {isProcessing ? 'Forging...' : 'Build Logo'}
              </button>
            </div>
          )}
        </div>

        <div className="h-[320px] border-t border-white/5 flex flex-col p-4 bg-black overflow-hidden">
           <div className="flex justify-between items-center mb-4 px-2">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Layers Panel</span>
             <button onClick={() => setLayers([])} className="text-slate-600 hover:text-rose-400 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
           </div>
           <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-4">
             {layers.map(layer => (
               <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} className={`flex flex-col gap-2 p-3 rounded-xl border transition-all cursor-pointer ${activeLayerId === layer.id ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                 <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0"><img src={layer.data} className="w-full h-full object-cover" /></div>
                    <span className="flex-1 text-[10px] font-bold truncate opacity-80">{layer.name}</span>
                    <button onClick={(e) => toggleVisibility(layer.id, e)} className="p-1">
                       <i className={`fa-solid ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} text-[10px] text-slate-500`}></i>
                    </button>
                 </div>
                 
                 {activeLayerId === layer.id && (
                   <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between">
                         <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Blend Mode</label>
                         <select 
                            value={layer.blendMode}
                            onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as any })}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black/40 border border-white/10 rounded-md text-[9px] text-indigo-300 font-bold outline-none px-1 py-0.5"
                          >
                            {blendModes.map(mode => (
                              <option key={mode} value={mode} className="bg-[#111]">{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
                            ))}
                         </select>
                      </div>
                      <div className="flex items-center gap-3">
                         <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Opacity</label>
                         <input 
                            type="range" min="0" max="100" 
                            value={layer.opacity} 
                            onChange={(e) => updateLayer(layer.id, { opacity: parseInt(e.target.value) })}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                         />
                         <span className="text-[8px] font-bold text-slate-400 w-5">{layer.opacity}%</span>
                      </div>
                   </div>
                 )}
               </div>
             ))}
             {layers.length === 0 && <p className="text-center py-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">No active layers</p>}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-12 bg-[#020202] relative">
        <div className="absolute top-6 left-6 flex gap-4 z-50">
           <button onClick={handleUndo} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"><i className="fa-solid fa-undo text-xs"></i></button>
           <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Import Photo</button>
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
        </div>

        {layers.length === 0 ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto"><i className="fa-solid fa-wand-sparkles text-2xl text-indigo-400"></i></div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Neural Studio Lab Pro</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Advanced Synthesis & Forge Hub</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center group">
            {isProcessing && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            )}
            <div className="relative max-w-full max-h-full rounded-3xl border border-white/10 flex items-center justify-center bg-black shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
               {layers.slice().reverse().map((layer, idx) => (
                 <img 
                   key={layer.id}
                   src={layer.data} 
                   style={{ 
                     mixBlendMode: layer.blendMode, 
                     opacity: layer.visible ? (layer.opacity / 100) : 0,
                     zIndex: layers.length - idx,
                     position: idx === layers.length - 1 ? 'relative' : 'absolute'
                   }} 
                   className={`max-w-full max-h-[80vh] object-contain transition-all duration-300 ${!layer.visible && 'pointer-events-none'}`}
                 />
               ))}
            </div>
          </div>
        )}
      </main>

      {activeLayerId && (
        <div className="fixed bottom-10 right-10 z-[100] bg-black/60 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl flex items-center gap-6 shadow-2xl animate-in slide-in-from-right-10">
           <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resolution</span>
              <span className="text-[10px] font-bold text-white font-mono">{imageSize === '4K' ? '3840 x 2160' : imageSize === '2K' ? '2560 x 1440' : '1024 x 1024'}</span>
           </div>
           <button onClick={() => {
              const link = document.createElement('a');
              // Download composite or just active? Usually composite in studio
              link.href = layers.find(l => l.id === activeLayerId)?.data!;
              link.download = `festus_render_${Date.now()}.png`;
              link.click();
           }} className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Export Active</button>
        </div>
      )}
    </div>
  );
};

export default StudioLab;
