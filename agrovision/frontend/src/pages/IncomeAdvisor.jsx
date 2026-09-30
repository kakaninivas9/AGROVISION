import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, Tooltip, CartesianGrid, Area
} from 'recharts';
import { 
  RiMoneyRupeeCircleLine, RiLineChartLine, RiPercentLine, RiArrowUpLine, 
  RiFundsLine, RiExchangeFundsLine, RiGovernmentLine, RiRadarLine,
  RiSeedlingLine, RiPulseLine, RiArrowRightSLine, RiPieChart2Line,
  RiAlertFill, RiBarChartBoxLine, RiBankCardLine, RiShieldCrossLine,
  RiCheckDoubleLine, RiGlobalLine, RiBrainLine, RiCloudWindyLine, RiBugLine
} from 'react-icons/ri';

// --- MOCK DATA ---
const REVENUE_DATA = [
  { month: 'Jan', revenue: 40000, projected: 45000 },
  { month: 'Feb', revenue: 30000, projected: 38000 },
  { month: 'Mar', revenue: 55000, projected: 60000 },
  { month: 'Apr', revenue: 45000, projected: 52000 },
  { month: 'May', revenue: 70000, projected: 75000 },
  { month: 'Jun', revenue: 65000, projected: 72000 },
  { month: 'Jul', revenue: 85000, projected: 92000 },
  { month: 'Aug', revenue: 0, projected: 110000 }, // Future
  { month: 'Sep', revenue: 0, projected: 125000 },
];

const CROP_PROFITS = [
  { crop: 'Rice (Paddy)', yield: '4.5 Tons/Acre', price: '₹2,200/Qtl', profit: '₹55,000', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { crop: 'Tomato', yield: '12 Tons/Acre', price: '₹1,800/Qtl', profit: '₹1,15,000', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { crop: 'Potato', yield: '10 Tons/Acre', price: '₹1,200/Qtl', profit: '₹85,000', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { crop: 'Wheat', yield: '3.8 Tons/Acre', price: '₹2,400/Qtl', profit: '₹48,000', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
];

const AI_RECOMMENDATIONS = [
  { 
      id: 1, 
      title: "Switch crop to Tomato next season", 
      desc: "Market forecasting shows a 45% undersupply in your region by Q3. Soil metrics indicate high suitability.",
      profitInc: "+₹60,000 / Acre", 
      confidence: "94%" 
  },
  { 
      id: 2, 
      title: "Delay harvest by 2 weeks", 
      desc: "Weather models predict low humidity. Drying crops naturally will save processing fees and boost market grade.",
      profitInc: "+₹12,500 / Acre", 
      confidence: "88%" 
  },
  { 
      id: 3, 
      title: "Apply for Micro-Irrigation Subsidy", 
      desc: "Eligible for 50% state subvention. Installing drip lines now will reduce water costs by 40% annually.",
      profitInc: "Save ₹8,000 / Yr", 
      confidence: "99%" 
  }
];

const COSTS = [
  { label: 'Seed & Sowing', value: '₹12,000', pct: '15%' },
  { label: 'Fertilizer & Nutrition', value: '₹24,000', pct: '30%' },
  { label: 'Labor & Harvesing', value: '₹32,000', pct: '40%' },
  { label: 'Transport & Storage', value: '₹12,000', pct: '15%' },
];

const RISKS = [
  { label: 'Weather Risk', icon: RiCloudWindyLine, level: 'Low', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Market Risk', icon: RiExchangeFundsLine, level: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { label: 'Pest Risk', icon: RiBugLine, level: 'Low', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Investment Risk', icon: RiBankCardLine, level: 'High', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
];

// --- COMPONENTS ---
const MetricCard = ({ title, value, sub, icon: Icon, color, delay }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, delay }}
      className={`glass card flex flex-col justify-between border-t-2 ${color.border} relative overflow-hidden group`}
    >
        <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-[20px] ${color.glow} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
        
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center shadow-glow ${color.bg} ${color.text}`}>
                <Icon size={24} />
            </div>
            {sub && <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${color.subBorder} ${color.subBg} ${color.text} flex items-center gap-1`}><RiArrowUpLine size={12}/>{sub}</span>}
        </div>
        <div>
            <p className="text-[11px] font-black tracking-widest uppercase text-slate-500 mb-0.5">{title}</p>
            <h4 className="text-3xl font-black text-white tracking-tight leading-none">{value}</h4>
        </div>
    </motion.div>
);

export default function IncomeAdvisor() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16 w-full">
      
      {/* 1. Header Overview */}
      <div className="glass card p-6 md:p-10 border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
              <div>
                  <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase mb-4"
                  >
                      <RiLineChartLine className="animate-pulse" size={16}/> Financial Intelligence
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">
                      Income <span className="text-slate-500">Optimizer.</span>
                  </h1>
                  <p className="text-sm text-slate-400 font-medium max-w-xl leading-relaxed">
                      AI-powered financial forecasting, real-time market risk analysis, and automated profit maximization strategies based on your connected telemetry array.
                  </p>
              </div>

              <div className="flex items-center gap-4">
                  <div className="bg-obsidian-light/50 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-glow-green-sm">
                          <RiBarChartBoxLine size={20}/>
                      </div>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Forecast</p>
                          <p className="text-sm font-black text-white">Q3 Surplus +18%</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Net Est. Profit" value="₹14.2L" sub="18.5%" icon={RiMoneyRupeeCircleLine} color={{ border: 'border-t-emerald-500', glow: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', subBorder: 'border-emerald-500/20', subBg: 'bg-emerald-500/10' }} delay={0.0} />
          <MetricCard title="Return on Inv" value="124%" sub="12.2%" icon={RiPercentLine} color={{ border: 'border-t-blue-500', glow: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', subBorder: 'border-blue-500/20', subBg: 'bg-blue-500/10' }} delay={0.1} />
          <MetricCard title="Yield Efficiency" value="92%" icon={RiPieChart2Line} color={{ border: 'border-t-purple-500', glow: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', subBorder: 'border-purple-500/20', subBg: 'bg-purple-500/10' }} delay={0.2} />
          <MetricCard title="Market Score" value="88/100" sub="High Demand" icon={RiGlobalLine} color={{ border: 'border-t-orange-500', glow: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', subBorder: 'border-orange-500/20', subBg: 'bg-orange-500/10' }} delay={0.3} />
      </div>

      {/* 3. Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Projection Combo Chart */}
          <div className="lg:col-span-2 glass card p-6 border border-white/5 bg-obsidian-light/20 relative">
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mb-1">
                         <RiFundsLine className="text-blue-500"/> Revenue Trend Projection
                     </h3>
                     <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Yearly vs Projected Monthly Comparison</p>
                 </div>
                 <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                     <RiCheckDoubleLine className="text-emerald-400" size={14}/>
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">High Confidence Matrix</span>
                 </div>
             </div>
             
             <div className="h-[300px] w-full -ml-4 mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={REVENUE_DATA} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                         <defs>
                             <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                             </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                         <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickLine={false} axisLine={false} />
                         <Tooltip 
                             contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                             itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                         />
                         
                         {/* Bar for actual closed revenue */}
                         <Bar dataKey="revenue" name="Actual Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                         {/* Line + Area for predicted future revenue */}
                         <Area type="monotone" dataKey="projected" name="AI Forecast (₹)" fill="url(#colorProjected)" stroke="none" />
                         <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#111827'}} activeDot={{r: 6}} />
                     </ComposedChart>
                 </ResponsiveContainer>
             </div>
          </div>

          {/* AI Smart Recommendation Panel */}
          <div className="lg:col-span-1 glass card p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
              
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 mb-6 relative z-10">
                  <RiBrainLine className="text-purple-500" size={20}/> Smart AI Actions
              </h3>
              
              <div className="space-y-4 relative z-10 overflow-y-auto pr-1 hide-scrollbar h-[310px]">
                  {AI_RECOMMENDATIONS.map(rec => (
                      <motion.div 
                          key={rec.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-obsidian-dark/50 border border-purple-500/20 p-4 rounded-xl cursor-pointer shadow-inner hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all"
                      >
                          <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-bold text-white leading-tight pr-4">{rec.title}</h4>
                              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1"><RiCheckDoubleLine/> {rec.confidence}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3">{rec.desc}</p>
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-t border-white/5 pt-2">
                              <span className="text-slate-500">Exp. Increase:</span>
                              <span className="text-emerald-400 flex items-center gap-1"><RiArrowUpLine/>{rec.profitInc}</span>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      </div>

      {/* 4. Secondary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Crop Profit Comparison */}
          <div className="md:col-span-1 glass card p-6 border border-white/5 bg-obsidian-light/20">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <RiSeedlingLine className="text-emerald-500"/> Crop Profit Models
              </h3>
              <div className="space-y-3">
                  {CROP_PROFITS.map(crop => (
                      <div key={crop.crop} className={`border p-4 rounded-xl flex flex-col gap-3 transition-colors hover:bg-white/[0.02] ${crop.color} border-opacity-30`}>
                          <div className="flex justify-between items-center">
                              <span className="font-black text-white text-sm">{crop.crop}</span>
                              <span className="font-black text-sm">{crop.profit} <span className="text-[9px] text-slate-500 uppercase tracking-widest">Net</span></span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-80">
                              <span>Yield: {crop.yield}</span>
                              <span>Price: {crop.price}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Cost & Margin Breakdown */}
          <div className="md:col-span-1 glass card p-6 border border-white/5 bg-obsidian-light/20">
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <RiPieChart2Line className="text-rose-500"/> Cost Breakdown
              </h3>
              <div className="space-y-4 mb-6">
                  {COSTS.map(cost => (
                      <div key={cost.label}>
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                              <span>{cost.label}</span>
                              <span className="text-white">{cost.value}</span>
                          </div>
                          <div className="w-full bg-obsidian-dark h-1.5 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full" style={{ width: cost.pct }} />
                          </div>
                      </div>
                  ))}
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Est. Profit Margin</span>
                  <span className="text-2xl font-black text-emerald-400">42.5%</span>
              </div>
          </div>

          {/* Market Intelligence & Risk Analysis Layout */}
          <div className="md:col-span-1 space-y-6 flex flex-col">
              
              {/* Risk Analysis */}
              <div className="glass card p-6 border border-white/5 flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                      <RiAlertFill className="text-orange-500"/> Risk Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                      {RISKS.map(risk => (
                          <div key={risk.label} className={`border p-3 rounded-lg flex flex-col items-center justify-center text-center gap-2 ${risk.color}`}>
                              <risk.icon size={20} />
                              <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{risk.label}</p>
                                  <p className="text-sm font-black">{risk.level}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Market Intelligence Snippet */}
              <div className="glass card border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-transparent p-6 relative overflow-hidden flex-1">
                  <RiGlobalLine className="absolute -bottom-6 -right-6 text-indigo-500/10 text-9xl pointer-events-none" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                      <RiRadarLine className="text-indigo-400"/> Market Intel
                  </h3>
                  <ul className="space-y-3 relative z-10">
                      <li className="flex gap-2 items-start text-xs font-bold text-slate-300"><span className="text-indigo-400 mt-0.5">•</span> Potato demand rising consistently across AP matrix.</li>
                      <li className="flex gap-2 items-start text-xs font-bold text-slate-300"><span className="text-rose-400 mt-0.5">•</span> Tomato oversupply expected in Mid-October. Prepare cold storage.</li>
                      <li className="flex gap-2 items-start text-xs font-bold text-slate-300"><span className="text-emerald-400 mt-0.5">•</span> Wheat export opportunities unlocked by Govt scheme modifications.</li>
                  </ul>
              </div>

          </div>

      </div>

    </div>
  );
}
