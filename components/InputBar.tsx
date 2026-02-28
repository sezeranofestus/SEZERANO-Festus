
import React, { useRef, useState, useEffect } from 'react';
import { AppMode } from '../types';

interface InputBarProps {
  onSendMessage: (msg: string, file?: { data: string; mimeType: string }, proConfig?: any) => void;
  onStartVoiceChat: () => void;
  mode: AppMode;
  disabled?: boolean;
  activeFeatures: { search: boolean, reason: boolean, vision: boolean };
  onToggleFeature: (f: 'search' | 'reason' | 'vision') => void;
  isInitial?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ 
  onSendMessage, 
  onStartVoiceChat, 
  disabled, 
  activeFeatures, 
  onToggleFeature,
  isInitial = false
}) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [showProConfig, setShowProConfig] = useState(false);
  
  // Pro Image Settings
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "9:16">("1:1");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [style, setStyle] = useState('Cinematic');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedFile) || disabled) return;
    
    const proConfig = { aspectRatio, imageSize, style };
    onSendMessage(input, selectedFile ? { data: selectedFile.data, mimeType: selectedFile.mimeType } : undefined, proConfig);
    
    setInput('');
    setSelectedFile(null);
    setShowProConfig(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = (readerEvent.target?.result as string).split(',')[1];
        setSelectedFile({ data: base64, mimeType: file.type, name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`w-full flex flex-col items-center transition-all duration-700 ${isInitial ? 'py-12 md:py-24 px-4 md:px-6' : 'p-4 md:p-10 bg-gradient-to-t from-[#050505] to-transparent'}`}>
      <div className="w-full max-w-[760px] relative">
        
        {/* Pro Config Popover - Optimized for mobile */}
        {showProConfig && (
          <>
            <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowProConfig(false)} />
            <div className="absolute bottom-full mb-4 left-0 right-0 lg:right-auto lg:w-80 bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl animate-in slide-in-from-bottom-4 z-50">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Neural Image Config</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Style Preset</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500/50">
                    {['Cinematic', 'Realistic', 'Anime', '3D Render', 'Minimalist', 'Logo Style', 'Portrait'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Aspect</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none">
                      <option value="1:1">1:1</option>
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Quality</label>
                    <select value={imageSize} onChange={(e) => setImageSize(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none">
                      <option value="1K">HD</option>
                      <option value="2K">2K Pro</option>
                      <option value="4K">4K Ultra</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedFile && (
          <div className="absolute -top-16 left-0 right-0 md:right-auto animate-in slide-in-from-bottom-2 flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl max-w-fit">
             <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center overflow-hidden border border-white/5">
                <img src={`data:${selectedFile.mimeType};base64,${selectedFile.data}`} className="w-full h-full object-cover" />
             </div>
             <span className="text-[11px] text-white/60 truncate max-w-[120px]">{selectedFile.name}</span>
             <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-white/10 rounded-md text-slate-500 hover:text-rose-400 active:scale-90 transition-all">
               <i className="fa-solid fa-xmark text-sm"></i>
             </button>
          </div>
        )}

        <div className={`shining-border bg-[#1a1a1a]/80 backdrop-blur-3xl rounded-[24px] md:rounded-[28px] p-2 flex flex-col border border-white/10 shadow-2xl transition-all focus-within:bg-[#202020] group`}>
          
          <div className="flex items-center px-1 md:px-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all shrink-0"
              title="Attach File"
            >
              <i className="fa-solid fa-plus text-[16px]"></i>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Festus AI Pro..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 py-3.5 md:py-4 px-3 md:px-4 outline-none text-[15px] md:text-[16px] resize-none overflow-y-auto leading-relaxed"
            />

            <div className="flex items-center gap-1 shrink-0">
              {/* FEATURE ACTIVATION: Voice Sync Quick Access Icon */}
              <button
                type="button"
                onClick={onStartVoiceChat}
                className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-500/10 active:scale-90 transition-all shrink-0"
                title="Start Voice Chat"
              >
                <i className="fa-solid fa-microphone-lines text-[15px] md:text-[16px]"></i>
              </button>

              <button
                onClick={() => handleSubmit()}
                disabled={(!input.trim() && !selectedFile) || disabled}
                className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full transition-all ${
                  input.trim() || selectedFile
                    ? 'bg-white text-black hover:scale-105 active:scale-90 shadow-lg shadow-white/10'
                    : 'text-white/10 bg-white/5'
                }`}
              >
                <i className={`fa-solid ${disabled ? 'fa-spinner fa-spin' : 'fa-arrow-up'} text-[15px] md:text-[16px]`}></i>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4 md:mt-6 overflow-x-auto no-scrollbar pb-2">
           <div className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 bg-white/5 rounded-full border border-white/5 shrink-0">
              <button 
                onClick={onStartVoiceChat}
                className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-widest whitespace-nowrap active:scale-95"
              >
                <i className="fa-solid fa-headset text-indigo-400"></i>
                <span className="hidden xs:inline">Vocal Presence</span>
                <span className="xs:hidden">Vocal</span>
              </button>
              <div className="w-px h-3 bg-white/10"></div>
              <button 
                onClick={() => onToggleFeature('vision')}
                className={`flex items-center gap-2 text-[10px] md:text-[11px] font-bold transition-colors uppercase tracking-widest whitespace-nowrap active:scale-95 ${activeFeatures.vision ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className={`fa-solid fa-desktop ${activeFeatures.vision ? 'text-cyan-400' : ''}`}></i>
                <span className="hidden xs:inline">Observe Screen</span>
                <span className="xs:hidden">Observe</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InputBar;
