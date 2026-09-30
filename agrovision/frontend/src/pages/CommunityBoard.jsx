import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiMapPinLine, RiPlantLine, RiTimeLine, RiVerifiedBadgeFill,
  RiThumbUpLine, RiThumbUpFill, RiChat1Line, RiShareForwardLine, 
  RiBookmarkLine, RiBookmarkFill, RiBrainLine, RiFireFill,
  RiRadarLine, RiPulseLine, RiCheckboxCircleFill, RiArrowRightUpLine,
  RiFilter3Line, RiGlobalLine
} from 'react-icons/ri';

// --- DATA MODEL ---
const INITIAL_POSTS = [
  {
    id: 1,
    author: { name: "Ramesh Singh", avatar: "RS", isExpert: true, type: "Senior Agronomist" },
    location: "Punjab, India",
    crop: "Potato",
    issue: "Late Blight Detected",
    content: "Noticed rapidly spreading brown lesions on lower potato leaves. Our AI scan confirmed Late Blight at 94% confidence. Immediate action required to prevent field wipeout.",
    recommendation: "Immediate Copper Fungicide Spray required. Withholding irrigation for 3 days.",
    timestamp: "2 mins ago",
    tags: ["#Potato", "#LateBlight", "#DiseaseAlert"],
    aiConsensus: { text: "78% Farmers Recommend Copper Spray", confidence: "High" },
    stats: { likes: 342, comments: 45, shares: 12 },
    isLiked: false,
    isSaved: true
  },
  {
    id: 2,
    author: { name: "Venkat Reddy", avatar: "VR", isExpert: false, type: "Verified Farmer" },
    location: "Andhra Pradesh",
    crop: "Paddy",
    issue: "Severe Moisture Deficit",
    content: "Sensors dropping below 20% soil moisture in Sector 7. The heatwave is accelerating evaporation drastically. Does anyone suggest a specific silicon foliar spray?",
    recommendation: "Activate drip lines at 80% flow. Apply Potassium Silicate to reduce heat stress.",
    timestamp: "14 mins ago",
    tags: ["#Rice", "#Irrigation", "#HeatWave"],
    aiConsensus: { text: "91% Confidence in Potassium Silicate Efficacy", confidence: "Very High" },
    stats: { likes: 128, comments: 32, shares: 5 },
    isLiked: true,
    isSaved: false
  },
  {
    id: 3,
    author: { name: "K. Natarajan", avatar: "KN", isExpert: true, type: "ICAR Scientist" },
    location: "Tamil Nadu",
    crop: "Sugarcane",
    issue: "Early Shoot Borer",
    content: "Thermal imaging indicates high pest density in the root zones. Avoid blanket spraying. Target the specific clusters using drones.",
    recommendation: "Release Trichogramma chilonis at 50,000/ha.",
    timestamp: "1 hour ago",
    tags: ["#Sugarcane", "#PestAlert", "#BioControl"],
    aiConsensus: { text: "Bio-Control Recommended over Chemical", confidence: "High" },
    stats: { likes: 890, comments: 112, shares: 45 },
    isLiked: false,
    isSaved: false
  }
];

const TRENDING = [
  { rank: 1, topic: "#LateBlight", volume: "12.4K Alerts", region: "Punjab" },
  { rank: 2, topic: "Soil Moisture Drop", volume: "High Risk", region: "AP / Telangana" },
  { rank: 3, topic: "Yellow Rust", volume: "Tracking Spread", region: "Haryana" },
];

const FILTER_TAGS = ['All', '#Wheat', '#Rice', '#Potato', '#DiseaseAlert', '#Irrigation', '#Fertilizer'];

// --- COMPONENTS ---

const IntelligencePost = ({ post }) => {
    const [liked, setLiked] = useState(post.isLiked);
    const [saved, setSaved] = useState(post.isSaved);
    const [likesCount, setLikesCount] = useState(post.stats.likes);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass card p-6 group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden border border-white/5 bg-obsidian-light/30"
        >
            {/* Header: Author & Meta */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-glow ${post.author.isExpert ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-obsidian' : 'bg-obsidian-light/80 text-white border border-white/10'}`}>
                        {post.author.avatar}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-white font-black">{post.author.name}</h4>
                            {post.author.isExpert && <RiVerifiedBadgeFill className="text-emerald-400" size={16} title="Verified Expert" />}
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{post.author.type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                    <RiTimeLine size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{post.timestamp}</span>
                </div>
            </div>

            {/* Context Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    <RiMapPinLine size={14} /> {post.location}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <RiPlantLine size={14} /> {post.crop}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    <RiRadarLine size={14} className="animate-pulse" /> {post.issue}
                </span>
            </div>

            {/* Content Body */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {post.content}
            </p>

            {/* AI Consensus & Recommendation Panel */}
            <div className="bg-obsidian-dark/50 rounded-2xl border border-purple-500/20 p-5 mb-6 relative overflow-hidden shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px]" />
                <div className="flex items-center gap-2 mb-3">
                    <RiBrainLine className="text-purple-400" size={20} />
                    <span className="text-xs font-black uppercase tracking-widest text-purple-400">AI Consensus Engine</span>
                </div>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <p className="text-white font-bold text-sm">{post.aiConsensus.text}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1"><span className="text-emerald-400">Recommendation:</span> {post.recommendation}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full whitespace-nowrap">
                        <RiCheckboxCircleFill className="text-emerald-400" size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{post.aiConsensus.confidence} Confidence</span>
                    </div>
                </div>
            </div>

            {/* Hash Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                    <span key={tag} className="text-xs font-bold text-slate-500 hover:text-white cursor-pointer transition-colors">{tag}</span>
                ))}
            </div>

            {/* Interactive Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex gap-4 sm:gap-6 text-slate-400">
                    <button onClick={handleLike} className={`flex items-center gap-2 text-sm font-bold transition-all ${liked ? 'text-emerald-400 scale-105' : 'hover:text-white'}`}>
                        {liked ? <RiThumbUpFill size={20} /> : <RiThumbUpLine size={20} />}
                        {likesCount}
                    </button>
                    <button className="flex items-center gap-2 text-sm font-bold hover:text-white transition-all">
                        <RiChat1Line size={20} />
                        {post.stats.comments}
                    </button>
                    <button className="flex items-center gap-2 text-sm font-bold hover:text-white transition-all">
                        <RiShareForwardLine size={20} />
                        {post.stats.shares}
                    </button>
                </div>
                <button onClick={() => setSaved(!saved)} className={`transition-all ${saved ? 'text-purple-400 scale-110' : 'text-slate-400 hover:text-white'}`}>
                    {saved ? <RiBookmarkFill size={22} /> : <RiBookmarkLine size={22} />}
                </button>
            </div>
        </motion.div>
    );
};

export default function CommunityBoard() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [refreshTick, setRefreshTick] = useState(0);

  // Auto-refresh simulation (Live Updates)
  useEffect(() => {
     const interval = setInterval(() => {
        setRefreshTick(prev => prev + 1);
     }, 10000);
     return () => clearInterval(interval);
  }, []);

  const filteredPosts = posts.filter(p => activeFilter === 'All' || p.tags.includes(activeFilter));

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-20">
      
      {/* 1. Network Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase mb-4"
          >
            <RiGlobalLine size={16} className="animate-spin-slow" /> CropGuard Intelligence Network
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
            Real-Time Social <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Intelligence.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-obsidian-light/50 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-glow-green-sm" />
            <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">Live Feed Active • Sync {refreshTick}</span>
        </div>
      </div>

      {/* Main Grid: Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Smart Tags Filter Bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {FILTER_TAGS.map(tag => (
                      <button 
                          key={tag}
                          onClick={() => setActiveFilter(tag)}
                          className={`whitespace-nowrap px-4 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${activeFilter === tag ? 'bg-blue-500 text-obsidian border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-obsidian-light/30 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'}`}
                      >
                          {tag === 'All' && <RiFilter3Line size={14}/>} {tag}
                      </button>
                  ))}
              </div>

              {/* Feed List */}
              <div className="space-y-6">
                  <AnimatePresence>
                      {filteredPosts.map(post => (
                          <IntelligencePost key={post.id} post={post} />
                      ))}
                  </AnimatePresence>
                  {filteredPosts.length === 0 && (
                      <div className="glass card p-12 text-center border border-white/5">
                          <RiPulseLine size={48} className="mx-auto text-slate-600 mb-4" />
                          <h3 className="text-white font-black text-xl mb-2">No Intelligence Hits</h3>
                          <p className="text-slate-500 font-medium text-sm">No recent activity detected for the selected tag filter.</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
              
              {/* Heatmap / Intelligence Map Panel */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="glass card p-6 border border-rose-500/10 bg-gradient-to-b from-rose-500/5 to-transparent relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                      <h3 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
                          <RiMapPinLine className="text-rose-500" /> Regional Heatmap
                      </h3>
                      <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md uppercase tracking-widest animate-pulse">Live</span>
                  </div>
                  
                  {/* Mock Map Visualization */}
                  <div className="h-40 w-full bg-obsidian-dark/50 rounded-xl border border-white/5 mb-4 relative overflow-hidden shadow-inner flex items-center justify-center">
                     {/* Radar Sweep Effect */}
                     <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_20px,rgba(255,255,255,0.02)_20px,rgba(255,255,255,0.02)_21px),repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(255,255,255,0.02)_20px,rgba(255,255,255,0.02)_21px)]" />
                     <div className="w-full h-full absolute top-0 left-0 border-rose-500/20 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                     
                     <p className="text-slate-600 font-black text-[10px] tracking-[0.4em] uppercase z-10">Geospatial Array Active</p>
                     
                     {/* Dots */}
                     <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,1)] animate-pulse" />
                     <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,1)]" />
                     <div className="absolute top-1/2 left-2/3 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]" />
                  </div>

                  <div className="space-y-3 relative z-10">
                      <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                          <span className="text-slate-400 font-medium">Punjab</span>
                          <span className="text-rose-400 font-bold text-xs uppercase tracking-widest">Late Blight</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                          <span className="text-slate-400 font-medium">AP / Telangana</span>
                          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest">Low Moisture</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-medium">Tamil Nadu</span>
                          <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">Pest Alert</span>
                      </div>
                  </div>
                  <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all rounded-xl border border-white/5">
                      Expand Radar
                  </button>
              </motion.div>

              {/* Trending Intelligence Panel */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.1 }}
                 className="glass card p-6 border border-white/5 bg-obsidian-light/20 relative"
              >
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-black text-lg tracking-tight">Trending Pulse</h3>
                      <RiFireFill className="text-orange-500 animate-bounce" size={20} />
                  </div>
                  <div className="space-y-6">
                      {TRENDING.map((trend, i) => (
                          <div key={i} className="flex gap-4 items-start group cursor-pointer">
                              <span className="text-2xl font-black text-slate-700 group-hover:text-blue-500 transition-colors">0{trend.rank}</span>
                              <div>
                                  <p className="text-sm font-black text-white mb-0.5 group-hover:text-blue-400 transition-colors">{trend.topic}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                      <span className="text-slate-500">{trend.volume}</span>
                                      <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                      <span className="text-blue-500/80">{trend.region}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </motion.div>

          </div>
      </div>
    </div>
  );
}
