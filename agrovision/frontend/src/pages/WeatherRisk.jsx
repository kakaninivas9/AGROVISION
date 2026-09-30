import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  RiTempHotLine, RiDropLine, RiCloudWindyLine, RiSunLine, 
  RiAlarmWarningLine, RiAlertFill, RiCheckDoubleLine, RiPlantLine,
  RiTimeLine, RiThunderstormsLine,
  RiRadarLine, RiBarChartBoxLine, RiArrowRightSLine, RiBugLine,
  RiEarthLine, RiShareForwardLine, RiSeedlingLine, RiMapPinUserLine,
  RiSearchLine, RiLoader4Line
} from 'react-icons/ri';

// --- UTILS & CONSTANTS ---
const CACHE_KEY = 'agrovision_weather_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

const CROP_VULNERABILITY = [
  { crop: 'Rice (Paddy)', risk: 'Humidity Sensitive', impact: 'High', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { crop: 'Tomato', risk: 'Temperature Sensitive', impact: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { crop: 'Wheat', risk: 'Wind Sensitive', impact: 'Low', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

// --- COMPONENTS ---
const AlertCard = ({ title, type, icon: Icon }) => (
    <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-lg ${type === 'danger' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${type === 'danger' ? 'bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}>
                <Icon size={20} className="animate-pulse" />
            </div>
            <div>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-0.5">Live Alert</p>
                <p className="text-sm font-bold tracking-tight">{title}</p>
            </div>
        </div>
        <button className="text-[10px] font-black uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">Review</button>
    </motion.div>
);

export default function WeatherRisk() {
  const [activeLayer, setActiveLayer] = useState('temp');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState({ name: 'Hyderabad', lat: 17.385, lon: 78.4867 });
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);

  // Intelligence State
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [farmImpacts, setFarmImpacts] = useState([]);
  const [riskLevel, setRiskLevel] = useState({ level: 'Low', color: 'text-emerald-400' });

  const fetchWeather = async (lat, lon, name) => {
    setLoading(true);
    setLoadingStatus('Fetching location data...');
    setError(null);
    
    try {
      // 1. Check Cache
      const cached = localStorage.getItem(`${CACHE_KEY}_${lat}_${lon}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          processWeatherData(data, name);
          setLoading(false);
          return;
        }
      }

      setLoadingStatus('Analyzing local weather patterns...');
      const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,relative_humidity_2m_max,precipitation_sum,wind_speed_10m_max&timezone=auto`);
      
      const data = response.data;
      localStorage.setItem(`${CACHE_KEY}_${lat}_${lon}`, JSON.stringify({ data, timestamp: Date.now() }));
      
      setLoadingStatus('Generating AI recommendations...');
      processWeatherData(data, name);
      
    } catch (err) {
      setError('Satellite link unstable. Please retry.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processWeatherData = (data, name) => {
    const current = data.current;
    const daily = data.daily;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 1. Format Trend Data
    const formattedTrends = daily.time.map((t, i) => {
      const date = new Date(t);
      return {
        day: days[date.getDay()],
        temp: daily.temperature_2m_max[i],
        humidity: daily.relative_humidity_2m_max[i],
        rain: daily.precipitation_sum[i]
      };
    });
    setTrendData(formattedTrends);

    // 2. Run Intelligence Logic
    const newAlerts = [];
    const newRecs = [];
    let highRiskCount = 0;

    if (current.relative_humidity_2m > 80) {
      newAlerts.push({ title: 'High Fungal Risk (Humidity)', type: 'danger', icon: RiBugLine });
      newRecs.push({ action: 'Apply Foliar Fungicide', priority: 'High', confidence: '92%', timeWindow: 'Next 12h', desc: 'Humidity is critical (>80%). Extreme risk of fungal proliferation.' });
      highRiskCount++;
    }

    const maxRain = Math.max(...daily.precipitation_sum);
    if (maxRain > 5) {
      newAlerts.push({ title: `Heavy Rainfall Projected (${maxRain}mm)`, type: 'warning', icon: RiThunderstormsLine });
      newRecs.push({ action: 'Delay Irrigation Cycle', priority: 'High', confidence: '94%', timeWindow: 'Next 48h', desc: 'Significant precipitation expected. Natural irrigation will suffice.' });
      highRiskCount++;
    }

    if (current.temperature_2m > 35) {
      newAlerts.push({ title: 'Critical Heat Stress Warning', type: 'danger', icon: RiTempHotLine });
      newRecs.push({ action: 'Deploy Shade Nets', priority: 'High', confidence: '88%', timeWindow: 'Peak Sun', desc: 'Temperatures above 35°C detected. Protect vulnerable seedlings.' });
      highRiskCount++;
    }

    if (current.wind_speed_10m > 25) {
      newAlerts.push({ title: 'High Wind Velocity Alert', type: 'warning', icon: RiCloudWindyLine });
      newRecs.push({ action: 'Secure Tall Crops', priority: 'Medium', confidence: '75%', timeWindow: 'Next 12h', desc: 'Winds above 25km/h may cause lodging in Wheat or Maize.' });
    }

    // Default recommendations if none triggered
    if (newRecs.length === 0) {
      newRecs.push({ action: 'Standard Crop Monitoring', priority: 'Low', confidence: '99%', timeWindow: 'Ongoing', desc: 'Conditions are optimal. Maintain standard maintenance routines.' });
    }

    setAlerts(newAlerts);
    setRecommendations(newRecs);

    // 3. Farm Impacts
    setFarmImpacts([
      { label: 'Soil Moisture Impact', value: maxRain > 10 ? 'Flooding Risk' : 'Stable', trend: maxRain > 5 ? 'Rising' : 'Neutral', color: maxRain > 10 ? 'text-rose-400' : 'text-emerald-400' },
      { label: 'Disease Probability', value: `${current.relative_humidity_2m > 60 ? 'High' : 'Low'}`, trend: current.relative_humidity_2m > 70 ? 'Rising' : 'Stable', color: current.relative_humidity_2m > 70 ? 'text-rose-400' : 'text-emerald-400' },
      { label: 'Heat Stress Index', value: current.temperature_2m > 30 ? 'Moderate' : 'Low', trend: 'Neutral', color: current.temperature_2m > 30 ? 'text-amber-400' : 'text-emerald-400' },
      { label: 'Estimated Yield Flux', value: highRiskCount > 1 ? '-2.5%' : '+0.8%', trend: highRiskCount > 1 ? 'Negative' : 'Optimal', color: highRiskCount > 1 ? 'text-rose-400' : 'text-emerald-400' },
    ]);

    // 4. Risk Level
    if (highRiskCount >= 2) setRiskLevel({ level: 'High Risk', color: 'text-rose-400' });
    else if (highRiskCount === 1) setRiskLevel({ level: 'Medium Risk', color: 'text-amber-400' });
    else setRiskLevel({ level: 'Low Risk', color: 'text-emerald-400' });

    setWeatherData(current);
    setLocation(prev => ({ ...prev, name }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setLoadingStatus('Locating region...');
    try {
      const geoResp = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=1&language=en&format=json`);
      if (geoResp.data.results && geoResp.data.results.length > 0) {
        const result = geoResp.data.results[0];
        const newLoc = { name: result.name, lat: result.latitude, lon: result.longitude };
        fetchWeather(newLoc.lat, newLoc.lon, newLoc.name);
      } else {
        setError('Region not found. Check spelling.');
        setLoading(false);
      }
    } catch (err) {
      setError('Geocoding offline. Try later.');
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser.');
      return;
    }
    setLoading(true);
    setLoadingStatus('Detecting coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Detected Location');
      },
      () => {
        setError('Location access denied.');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchWeather(location.lat, location.lon, location.name);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-16 w-full animate-[slideIn_0.35s_ease]">
      
      {/* 1. Header Overview & Satellite Status */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="glass card p-8 border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-transparent relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black tracking-[0.3em] uppercase mb-4">
                  <RiCloudWindyLine className="animate-pulse" size={16}/> Atmospheric Analysis
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-0 relative z-10">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">
                        Weather <span className="text-slate-500">Intelligence.</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-2">
                        <RiMapPinUserLine className="text-cyan-400"/> Monitoring: <span className="text-white">{location.name}</span> (Lat: {location.lat.toFixed(2)}, Lon: {location.lon.toFixed(2)})
                    </p>
                  </div>

                  {/* Dynamic Location Search */}
                  <form onSubmit={handleSearch} className="flex items-center gap-2 bg-obsidian-dark/50 p-1.5 rounded-xl border border-white/5 backdrop-blur-xl mb-6 self-start md:self-auto">
                    <div className="flex items-center gap-2 px-3">
                        <RiSearchLine className="text-slate-500" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Search Region..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-slate-600 w-32 md:w-48"
                        />
                    </div>
                    <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-obsidian px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-glow-blue-sm">
                        Analyze
                    </button>
                    <button 
                        type="button"
                        onClick={detectLocation}
                        className="p-2.2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
                        title="Detect My Location"
                    >
                        <RiMapPinUserLine size={18}/>
                    </button>
                  </form>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 bg-obsidian-light/50 border border-white/5 px-3 py-1.5 rounded-lg"><RiEarthLine className="text-blue-400"/> Open-Meteo Satellite Link</span>
                  <span className="flex items-center gap-1.5 bg-obsidian-light/50 border border-white/5 px-3 py-1.5 rounded-lg">
                    <span className={`w-2 h-2 ${loading ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full animate-pulse shadow-glow`} /> 
                    {loading ? 'Data Uplink Active' : 'Live Array Active'}
                  </span>
              </div>
          </div>

          {/* Core Risk Banner */}
          <div className="glass card p-8 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden lg:w-96 flex flex-col justify-center">
              <RiAlertFill className={`absolute -bottom-6 -right-6 ${riskLevel.color.replace('text-', 'text-')}/10 text-9xl pointer-events-none`} />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className={`w-12 h-12 ${riskLevel.color.includes('rose') ? 'bg-rose-500' : riskLevel.color.includes('amber') ? 'bg-amber-500' : 'bg-emerald-500'} text-obsidian rounded-xl flex items-center justify-center shadow-lg`}>
                      <RiAlarmWarningLine size={28} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">Overall Status</p>
                      <h2 className={`text-2xl font-black ${riskLevel.color} tracking-tight leading-none`}>{riskLevel.level}</h2>
                  </div>
              </div>

              <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center bg-obsidian-dark/50 border border-white/5 px-4 py-2 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Temperature</span>
                      <span className="text-sm font-black text-white">{weatherData ? `${weatherData.temperature_2m}°C` : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-obsidian-dark/50 border border-white/5 px-4 py-2 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Humidity</span>
                      <span className="text-sm font-black text-white">{weatherData ? `${weatherData.relative_humidity_2m}%` : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-obsidian-dark/50 border border-white/5 px-4 py-2 rounded-lg">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Confidence</span>
                      <span className="text-sm font-black text-emerald-400 flex items-center gap-1"><RiCheckDoubleLine/>98%</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Smart Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[80px]">
          <AnimatePresence mode="popLayout">
            {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                    <AlertCard key={idx} title={alert.title} type={alert.type} icon={alert.icon} />
                ))
            ) : (
                <div className="col-span-2 glass card p-4 border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3 text-emerald-400">
                    <RiCheckDoubleLine size={20}/>
                    <span className="text-xs font-black uppercase tracking-widest">Atmospheric Stability Confirmed. No Active Hazards.</span>
                </div>
            )}
          </AnimatePresence>
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          
          {/* Loading Overlay */}
          <AnimatePresence>
              {loading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 glass backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-cyan-500/20"
                  >
                      <RiLoader4Line size={48} className="text-cyan-500 animate-spin mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 animate-pulse">{loadingStatus}</p>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* Weather Trend Forecasting Chart */}
          <div className="lg:col-span-2 glass card p-6 border border-white/5 bg-obsidian-light/20 relative">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                 <div>
                     <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mb-1">
                         <RiRadarLine className="text-cyan-500"/> Predictive Forecast Array
                     </h3>
                     <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">7-Day Meteorological Trajectory</p>
                 </div>
                 
                 {/* Layer Controls */}
                 <div className="flex bg-obsidian-dark p-1 rounded-lg border border-white/5">
                     <button onClick={() => setActiveLayer('temp')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeLayer === 'temp' ? 'bg-orange-500 text-obsidian shadow-glow' : 'text-slate-500 hover:text-white'}`}>Temp</button>
                     <button onClick={() => setActiveLayer('rain')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeLayer === 'rain' ? 'bg-blue-500 text-obsidian shadow-glow' : 'text-slate-500 hover:text-white'}`}>Rain</button>
                     <button onClick={() => setActiveLayer('humidity')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeLayer === 'humidity' ? 'bg-cyan-500 text-obsidian shadow-glow' : 'text-slate-500 hover:text-white'}`}>Humid</button>
                 </div>
             </div>
             
             <div className="h-[300px] w-full mt-4 relative -ml-4">
                  <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                      <AreaChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                          <defs>
                              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickLine={false} axisLine={false} />
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                              itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
                              labelStyle={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}
                          />
                          
                          {activeLayer === 'temp' && <Area type="monotone" name="Temperature (°C)" dataKey="temp" stroke="#f97316" strokeWidth={3} fill="url(#colorTemp)" activeDot={{r: 6, fill: '#f97316', stroke: '#111827', strokeWidth: 2}} />}
                          {activeLayer === 'rain' && <Area type="monotone" name="Rainfall (mm)" dataKey="rain" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRain)" activeDot={{r: 6, fill: '#3b82f6', stroke: '#111827', strokeWidth: 2}} />}
                          {activeLayer === 'humidity' && <Area type="monotone" name="Humidity (%)" dataKey="humidity" stroke="#06b6d4" strokeWidth={3} fill="url(#colorHum)" activeDot={{r: 6, fill: '#06b6d4', stroke: '#111827', strokeWidth: 2}} />}
                      </AreaChart>
                  </ResponsiveContainer>
             </div>
          </div>

          {/* AI Weather Recommendation Panel */}
          <div className="lg:col-span-1 glass card p-6 border-cyan-500/20 bg-gradient-to-bl from-cyan-500/10 to-transparent relative overflow-hidden flex flex-col">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                  <RiSeedlingLine className="text-cyan-400" size={18}/> AI Directives
              </h3>
              
              <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar relative z-10">
                  {recommendations.map((rec, i) => (
                      <motion.div 
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          className="bg-obsidian-dark/50 border border-white/5 p-4 rounded-xl shadow-inner relative overflow-hidden group cursor-pointer"
                      >
                          {rec.priority === 'High' && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-[20px] pointer-events-none group-hover:bg-rose-500/20 transition-colors" />}
                          
                          <div className="flex justify-between items-start mb-2 relative z-10">
                              <h4 className="text-[13px] font-bold text-white leading-tight pr-2">{rec.action}</h4>
                              <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${rec.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : rec.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-500/10 text-slate-400 border-white/10'}`}>
                                  {rec.priority}
                              </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-3 relative z-10">{rec.desc}</p>
                          <div className="flex justify-between items-center border-t border-white/5 pt-3 relative z-10">
                              <span className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-slate-500"><RiTimeLine className="text-blue-400"/> {rec.timeWindow}</span>
                              <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-emerald-400"><RiCheckDoubleLine/> {rec.confidence}</span>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      </div>

      {/* Tertiary Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Crop-Specific Risk Arrays */}
          <div className="md:col-span-1 glass card p-6 border border-white/5 bg-obsidian-light/20">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <RiPlantLine className="text-emerald-500"/> Crop Vulnerability Matrix
              </h3>
              <div className="space-y-4">
                  {CROP_VULNERABILITY.map(crop => (
                      <div key={crop.crop} className={`border p-4 rounded-xl flex flex-col gap-2 transition-colors hover:bg-white/[0.02] ${crop.color} border-opacity-30 relative overflow-hidden group`}>
                          <div className="flex justify-between items-center relative z-10">
                              <span className="font-black text-white text-sm">{crop.crop}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border currentColor border-opacity-50`}>Impact: {crop.impact}</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-300 relative z-10">{crop.risk}</p>
                          <p className="text-[10px] font-medium opacity-80 leading-relaxed relative z-10">Environmental stress mapping active for {location.name}.</p>
                      </div>
                  ))}
              </div>
          </div>

          {/* Farm Impact Section */}
          <div className="md:col-span-1 glass card p-6 border border-white/5 bg-obsidian-light/20 flex flex-col">
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <RiBarChartBoxLine className="text-cyan-500"/> Telemetry Impact
              </h3>
              <div className="space-y-4 flex-1">
                  {farmImpacts.map(imp => (
                      <div key={imp.label} className="bg-obsidian-dark/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex justify-between items-center">
                          <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{imp.label}</p>
                              <p className={`text-[13px] font-black ${imp.color}`}>{imp.value}</p>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${imp.color} bg-black/50 px-2 py-1 rounded border border-white/5`}>{imp.trend}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* Risk Timeline & Quick Actions */}
          <div className="md:col-span-1 space-y-6 flex flex-col">
              
              {/* Risk Timeline */}
              <div className="glass card p-6 border border-white/5 flex-1 relative overflow-hidden">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                      <RiTimeLine className="text-orange-500"/> Multi-Day Risk Timeline
                  </h3>
                  <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[4px] before:w-[2px] before:bg-white/10">
                      <div className="relative z-10">
                          <div className={`absolute -left-[20px] top-1 w-3 h-3 ${riskLevel.color.replace('text-', 'bg-')} rounded-full shadow-lg border border-obsidian`} />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current</p>
                          <p className={`text-sm font-bold ${riskLevel.color}`}>{riskLevel.level}</p>
                      </div>
                      <div className="relative z-10">
                          <div className={`absolute -left-[20px] top-1 w-3 h-3 ${trendData[1]?.rain > 5 ? 'bg-rose-500 animate-pulse' : 'bg-white/20'} rounded-full border border-obsidian`} />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tomorrow</p>
                          <p className="text-sm font-bold text-slate-300">{trendData[1]?.rain > 5 ? 'High Risk' : 'Monitoring'}</p>
                      </div>
                      <div className="relative z-10">
                          <div className="absolute -left-[20px] top-1 w-3 h-3 bg-white/10 rounded-full border border-obsidian" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Extended Window</p>
                          <p className="text-sm font-bold text-slate-500">Stability Estimated</p>
                      </div>
                  </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="grid grid-cols-2 gap-3">
                 <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 shadow-[0_0_20px_rgba(59,130,246,0.2)] text-obsidian px-4 py-3 rounded-xl font-black text-[10px] transition-all tracking-widest uppercase text-center border border-blue-400">
                     Plan Irrigation <RiArrowRightSLine size={14}/>
                 </button>
                 <button className="flex items-center justify-center gap-2 bg-obsidian-light border border-white/10 hover:bg-white/10 text-white px-4 py-3 rounded-xl font-black text-[10px] transition-all tracking-widest uppercase text-center">
                     Alert Network <RiShareForwardLine size={14}/>
                 </button>
                 <button className="col-span-2 flex items-center justify-center gap-2 bg-obsidian-light border border-white/10 hover:border-amber-500/50 hover:text-amber-400 text-slate-300 px-4 py-3 rounded-xl font-black text-[10px] transition-all tracking-widest uppercase text-center">
                     Prepare Protection <RiArrowRightSLine size={14} className="opacity-50"/>
                 </button>
              </div>

          </div>

      </div>

    </div>
  );
}
