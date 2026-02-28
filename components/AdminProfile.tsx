import React, { useState, useRef } from 'react';

interface AdminProfileProps {
  onClose: () => void;
  isAdmin: boolean;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ onClose, isAdmin }) => {
  const [adminImage, setAdminImage] = useState(() => {
    return localStorage.getItem('festus_admin_image') || "https://scontent.fnbo18-1.fna.fbcdn.net/v/t39.30808-6/628321123_1263583825663534_7648374767625784060_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=10VQTTGJi3kQ7kNvwEttd-8&_nc_oc=AdlmrLgHslCJJ7ze067IrA0p6ZjPE9vk1yJQG_h3fkMN3z7UfZyNBdfrat6oWd8RoFA&_nc_zt=23&_nc_ht=scontent.fnbo18-1.fna&_nc_gid=8IzBRVTVyWTMxG_eYN_FlQ&oh=00_Aft8bJu33mRaBbsxDhCFxU574mlt055cSwEQfjSOaj1muA&oe=69A746D6";
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (isAdmin) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAdminImage(base64String);
        localStorage.setItem('festus_admin_image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all z-10"
        >
          <i className="fa-solid fa-times text-lg"></i>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Sidebar / Bio Section */}
          <div className="bg-[#0f0f0f] border-r border-white/5 p-8 md:p-12 flex flex-col items-center text-center">
            <div 
              onClick={handleImageClick}
              className={`w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-1 mb-6 shadow-2xl shadow-indigo-500/20 group relative ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative">
                <img 
                  src={adminImage} 
                  alt="Sezerano Festus" 
                  className={`w-full h-full object-cover transition-transform duration-500 ${isAdmin ? 'group-hover:scale-110' : ''}`}
                  referrerPolicy="no-referrer"
                />
                {isAdmin && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <i className="fa-solid fa-camera text-white text-xl mb-1"></i>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Change</span>
                  </div>
                )}
              </div>
              {isAdmin && (
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              )}
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Sezerano Festus</h2>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-6">Festus AI Pro Architect</p>
            
            <div className="w-full space-y-4 text-left">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-map-pin text-indigo-500"></i> Kigali, Rwanda
                </p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Field of Study</p>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <i className="fa-solid fa-microchip text-indigo-500"></i> Electronics Engineering
                </p>
              </div>
            </div>

            <div className="mt-8 w-full">
              <a 
                href="https://wa.me/250796506100" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-2 p-8 md:p-12 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div>
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <i className="fa-solid fa-graduation-cap text-indigo-500"></i> Education
              </h3>
              <div className="space-y-4">
                <div className="group p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">University of Rwanda</h4>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest">Current</span>
                  </div>
                  <p className="text-slate-400 text-sm">Bachelor of Science in Electronics and Telecommunication Engineering</p>
                </div>
                
                <div className="group p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">Giheke Technical Secondary School</h4>
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest">Alumni</span>
                  </div>
                  <p className="text-slate-400 text-sm">Advanced Level Certificate in Electronics</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <i className="fa-solid fa-briefcase text-indigo-500"></i> Professional Background
              </h3>
              <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                <p className="text-slate-300 leading-relaxed text-sm">
                  Passionate Electronics Engineer with a strong focus on embedded systems, AI integration, and full-stack development. 
                  Dedicated to building innovative solutions that bridge the gap between hardware and software. 
                  Experienced in designing scalable architectures and implementing cutting-edge technologies to solve real-world problems.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <i className="fa-solid fa-layer-group text-indigo-500"></i> Technical Arsenal
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Electronics', 'Embedded Systems', 'React', 'TypeScript', 'Node.js', 'AI Integration', 'PCB Design', 'IoT', 'System Architecture'].map(skill => (
                  <span key={skill} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30 transition-all cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
