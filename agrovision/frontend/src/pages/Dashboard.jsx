import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  RiRadarLine, RiTempHotLine, RiDropLine, RiSeedlingLine,
  RiArrowRightUpLine, RiHistoryLine, RiRobotLine, RiPulseLine,
  RiShieldFlashLine, RiCloudWindyLine, RiFlaskLine, RiRefreshLine
} from 'react-icons/ri'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'

const BentoStat = ({ icon: Icon, label, value, unit, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 150, damping: 15, delay }}
    className="glass card group cursor-pointer"
  >
    <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${color.bg} ${color.text} shadow-glow`}>
      <Icon size={24} />
    </div>
    <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-2">{label}</div>
    <div className="flex items-baseline gap-2">
      <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">{value}</h3>
      <span className="text-sm font-bold text-slate-500">{unit}</span>
    </div>
    <div className="mt-6 flex items-center gap-2">
      <div className="h-1 flex-1 bg-obsidian-light rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (parseFloat(value)/100)*100)}%` }}
          className={`h-full bg-gradient-to-r ${color.grad} opacity-70`} 
        />
      </div>
    </div>
  </motion.div>
)

export default function Dashboard() {
  const [greeting, setGreeting] = useState('Good Morning')
  const [loading, setLoading] = useState(true)
  
  const [liveData, setLiveData] = useState({
     temp: 0, hum: 0, moist: 0, nit: 0, phos: 0, pot: 0
  })
  const [chartData, setChartData] = useState([])
  
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Parallel fetch for live data and history
      const [liveRes, histRes] = await Promise.all([
        fetch('/api/iot/data'),
        fetch('/api/iot/history')
      ]);

      const live = await liveRes.json();
      const historyFeeds = await histRes.json();
      
      if (live && live.lastUpdate) {
        setLiveData({
           temp: live.temp || 0,
           hum: live.hum || 0,
           moist: live.soil || 0,
           nit: live.n || 0,
           phos: live.p || 0,
           pot: live.k || 0,
        })
      }
      
      if (historyFeeds && historyFeeds.length > 0) {
        const mapped = historyFeeds.map(f => {
           let dateObj = new Date(f.created_at)
           let displayHrs = dateObj.getHours() % 12 || 12
           let displayMins = dateObj.getMinutes().toString().padStart(2, '0')
           let ampm = dateObj.getHours() >= 12 ? 'pm' : 'am'
           return {
              time: `${displayHrs}:${displayMins} ${ampm}`,
              Temp: parseFloat(f.field1) || 0,
              Hum: parseFloat(f.field2) || 0,
              Moist: parseFloat(f.field3) || 0,
              N: parseFloat(f.field4) || 0,
              P: parseFloat(f.field5) || 0,
              K: parseFloat(f.field6) || 0
           }
        })
        setChartData(mapped.filter(d => d.Temp > 0)) 
      }
    } catch(e) { 
        console.error("Local IoT Fetch Error", e) 
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 12 && hour < 17) setGreeting('Good Afternoon')
    else if (hour >= 17) setGreeting('Good Evening')
    
    fetchData()
    const int = setInterval(fetchData, 30000)
    return () => clearInterval(int)
  }, [])

  return (
    <div className="space-y-8 animate-[slideIn_0.35s_ease] pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-[0.3em] uppercase mb-4"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-glow-green-sm animate-pulse-slow border-2 border-emerald-200" /> IoT Link Active
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter">
            {greeting}, <span className="text-slate-500 font-medium">Command.</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
           <button onClick={fetchData} disabled={loading} className="px-6 py-[15px] bg-obsidian-light/40 border border-white/10 rounded-xl font-bold text-[15px] text-white flex items-center gap-3 hover:bg-white/5 transition-all shadow-lg active:scale-95 disabled:opacity-50">
              <RiRefreshLine className={loading ? 'animate-spin' : ''} /> Sync Data
           </button>
           <Link to="/detect" className="px-6 py-[15px] bg-emerald-500 rounded-xl font-black text-[15px] text-obsidian-dark flex items-center gap-3 group hover:bg-emerald-400 shadow-glow-green-sm transition-all">
              Manual Scan <RiArrowRightUpLine size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-6 gap-6 h-auto md:h-[1200px]">
        
        {/* Main Telemetry Panel */}
        <motion.div 
          className="md:col-span-3 md:row-span-4 glass card flex flex-col pt-8 px-10 border border-emerald-500/10"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
        >
          <div className="flex justify-between items-start mb-8">
            <div>
               <h3 className="text-[28px] font-black text-white tracking-tight">Atmospheric Pulse</h3>
               <p className="text-slate-400 text-sm mt-2 font-medium">Real-time NodeMCU ESP8266 Sensor Convergence</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[350px] -ml-6 relative">
            {chartData.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-emerald-500 tracking-widest font-bold text-sm animate-pulse">FETCHING SENSOR TIMELINE...</div>}
            {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5a623" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" name="Temperature °C" dataKey="Temp" stroke="#f5a623" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                <Area type="monotone" name="Soil Moisture %" dataKey="Moist" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMoist)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-12 pt-8 border-t border-white/10 pb-4">
             <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1 block">Live NPK Array</span>
                <span className="text-2xl font-bold text-white tracking-tight">{Math.round(liveData.nit)} / {Math.round(liveData.phos)} / {Math.round(liveData.pot)} <span className="text-sm font-semibold text-slate-500 ml-1">mg/kg</span></span>
             </div>
             <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1 block">Avg Humidity</span>
                <span className="text-2xl font-bold text-white tracking-tight">{Math.round(liveData.hum)} <span className="text-sm font-semibold text-slate-500 ml-1">%</span></span>
             </div>
             <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1 block">Data Stability</span>
                <span className="text-2xl font-bold text-emerald-500 tracking-tight">99.8%</span>
             </div>
          </div>
        </motion.div>

        {/* AI Health Quick Panel */}
        <motion.div 
          className="md:col-span-1 md:row-span-2 glass card bg-emerald-500/5 flex flex-col justify-between"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
             <div className="w-12 h-12 bg-emerald-500 rounded-[14px] flex items-center justify-center text-obsidian shadow-glow-green-sm">
                <RiShieldFlashLine size={24} />
             </div>
             <span className="text-[13px] font-bold text-white">Crop Health</span>
          </div>
          <div>
             <h4 className="text-4xl font-black text-white mb-2 tracking-tight">Optimal</h4>
             <p className="text-slate-400 text-[13px] leading-relaxed mb-6 font-medium">Based on latest live scans across the primary field matrix.</p>
          </div>
          <Link to="/assistant" className="text-emerald-400 text-[14px] font-bold flex items-center gap-2 hover:gap-4 transition-all w-full p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20">
             Ask AI Advice <RiArrowRightUpLine size={20} />
          </Link>
        </motion.div>

        {/* Weather Card Placeholder - Can route to WeatherRisk */}
        <motion.div 
          className="md:col-span-1 md:row-span-2 glass card bg-blue-500/5 flex flex-col justify-between"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
             <div className="w-12 h-12 bg-blue-500 rounded-[14px] flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <RiCloudWindyLine size={24} />
             </div>
             <span className="text-[13px] font-bold text-white">Atmosphere</span>
          </div>
          <div>
            <h4 className="text-4xl font-black text-white mb-2 tracking-tight">{Math.round(liveData.temp)}°C</h4>
            <p className="text-slate-400 text-[13px] leading-relaxed font-medium">Live reading from DHT22 Sensor Array.</p>
          </div>
          <Link to="/weather" className="mt-8 text-blue-400 text-[14px] font-bold flex items-center gap-2 hover:gap-4 transition-all w-full p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20">
             Open Weather Maps <RiArrowRightUpLine size={20} />
          </Link>
        </motion.div>

        {/* Small Stats Grid */}
        <BentoStat icon={RiTempHotLine} label="Temperature" value={liveData.temp.toFixed(1)} unit="°C" color={{bg:'bg-orange-500/10', text:'text-orange-500', grad: 'from-transparent to-orange-500'}} delay={0.1} />
        <BentoStat icon={RiDropLine} label="Humidity" value={Math.round(liveData.hum)} unit="%" color={{bg:'bg-blue-500/10', text:'text-blue-500', grad: 'from-transparent to-blue-500'}} delay={0.2} />
        <BentoStat icon={RiSeedlingLine} label="Soil Wetness" value={Math.round(liveData.moist)} unit="%" color={{bg:'bg-emerald-500/10', text:'text-emerald-500', grad: 'from-transparent to-emerald-500'}} delay={0.3} />
        
        {/* Recent NPK Readings */}
        <motion.div 
          className="md:col-span-1 md:row-span-2 glass card overflow-hidden relative pt-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
        >
           <RiFlaskLine className="absolute -top-10 -right-10 text-purple-500 opacity-5 rotate-12" size={240} />
           <h3 className="text-xl font-bold text-white mb-6 relative z-10">Sensor Logs</h3>
           <div className="flex-1 w-full h-[280px] -ml-6 relative z-10 mt-2">
             {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorN" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorK" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <XAxis dataKey="time" hide />
                  <Area type="monotone" name="Nitrogen (N)" dataKey="N" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorN)" />
                  <Area type="monotone" name="Phosphorus (P)" dataKey="P" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorP)" />
                  <Area type="monotone" name="Potassium (K)" dataKey="K" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorK)" />
                </AreaChart>
              </ResponsiveContainer>
             ) : (
                <div className="flex inset-0 h-full items-center justify-center text-slate-500 font-bold text-xs animate-pulse">AWAITING NPK TELEMETRY...</div>
             )}
           </div>
        </motion.div>

      </div>
    </div>
  )
}
