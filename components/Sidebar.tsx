
import React from 'react';
import { AppMode, ChatSession } from '../types.ts';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: (mode: AppMode, params?: { screenShare?: boolean; guidance?: boolean }) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  onOpenAdminProfile?: () => void;
  userName?: string;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewChat,
  onLogout,
  isAdmin,
  onOpenAdmin,
  onOpenAdminProfile,
  userName = "User",
  onCloseMobile
}) => {
  const menuItems = [
    { id: 'new', icon: 'fa-plus', label: 'New chat', action: () => onNewChat(AppMode.CHAT) },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d0d] text-slate-300 font-medium overflow-hidden">
      <div className="lg:hidden p-4 flex justify-end">
        <button onClick={onCloseMobile} className="p-2 text-slate-500 hover:text-white">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <i className="fa-solid fa-bolt text-white"></i>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-white tracking-tighter leading-none uppercase">Festus AI</h1>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Ultra Intelligence Engine</span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors text-[14px] text-left"
          >
            <i className={`fa-solid ${item.icon} w-5 text-center text-slate-400`}></i>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4">
        <div className="space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[14px] truncate transition-all ${
                activeSessionId === session.id 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {session.title || 'Untitled Session'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-4 border-t border-white/5 bg-[#0d0d0d] space-y-1">
          <button 
            onClick={() => onNewChat(AppMode.LIVE)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-slate-400 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-microphone-lines w-5 text-center"></i> 
            <span>Voice Sync</span>
          </button>
          <button 
            onClick={() => onNewChat(AppMode.LIVE, { screenShare: true, guidance: true })}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-slate-400 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-desktop w-5 text-center"></i> 
            <span>Screen Guidance</span>
          </button>
      </div>

      <div className="p-4 border-t border-white/5 bg-[#0d0d0d]">
        {isAdmin && (
           <button 
             onClick={onOpenAdmin}
             className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all text-[14px] mb-2"
           >
             <i className="fa-solid fa-shield-halved w-5 text-center"></i>
             <span>Admin</span>
           </button>
         )}

         <div className="space-y-4 pt-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Admin Address</h3>
            
            <div 
              onClick={onOpenAdminProfile}
              className="flex items-center gap-3 group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0 border border-indigo-500/30">
                <i className="fa-solid fa-user-shield text-xs"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors truncate">Sezerano Festus</p>
                <p className="text-[9px] text-slate-500 truncate">Admin Profile</p>
              </div>
            </div>
            
            <a 
              href="https://wa.me/250796506100" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 group p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0 border border-emerald-500/30">
                <i className="fa-brands fa-whatsapp text-xs"></i>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">0796506100</p>
                <p className="text-[9px] text-slate-500 truncate">WhatsApp Contact</p>
              </div>
            </a>

            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-2 mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-rose-400 transition-colors">
               <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
            </button>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
