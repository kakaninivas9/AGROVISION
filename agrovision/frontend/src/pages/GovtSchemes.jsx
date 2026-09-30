import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiShieldCheckLine, RiMoneyRupeeCircleLine, RiFileList3Line, 
  RiSearchLine, RiFilter3Line, RiBankCardLine, RiTestTubeLine,
  RiArrowRightLine, RiCheckFill, RiFlashlightLine,
  RiStarSFill, RiDropLine, RiPlantLine, RiFireLine
} from 'react-icons/ri';

// --- DATA MODEL ---
const ALL_SCHEMES = [
  {
    id: 1,
    title: "PM-Kisan Samman Nidhi",
    agency: "Central Government",
    desc: "Direct income support of ₹6,000 per year to all landholding farmer families.",
    amount: "₹6,000 / Yr",
    benefits: ["Direct Bank Transfer", "Triple Installments"],
    eligibility: "Landholding farmers only",
    badge: "Recommended",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: RiMoneyRupeeCircleLine,
    color: { bgGrad: "from-emerald-500/10 to-transparent border-emerald-500/20", iconGrad: "from-emerald-400 to-teal-600", iconBg: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-obsidian" },
    category: "Financial"
  },
  {
    id: 2,
    title: "Pradhan Mantri Fasal Bima",
    agency: "Agriculture Ministry",
    desc: "Comprehensive crop insurance scheme protecting against non-preventable natural risks.",
    amount: "Full Coverage",
    benefits: ["Yield Loss Protection", "Post-Harvest Cover"],
    eligibility: "All farmers (Sharecroppers/Tenants)",
    badge: "High Subsidy",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: RiShieldCheckLine,
    color: { bgGrad: "from-blue-500/10 to-transparent border-blue-500/20", iconGrad: "from-blue-400 to-cyan-600", iconBg: "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-obsidian" },
    category: "Insurance"
  },
  {
    id: 3,
    title: "Soil Health Card Scheme",
    agency: "ICAR Infrastructure",
    desc: "Free comprehensive soil testing to provide tailored nutrient management advice.",
    amount: "Free Testing",
    benefits: ["Yield Optimization", "Fertilizer Savings"],
    eligibility: "Open to all farmers",
    badge: "New",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: RiTestTubeLine,
    color: { bgGrad: "from-purple-500/10 to-transparent border-purple-500/20", iconGrad: "from-purple-400 to-pink-600", iconBg: "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white" },
    category: "Infrastructure"
  },
  {
    id: 4,
    title: "Kisan Credit Card (KCC)",
    agency: "RBI & NABARD",
    desc: "Provides timely and adequate credit to farmers for agricultural operations.",
    amount: "Up to ₹3 Lakh",
    benefits: ["Low Interest Rate (4%)", "Flexible Repayment"],
    eligibility: "Farmers, Self-Help Groups",
    badge: "Urgent",
    badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: RiBankCardLine,
    color: { bgGrad: "from-orange-500/10 to-transparent border-orange-500/20", iconGrad: "from-orange-400 to-red-600", iconBg: "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-obsidian" },
    category: "Financial"
  },
  {
    id: 5,
    title: "Micro Irrigation Fund",
    agency: "NABARD",
    desc: "Encourages public/private investments in Micro Irrigation under PMKSY.",
    amount: "50% Subsidy",
    benefits: ["Water Conservation", "Equipment Grant"],
    eligibility: "State-approved farms",
    badge: "Recommended",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    icon: RiDropLine,
    color: { bgGrad: "from-cyan-500/10 to-transparent border-cyan-500/20", iconGrad: "from-cyan-400 to-blue-600", iconBg: "bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-obsidian" },
    category: "Infrastructure"
  },
  {
    id: 6,
    title: "Paramparagat Krishi Vikas",
    agency: "Ministry of Ag & Farmers",
    desc: "Promotes organic farming through cluster approach and Participatory Guarantee System.",
    amount: "₹50,000 / ha",
    benefits: ["Organic Certification", "Marketing Support"],
    eligibility: "Organic Clusters (50+ acres)",
    badge: "High Priority",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    icon: RiPlantLine,
    color: { bgGrad: "from-rose-500/10 to-transparent border-rose-500/20", iconGrad: "from-rose-400 to-pink-600", iconBg: "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white" },
    category: "Subsidies"
  }
];

// --- COMPONENTS ---
const DashboardStat = ({ title, value, subtitle, icon: Icon, color, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, delay }}
      className={`glass card flex items-center gap-6 border-l-4 ${color.border}`}
    >
        <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center ${color.bg} ${color.text} shadow-glow`}>
            <Icon size={28} />
        </div>
        <div>
            <p className="text-[11px] font-black tracking-widest uppercase text-slate-500 mb-1">{title}</p>
            <h4 className="text-3xl font-black text-white tracking-tight">{value}</h4>
            <p className="text-xs font-bold text-slate-400 mt-1">{subtitle}</p>
        </div>
    </motion.div>
);

const SmartSchemeCard = ({ scheme }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.95, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 120, damping: 15 }}
    className={`bento-card p-6 md:p-8 group relative overflow-hidden bg-gradient-to-br ${scheme.color.bgGrad} shadow-lg border hover:-translate-y-2 transition-transform duration-500 flex flex-col justify-between`}
  >
    {/* Ambient Glowing Orb */}
    <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${scheme.color.iconGrad} opacity-10 blur-[40px] rounded-full group-hover:opacity-40 transition-opacity duration-700 pointer-events-none`} />
    
    <div>
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)] ${scheme.color.iconBg} border border-white/5`}>
                <scheme.icon size={28} />
            </div>
            <span className={`text-[10px] font-black border px-3 py-1.5 rounded-full shadow-sm ${scheme.badgeColor} uppercase tracking-widest backdrop-blur-md`}>
                {scheme.badge}
            </span>
        </div>
        
        <h3 className="text-2xl font-black text-white mb-2 relative z-10 leading-tight tracking-tight pr-4">{scheme.title}</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 relative z-10">{scheme.agency}</p>
        
        <p className="text-sm font-medium text-slate-300 leading-relaxed relative z-10 mb-6 line-clamp-2">
            {scheme.desc}
        </p>

        <div className="space-y-3 mb-8 relative z-10 bg-black/20 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Max Subsidy</span>
                <span className="text-sm font-black text-white">{scheme.amount}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Eligibility</span>
                <span className="text-xs font-bold text-slate-300 max-w-[120px] text-right truncate" title={scheme.eligibility}>{scheme.eligibility}</span>
            </div>
        </div>
    </div>

    <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto">
        <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-black py-3 rounded-xl transition-all border border-white/10 backdrop-blur-md text-center">
            View Details
        </button>
        <button className={`bg-gradient-to-r ${scheme.color.iconGrad} hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg text-center`}>
            Apply Now
        </button>
    </div>
  </motion.div>
);

export default function GovtSchemes() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredSchemes = ALL_SCHEMES.filter(s => {
      const matchFilter = filter === 'All' || s.category === filter;
      const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 font-sans pb-20 overflow-x-hidden">
      
      {/* 1. Hero Animated Header */}
      <div className="relative glass card overflow-hidden border-emerald-500/20 p-8 md:p-12 mb-8">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 opacity-50" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse-slow pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-[0.3em] uppercase mb-4"
                >
                    <RiFlashlightLine size={16} className="animate-pulse" /> Welfare Protocol v2.0
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
                    Smart Agriculture <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Welfare Dashboard.</span>
                </h1>
                <p className="mt-4 text-sm md:text-base font-medium text-slate-400 max-w-xl leading-relaxed">
                    AI-Powered Government Scheme Intelligence for Farmers. We instantly analyze your crop telemetry and biometric profile to match you with highly-subsidized state programs.
                </p>
            </div>
            <div className="flex bg-obsidian-light/60 border border-white/10 px-6 py-4 rounded-2xl items-center gap-5 backdrop-blur-xl shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center text-obsidian shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    <RiCheckFill size={24} />
                </div>
                <div>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-1">Kisan Profile Validation</p>
                    <p className="text-lg font-black text-white tracking-tight">AADHAAR_NEXUS_LINKED</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Dashboard Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardStat title="Total Subsidy Value" value="₹12.4L" subtitle="Available across matched schemes" icon={RiMoneyRupeeCircleLine} color={{ border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500' }} delay={0.1} />
          <DashboardStat title="Active Schemes" value="142" subtitle="National & State level programs" icon={RiFileList3Line} color={{ border: 'border-l-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500' }} delay={0.2} />
          <DashboardStat title="Eligible Matches" value="07" subtitle="Verified via AgroVision AI" icon={RiShieldCheckLine} color={{ border: 'border-l-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500' }} delay={0.3} />
          <DashboardStat title="Applied Policies" value="03" subtitle="Currently tracking disbursements" icon={RiCheckFill} color={{ border: 'border-l-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500' }} delay={0.4} />
      </div>

      {/* 3. AI Smart Match Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass card p-8 border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-fuchsia-500/5 to-transparent relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <RiStarSFill className="text-purple-400 animate-pulse" size={24} />
                    <h3 className="text-2xl font-black text-white tracking-tight">AI Eligibility Engine is Active</h3>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-3xl">
                    Based on your live telemetry (Soil Moisture 52%, Nitrogen 44mg/kg), the system recommends immediately applying for the <strong className="text-white">Micro Irrigation Fund</strong> and <strong className="text-white">Soil Health Card Scheme</strong>. You have a 99% approval probability.
                </p>
            </div>
            <button className="whitespace-nowrap bg-purple-500 hover:bg-purple-400 text-obsidian font-black text-sm px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95">
                Auto-Apply Recommended
            </button>
        </div>
      </motion.div>

      {/* 4. Directory & Filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-3xl font-black text-white tracking-tight">Scheme Directory</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search protocols..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-obsidian-light/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600 font-medium font-sans"
                    />
                </div>
                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                    {['All', 'Financial', 'Insurance', 'Infrastructure'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`whitespace-nowrap px-5 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${filter === cat ? 'bg-emerald-500 text-obsidian border-emerald-500 shadow-glow-green-sm' : 'bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white'}`}
                        >
                            {cat === 'All' && filter === 'All' && <RiFilter3Line size={14}/>} {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* 5. Smart Scheme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pt-4">
            <AnimatePresence>
                {filteredSchemes.map((scheme) => (
                    <SmartSchemeCard key={scheme.id} scheme={scheme} />
                ))}
            </AnimatePresence>
            
            {filteredSchemes.length === 0 && (
                <div className="col-span-full py-20 text-center glass card">
                    <RiSearchLine className="mx-auto text-slate-600 mb-4" size={48} />
                    <h3 className="text-xl font-black text-white mb-2">No Protocols Found</h3>
                    <p className="text-slate-500 text-sm font-medium">Try adjusting your filters or search query.</p>
                </div>
            )}
        </div>
      </div>

    </div>
  );
}
