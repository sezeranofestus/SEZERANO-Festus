
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { Copy, Volume2, VolumeX, Download, Check, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onRateMessage?: (messageId: string, rating: 'up' | 'down') => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `festus_ai_${Date.now()}.png`;
    link.click();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-transparent">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
           <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight max-w-2xl leading-tight mb-4">
              FESTUS AI
           </h1>
           <p className="text-slate-400 text-lg md:text-xl font-medium">
             Your Ultra Multi-Platform Intelligence Engine
           </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar bg-transparent scroll-smooth pt-20">
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 pb-48">
        {messages.map((msg, idx) => (
          <motion.div 
            key={msg.id} 
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex w-full group",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "flex gap-3 max-w-[85%] md:max-w-[75%]",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                msg.role === 'user' ? "bg-white/10 border-white/20" : "bg-indigo-600 border-indigo-400"
              )}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-lg",
                  msg.role === 'user' 
                    ? "bg-white/10 text-white rounded-tr-none border border-white/10" 
                    : "bg-[#1a1a1a] text-slate-200 rounded-tl-none border border-white/5"
                )}>
                  {msg.type === 'text' ? (
                    <div className="markdown-body prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  
                  {msg.imageUrl && (
                    <div className="mt-4 relative group/img rounded-xl overflow-hidden border border-white/10 bg-black/20">
                      <img 
                        src={msg.imageUrl} 
                        alt="AI Generated" 
                        className="w-full h-auto object-contain max-h-[500px]" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all">
                        <button 
                          onClick={() => handleDownload(msg.imageUrl!)}
                          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={cn(
                  "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  <button 
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="p-1.5 hover:bg-white/5 rounded-md text-slate-500 hover:text-white transition-colors"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                  <button 
                    onClick={() => handleSpeak(msg.content, msg.id)}
                    className={cn(
                      "p-1.5 hover:bg-white/5 rounded-md transition-colors",
                      speakingId === msg.id ? "text-indigo-400" : "text-slate-500 hover:text-white"
                    )}
                    title={speakingId === msg.id ? "Stop speaking" : "Read aloud"}
                  >
                    {speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        <AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full" 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MessageList;
