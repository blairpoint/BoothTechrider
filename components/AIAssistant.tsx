import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Wrench, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';
import { getSuggestedSetup, getTechAdvice, getLocalSetupRecommendation } from '../services/geminiService';
import { DEVICES } from '../data/equipment';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySetup: (deviceIds: string[]) => void;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  suggestedDevices?: string[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, onApplySetup }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'bot', 
      text: 'Welcome! I am your Local Sound Tech & Stage Manager. I run 100% offline with zero subscription needed.\n\nDescribe your performance style (e.g. "Festival 4 Decks", "Vinyl Turntables", "Techno Setup") or ask any technical audio routing question!' 
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendPrompt = (inputPrompt: string) => {
    if (!inputPrompt.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputPrompt };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    // Instant local processing with smooth typing delay
    setTimeout(async () => {
      try {
        const isSetupRequest = /setup|booth|kit|rider|play|console|cdj|turntable|mixer|deck|rig|techno|festival|vinyl|live|hybrid/i.test(userMsg.text);
        
        if (isSetupRequest) {
          const rec = getLocalSetupRecommendation(userMsg.text);
          const deviceNames = rec.devices.map(id => DEVICES.find(d => d.id === id)?.model || id).join(', ');
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'bot',
            text: `🎯 **${rec.setupName}**\n\n${rec.reasoning}\n\n**Included Hardware:**\n${deviceNames}`,
            suggestedDevices: rec.devices
          }]);
        } else {
          const advice = await getTechAdvice(userMsg.text);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'bot',
            text: advice
          }]);
        }
      } catch (e) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: "I couldn't match equipment to that request. Try 'Festival 4 Decks' or 'Vinyl Turntables'."
        }]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg h-[620px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-sm">Stage Manager & Tech Advisor</h2>
                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-800/50">
                  OFFLINE LOCAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Instant expert gear setups & audio routing guidance</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSendPrompt('Festival 4 CDJ Setup')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap transition border border-slate-700/60"
          >
            🎪 Festival 4-Deck
          </button>
          <button
            onClick={() => handleSendPrompt('Vinyl Analog Setup')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap transition border border-slate-700/60"
          >
            💿 Vinyl Turntables
          </button>
          <button
            onClick={() => handleSendPrompt('Underground Techno Rig')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap transition border border-slate-700/60"
          >
            ⚡ Underground Techno
          </button>
          <button
            onClick={() => handleSendPrompt('How do I eliminate turntable hum?')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg whitespace-nowrap transition border border-slate-700/60"
          >
            ❓ Ground Hum Fix
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl p-3.5 text-xs ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md' 
                  : 'bg-slate-800/80 text-slate-200 border border-slate-700/70 rounded-bl-none shadow-sm'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                {msg.suggestedDevices && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <button 
                      onClick={() => {
                        onApplySetup(msg.suggestedDevices!);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-all shadow-md"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      BUILD THIS BOOTH ON CANVAS
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-400">Formulating optimal rider...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <div className="relative">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(prompt)}
              placeholder="Ask for gear recommendations or tech advice..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl py-2.5 pl-3.5 pr-10 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            />
            <button 
              onClick={() => handleSendPrompt(prompt)}
              disabled={loading || !prompt.trim()}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};