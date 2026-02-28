
import React from 'react';
import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onRateMessage?: (messageId: string, rating: 'up' | 'down') => void;
  onStartVoiceChat?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `render_${Date.now()}.png`;
    link.click();
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-transparent">
        <div className="text-center">
           <h1 className="text-3xl md:text-5xl font-medium text-white tracking-tight max-w-2xl leading-tight">
              What can I help with?
           </h1>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar bg-transparent scroll-smooth pt-16 md:pt-20">
      <div className="max-w-[760px] mx-auto space-y-8 md:space-y-12 p-4 md:p-6 pb-64">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className="flex flex-col w-full animate-in fade-in duration-300"
          >
            <div className="flex gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {msg.role === 'assistant' ? 'Festus AI Pro' : 'User'}
                  </p>
                </div>

                <div className="text-[14px] md:text-[16px] text-white leading-relaxed md:leading-[1.6] whitespace-pre-wrap font-normal break-words">
                  {msg.content}
                  
                  {msg.imageUrl && (
                    <div className="mt-6 relative group max-w-lg">
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        <img src={msg.imageUrl} alt="Visual content" className="w-full h-auto" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleDownload(msg.imageUrl!)}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                          >
                            <i className="fa-solid fa-download"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 animate-pulse pl-1.5 items-center">
             <div className="w-1 h-1 bg-white/40 rounded-full"></div>
             <span className="text-[10px] text-slate-500 uppercase tracking-widest">Thinking</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
