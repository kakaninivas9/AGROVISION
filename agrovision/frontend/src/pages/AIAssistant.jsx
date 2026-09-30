import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiRobotLine, RiCpuLine, RiDropLine, RiTempHotLine,
  RiSendPlane2Fill, RiMicLine, RiFileCopyLine, RiCheckDoubleLine,
  RiSunCloudyLine, RiLineChartLine, RiGovernmentLine,
  RiGlobalLine, RiBrainLine, RiErrorWarningLine, RiArrowRightSLine,
  RiThunderstormsLine, RiSeedlingLine, RiPulseLine
} from 'react-icons/ri';
import api from '../services/api';

const QUICK_COMMANDS = [
  { cmd: "/analyze soil", label: "Analyze soil conditions", icon: RiSeedlingLine, color: "text-emerald-400" },
  { cmd: "/predict rain", label: "Predict irrigation", icon: RiDropLine, color: "text-blue-400" },
  { cmd: "/check disease", label: "Detect disease", icon: RiErrorWarningLine, color: "text-rose-400" },
  { cmd: "/weather", label: "Weather risk", icon: RiThunderstormsLine, color: "text-amber-400" },
  { cmd: "/fertilizer", label: "Fertilizer recommendation", icon: RiPulseLine, color: "text-purple-400" }
];

const AI_MODES = [
  { id: 'farm', label: 'Farm Assistant', icon: RiSeedlingLine },
  { id: 'weather', label: 'Weather Analyst', icon: RiSunCloudyLine },
  { id: 'market', label: 'Market Advisor', icon: RiLineChartLine },
  { id: 'govt', label: 'Govt Schemes Schema', icon: RiGovernmentLine }
];

const AI_TOOLS = [
  { label: 'Disease Detection', icon: RiErrorWarningLine, color: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-400' },
  { label: 'Yield Prediction', icon: RiLineChartLine, color: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400' },
  { label: 'Fertilizer AI', icon: RiPulseLine, color: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-400' },
  { label: 'Irrigation AI', icon: RiDropLine, color: 'from-blue-500/20 to-transparent border-blue-500/30 text-blue-400' }
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
       id: 1, 
       sender: 'ai', 
       type: 'text',
       content: "AgroVision Neural Core initialized. Groq LPU active. I am synced to your Field #3 telemetry array. How can I assist your operations today?",
       timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState('farm');
  const [activeModel, setActiveModel] = useState('Groq Hybrid');
  
  const [liveData, setLiveData] = useState({ temp: 31, hum: 65, moist: 48, n: 44, p: 30, k: 54, lastUpdate: 'Just now' });
  const chatEndRef = useRef(null);

  // Fetch Live Telemetry for Context Panel
  useEffect(() => {
    const fetchIot = async () => {
        try {
            const res = await fetch('/api/iot/data');
            const data = await res.json();
            if (data.lastUpdate) {
                setLiveData({
                    temp: data.temp || 0,
                    hum: data.hum || 0,
                    moist: data.soil || 0,
                    n: data.n || 0,
                    p: data.p || 0,
                    k: data.k || 0,
                    lastUpdate: new Date(data.lastUpdate).toLocaleTimeString()
                });
            }
        } catch (e) { /* ignore */ }
    };
    fetchIot();
    const int = setInterval(fetchIot, 3000);
    return () => clearInterval(int);
  }, []);

  const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isTyping]);

  const handleSend = (text) => {
    const msgText = text || input;
    if(!msgText.trim()) return;

    // Add User Message
    const newMsg = {
        id: Date.now(),
        sender: 'user',
        type: 'text',
        content: msgText,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Call real Backend API
    const fetchChat = async () => {
      try {
        const historyData = messages.map(m => ({ 
            role: m.sender === 'user' ? 'user' : 'assistant', 
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) 
          }));

        const { data } = await api.post('/chat', { 
            message: msgText,
            history: historyData
        });

        setIsTyping(false);
        
        if (data.reply) {
          const aiMsg = {
            id: Date.now() + 1,
            sender: 'ai',
            type: 'text',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          throw new Error(data.error || "Failed to get reply");
        }
      } catch (err) {
        setIsTyping(false);
        const errorMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          type: 'text',
          content: `⚠️ AI Core Error: ${err.response?.data?.error || err.message}. (Check backend connection)`,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    };

    fetchChat();
  };

  const generateSmartResponse = (cmd) => {
      const ts = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const base = { id: Date.now() + 1, sender: 'ai', timestamp: ts };

      if (cmd.includes('/predict rain')) {
          return { ...base, type: 'card', cardType: 'irrigation', content: {
              title: "Irrigation Recommendation",
              action: "Water in 6 hours",
              confidence: "92%",
              reason: `Soil moisture dropping rapidly (currently ${liveData.moist}%). Heat wave detected via OpenWeather API.`
          }};
      }
      if (cmd.includes('/analyze soil')) {
          return { ...base, type: 'card', cardType: 'soil', content: {
              title: "NPK Array Analysis",
              action: "Potassium Deficit Detected",
              confidence: "88%",
              reason: `Current level: ${liveData.k}mg/kg. Optimal is >80mg/kg. Apply Muriate of Potash (MOP).`
          }};
      }
      if (cmd.toLowerCase().includes('image') || cmd.toLowerCase().includes('generate') || cmd.toLowerCase().includes('show me')) {
          const prompt = cmd.replace(/generate|image|show me|of|a/gi, '').trim();
          return { ...base, type: 'image', content: {
              title: `Neural Synthesis: ${prompt.toUpperCase() || 'BIO-ALGO SCAN'}`,
              imageUrl: `https://pollinations.ai/p/${encodeURIComponent(prompt || 'majestic orange rose flower, botanical photography, cinematic macro, 8k')}?width=1024&height=1024&seed=${Math.round(Math.random()*100000)}`,
              caption: `Advanced visual reconstruction of "${prompt || 'Rose Specimen'}" completed.`
          }};
      }

      return { ...base, type: 'text', content: `I have analyzed the parameters for "${cmd}". Based on the live telemetry from Field #3, your crop vitals are maintaining a stable trajectory. Would you like me to run a deeper diagnostic scan?` };
  };

  const handleCopy = (text) => {
      navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-8 h-[calc(100vh-100px)] flex flex-col pt-4">
      
      {/* Header Overview */}
      <div className="glass card p-6 border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-transparent flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
             <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-glow text-obsidian relative">
                <RiBrainLine size={28} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border border-obsidian rounded-full" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-black text-white tracking-tight">Neural Core <span className="text-blue-400 font-medium">α</span></h1>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <RiCpuLine size={14}/> {activeModel} • Farm: Field #3
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 w-full md:w-auto overflow-x-auto hide-scrollbar">
              <select 
                  className="bg-obsidian-light/50 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl appearance-none outline-none focus:border-blue-500/50 cursor-pointer"
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
              >
                  <option>Groq Hybrid</option>
                  <option>Llama 3 (8B)</option>
                  <option>GPT-4o</option>
              </select>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl whitespace-nowrap">
                  <RiGlobalLine className="text-emerald-400 animate-spin-slow" size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sensors: Connected</span>
              </div>
          </div>
      </div>

      {/* Main Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          
          {/* LEFT: Central AI Chat Interface */}
          <div className="lg:col-span-3 glass card border border-white/5 flex flex-col overflow-hidden bg-obsidian-light/20 relative">
              {/* Multi-Mode AI Tabs */}
              <div className="flex gap-2 p-3 border-b border-white/5 overflow-x-auto hide-scrollbar bg-obsidian-dark/50">
                  {AI_MODES.map(mode => (
                      <button 
                          key={mode.id}
                          onClick={() => setActiveMode(mode.id)}
                          className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all ${activeMode === mode.id ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-white border border-transparent hover:bg-white/5'}`}
                      >
                          <mode.icon size={16} /> {mode.label}
                      </button>
                  ))}
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <AnimatePresence>
                      {messages.map(msg => (
                          <motion.div 
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                          >
                              <div className="flex items-center gap-2 mb-1.5 px-1">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                      {msg.sender === 'user' ? 'Farmer Profile' : 'Neural Core'} • {msg.timestamp}
                                  </span>
                              </div>
                              
                              {/* Text Message Bubble */}
                              {msg.type === 'text' && (
                                  <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${msg.sender === 'user' ? 'bg-blue-600 border-blue-500 text-white rounded-tr-sm' : 'bg-obsidian-light/50 border-white/10 text-slate-200 rounded-tl-sm'}`}>
                                      {msg.content}
                                  </div>
                              )}
                              
                              {/* Visual Intelligence Card (AI Output) */}
                              {msg.type === 'card' && (
                                  <div className="bg-obsidian-light/80 border border-blue-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden group w-full">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[30px] rounded-full pointer-events-none" />
                                      <div className="flex items-center gap-2 mb-4">
                                          <RiRobotLine className="text-blue-400" size={20} />
                                          <h4 className="text-white font-black text-sm">{msg.content.title}</h4>
                                      </div>
                                      <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl mb-4">
                                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Recommended Action</p>
                                          <p className="text-lg font-black text-blue-400 tracking-tight">{msg.content.action}</p>
                                      </div>
                                      <div className="flex justify-between items-center text-xs mb-2">
                                          <span className="font-bold text-slate-500">Confidence Score:</span>
                                          <span className="font-black text-emerald-400 flex items-center gap-1"><RiCheckDoubleLine/> {msg.content.confidence}</span>
                                      </div>
                                      <div className="flex justify-between items-start text-xs border-t border-white/5 pt-2 mt-2">
                                          <span className="font-bold text-slate-500">Telemetry Reason:</span>
                                          <span className="font-medium text-slate-300 text-right max-w-[60%]">{msg.content.reason}</span>
                                      </div>
                                  </div>
                              )}

                              {/* Image Generation Card */}
                              {msg.type === 'image' && (
                                  <div className="glass card border-white/10 p-2 rounded-2xl overflow-hidden group/img relative w-full lg:max-w-[400px]">
                                      <div className="aspect-square relative rounded-xl overflow-hidden bg-obsidian-dark border border-white/5 shimmer-box">
                                          <img 
                                              src={msg.content.imageUrl} 
                                              alt="AI Generated" 
                                              className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover/img:scale-110"
                                              onLoad={(e) => {
                                                  e.target.style.opacity = 1;
                                                  scrollToBottom();
                                              }}
                                              style={{ opacity: 0 }}
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 to-transparent flex items-end p-4 z-20">
                                              <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{msg.content.title}</p>
                                          </div>
                                      </div>
                                      <div className="p-3">
                                          <p className="text-xs text-slate-400 font-medium leading-relaxed italic">"{msg.content.caption}"</p>
                                      </div>
                                  </div>
                              )}

                              {/* Copy Button for AI Messages */}
                              {msg.sender === 'ai' && msg.type === 'text' && (
                                  <button onClick={() => handleCopy(msg.content)} className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-2 hover:text-white transition-colors">
                                      <RiFileCopyLine /> Copy Logic
                                  </button>
                              )}
                          </motion.div>
                      ))}
                  </AnimatePresence>

                  {/* AI Thinking Animation */}
                  {isTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 max-w-[85%]">
                          <div className="p-4 rounded-2xl bg-obsidian-light/50 border border-white/5 flex gap-1 items-center rounded-tl-sm h-12">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          </div>
                      </motion.div>
                  )}
                  <div ref={chatEndRef} />
              </div>

              {/* Command Tips & Input Area */}
              <div className="p-4 border-t border-white/5 bg-obsidian-dark/30">
                  {/* Smart Suggestion Chips */}
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-2">
                      {QUICK_COMMANDS.map(cmd => (
                          <button 
                              key={cmd.cmd}
                              onClick={() => handleSend(cmd.cmd)}
                              className="flex-shrink-0 flex items-center gap-2 bg-obsidian-light/50 border border-white/10 hover:border-white/30 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-300 transition-all hover:-translate-y-0.5"
                          >
                              <cmd.icon className={cmd.color} size={14} /> {cmd.label}
                          </button>
                      ))}
                  </div>

                  {/* Input Box */}
                  <div className="relative flex items-center">
                      <button className="absolute left-4 text-slate-500 hover:text-blue-400 transition-colors">
                          <RiMicLine size={20} />
                      </button>
                      <input 
                          type="text" 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder="Type /commands or ask a question directly..."
                          className="w-full bg-obsidian-light/80 border border-white/10 focus:border-blue-500/50 rounded-2xl py-4 pl-12 pr-14 text-sm text-white font-medium outline-none placeholder:text-slate-600 transition-all"
                      />
                      <button 
                          onClick={() => handleSend()}
                          disabled={!input.trim() || isTyping}
                          className="absolute right-2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors disabled:opacity-50"
                      >
                          <RiSendPlane2Fill size={18} />
                      </button>
                  </div>
              </div>
          </div>

          {/* RIGHT: Farm Context Panel */}
          <div className="lg:col-span-1 space-y-6 flex flex-col min-h-0 overflow-y-auto hide-scrollbar pb-6 pr-1">
              
              {/* Live Telemetry Display */}
              <div className="glass card p-6 border-white/5 relative overflow-hidden">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center justify-between">
                      Farm Status <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-glow-green-sm" title="Live Link Active" />
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest"><RiDropLine className="text-blue-400"/> Moisture</div>
                          <span className="text-white font-black">{Math.round(liveData.moist)}%</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest"><RiTempHotLine className="text-orange-400"/> Temp</div>
                          <span className="text-white font-black">{Math.round(liveData.temp)}°C</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest"><RiSunCloudyLine className="text-amber-400"/> Weather</div>
                          <span className="text-white font-black">Clear</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest"><RiSeedlingLine className="text-emerald-400"/> Crop</div>
                          <span className="text-white font-black">Potato</span>
                      </div>
                  </div>
              </div>

              {/* AI Memory Context */}
              <div className="glass card p-6 border-white/5 bg-obsidian-light/30">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <RiCpuLine /> Core Memory Context
                  </h3>
                  <div className="flex flex-wrap gap-2">
                      <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-300">Location: Punjab</span>
                      <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-300">Phase: Vegetative</span>
                      <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-300">History: Late Blight (2025)</span>
                  </div>
              </div>

              {/* Advanced AI Tools Grid */}
              <div className="glass card p-6 border-white/5 flex-1 min-h-[300px]">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Dedicated Agents</h3>
                  <div className="grid gap-3">
                      {AI_TOOLS.map(tool => (
                          <div key={tool.label} className={`bg-gradient-to-r ${tool.color} border px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform`}>
                              <div className="flex items-center gap-3">
                                  <tool.icon size={18} />
                                  <span className="text-[11px] font-black uppercase tracking-widest text-white">{tool.label}</span>
                              </div>
                              <RiArrowRightSLine className="opacity-50" />
                          </div>
                      ))}
                  </div>
              </div>

          </div>
      </div>

    </div>
  );
}
