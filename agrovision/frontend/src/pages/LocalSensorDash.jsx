import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RiSettings3Line } from 'react-icons/ri'

// Real ThingSpeak logic adapted from dashboard/index.html
const SOIL_DRY = 30;
const TEMP_HIGH = 38;
const HUM_HIGH = 85;
const N_LOW = 20, P_LOW = 15, K_LOW = 20;
const NPK_MAX = 200;
const CRITICAL_KEYWORDS = ['Late Blight', 'Yellow Leaf Curl', 'Mosaic Virus'];

function getField(entry, n, fallback = null) {
  const v = entry[`field${n}`];
  if (v === null || v === undefined || v === '') return fallback;
  const num = parseFloat(v);
  return isNaN(num) ? v : num;
}

export default function LocalSensorDash() {
  const [config, setConfig] = useState(() => ({
    iotChannelId: localStorage.getItem('cg_iot_ch') || '',
    iotApiKey: localStorage.getItem('cg_iot_key') || '',
    aiChannelId: localStorage.getItem('cg_ai_ch') || '',
    aiApiKey: localStorage.getItem('cg_ai_key') || '',
    interval: parseInt(localStorage.getItem('cg_interval') || '30'),
  }));

  const [showConfig, setShowConfig] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('Not yet fetched');
  
  const [iotData, setIotData] = useState({ temp: null, hum: null, soil: null, n: null, p: null, k: null, light: null, rain: null });
  const [aiData, setAiData] = useState({ label: 'Awaiting prediction...', confidence: null, isHealthy: null });
  const [alerts, setAlerts] = useState([]);
  
  const [tempHistory, setTempHistory] = useState([]);
  const [soilHistory, setSoilHistory] = useState([]);

  useEffect(() => {
    let poller;
    const fetchAll = async () => {
      const now = new Date().toLocaleTimeString();
      setLastUpdate('Updated: ' + now);

      try {
        if (config.iotChannelId && config.iotApiKey) {
          const res = await fetch(`https://api.thingspeak.com/channels/${config.iotChannelId}/feeds.json?api_key=${config.iotApiKey}&results=10`);
          const data = await res.json();
          if (data && data.feeds && data.feeds.length > 0) {
            const latest = data.feeds[data.feeds.length - 1];
            const newIot = {
              temp: getField(latest, 1),
              hum: getField(latest, 2),
              soil: getField(latest, 3),
              n: getField(latest, 4),
              p: getField(latest, 5),
              k: getField(latest, 6),
              light: getField(latest, 7),
              rain: getField(latest, 8),
            };
            setIotData(newIot);

            // Histories
            const newTempHist = data.feeds.map(f => ({ time: new Date(f.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), val: getField(f, 1) })).filter(f => f.val !== null);
            const newSoilHist = data.feeds.map(f => ({ time: new Date(f.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), val: getField(f, 3) })).filter(f => f.val !== null);
            setTempHistory(newTempHist);
            setSoilHistory(newSoilHist);
          }
        }
      } catch (e) { console.error(e) }

      try {
        if (config.aiChannelId && config.aiApiKey) {
          const res = await fetch(`https://api.thingspeak.com/channels/${config.aiChannelId}/feeds.json?api_key=${config.aiApiKey}&results=1`);
          const data = await res.json();
          if (data && data.feeds && data.feeds.length > 0) {
            const aLatest = data.feeds[data.feeds.length - 1];
            setAiData({
              confidence: getField(aLatest, 1),
              isHealthy: getField(aLatest, 2) === 1, // assuming 1 is healthy
              label: aLatest.status || 'Unknown'
            });
          }
        }
      } catch (e) { console.error(e) }
    };

    if (config.iotChannelId || config.aiChannelId) {
      fetchAll();
      poller = setInterval(fetchAll, config.interval * 1000);
    } else {
      setShowConfig(true);
    }
    return () => clearInterval(poller);
  }, [config]);

  // Derived states
  const pumpOn = iotData.soil !== null && iotData.soil < SOIL_DRY && iotData.rain !== 1;
  
  const buildAlerts = () => {
    let arr = [];
    if (iotData.soil !== null && iotData.soil < SOIL_DRY) arr.push({ cls: 'alert-crit', msg: `🚿 Soil moisture critically low (${iotData.soil}%) — irrigation required!` });
    if (iotData.temp !== null && iotData.temp > TEMP_HIGH) arr.push({ cls: 'alert-warn', msg: `🌡 High temperature (${iotData.temp}°C) — risk of heat stress.` });
    if (iotData.hum !== null && iotData.hum > HUM_HIGH) arr.push({ cls: 'alert-warn', msg: `💧 High humidity (${iotData.hum}%) — fungal disease risk elevated.` });
    if (iotData.n !== null && iotData.n < N_LOW) arr.push({ cls: 'alert-warn', msg: `🌿 Low Nitrogen (${iotData.n} mg/kg) — apply N-rich fertiliser.` });
    if (iotData.p !== null && iotData.p < P_LOW) arr.push({ cls: 'alert-warn', msg: `🌿 Low Phosphorus (${iotData.p} mg/kg) — apply phosphorus supplement.` });
    if (iotData.k !== null && iotData.k < K_LOW) arr.push({ cls: 'alert-warn', msg: `🌿 Low Potassium (${iotData.k} mg/kg) — apply K-rich fertiliser.` });

    if (aiData.label && aiData.label !== 'Unknown' && aiData.label !== 'Awaiting prediction...' && !aiData.isHealthy) {
      const isCrit = CRITICAL_KEYWORDS.some(c => aiData.label.includes(c));
      arr.push({
        cls: isCrit ? 'alert-crit' : 'alert-warn',
        msg: `${isCrit ? '🚨' : '⚠'} Disease: ${aiData.label} (${aiData.confidence}% confidence).`,
      });
    }
    return arr;
  };

  const currentAlerts = buildAlerts();

  return (
    <div className="relative min-h-[800px] flex flex-col gap-6 text-textPrimary selection:bg-accent selection:text-bg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface border border-borderLine rounded-card p-4 shadow-glow">
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-xs font-bold tracking-[0.8px] text-accent2 uppercase">
                <div className="w-2 h-2 bg-accent2 rounded-full animate-pulse-fast" /> Live
             </div>
             <span className="text-xs text-muted font-mono">{lastUpdate}</span>
         </div>
         <button onClick={() => setShowConfig(true)} className="mt-4 sm:mt-0 px-4 py-2 bg-surface2 border border-borderLine rounded-lg text-sm hover:bg-surface transition-colors flex items-center gap-2">
            <RiSettings3Line /> Config
         </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Temperature */}
        <div className="neon-card">
           <div className="card-title">🌡 Temperature</div>
           <div className={`card-value ${iotData.temp > TEMP_HIGH ? 'val-danger' : iotData.temp > 32 ? 'val-warn' : 'val-ok'}`}>
              {iotData.temp !== null ? iotData.temp.toFixed(1) : '--'}<span className="card-unit">°C</span>
           </div>
           <div className="card-sub">{iotData.temp > TEMP_HIGH ? '⚠ Heat stress risk' : 'Normal range'}</div>
        </div>

        {/* Humidity */}
        <div className="neon-card">
           <div className="card-title">💧 Humidity</div>
           <div className={`card-value ${iotData.hum > HUM_HIGH ? 'val-warn' : 'val-ok'}`}>
              {iotData.hum !== null ? iotData.hum.toFixed(0) : '--'}<span className="card-unit">%</span>
           </div>
           <div className="card-sub">{iotData.hum > HUM_HIGH ? '⚠ Fungal risk' : 'Normal'}</div>
        </div>

        {/* Soil Moisture with Ring Gauge */}
        <div className="neon-card">
           <div className="card-title">🌍 Soil Moisture</div>
           <div className="flex items-center gap-4 mt-2">
             <div 
                className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 relative gauge-ring"
                style={{ '--deg': `${Math.min(iotData.soil || 0, 100) / 100 * 360}deg` }}
             >
                <div className="absolute inset-[10px] bg-surface rounded-full flex items-center justify-center">
                   <span className="text-sm font-bold font-mono text-accent">{(iotData.soil || 0).toFixed(0)}%</span>
                </div>
             </div>
             <div>
                <div className={`card-value ${iotData.soil < SOIL_DRY ? 'val-danger' : iotData.soil > 80 ? 'val-info' : 'val-ok'}`}>
                   {iotData.soil !== null ? iotData.soil.toFixed(0) : '--'}<span className="card-unit">%</span>
                </div>
                <div className="card-sub">{iotData.soil < SOIL_DRY ? '🚨 Dry — irrigate now' : 'Adequate'}</div>
             </div>
           </div>
        </div>

        {/* Pump Status */}
        <div className="neon-card flex flex-col justify-between">
           <div className="card-title">🚿 Irrigation Pump</div>
           <div className="flex flex-col gap-3 mt-2">
              <div className={`text-4xl transition-all duration-500 w-12 h-12 flex items-center justify-center ${pumpOn ? 'drop-shadow-[0_0_12px_var(--accent)] animate-pump-pulse' : ''}`}>
                 {pumpOn ? '🚿' : '💤'}
              </div>
              <div>
                 <span className={`pill ${pumpOn ? 'pill-blue ' : 'pill-green'}`}>
                    {pumpOn ? '● Running' : '○ Standby'}
                 </span>
              </div>
              <div className="card-sub">
                 {pumpOn ? 'Auto-triggered: low soil moisture' : `Soil OK or rain detected`}
              </div>
           </div>
        </div>

        {/* NPK Bars - Span 2 */}
        <div className="neon-card sm:col-span-2">
           <div className="card-title">🌿 Soil Nutrients (NPK)</div>
           <div className="flex gap-5 mt-3 items-end">
              {[{lbl: 'N', val: iotData.n, color: '#38bdf8', thres: N_LOW}, {lbl: 'P', val: iotData.p, color: '#34d399', thres: P_LOW}, {lbl: 'K', val: iotData.k, color: '#fbbf24', thres: K_LOW}].map(n => (
                 <div key={n.lbl} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-9 h-28 bg-surface2 rounded-md overflow-hidden flex flex-col justify-end">
                       <div className="w-full transition-all duration-700 rounded-t-md" style={{ height: `${Math.min(((n.val||0)/NPK_MAX)*100, 100)}%`, backgroundColor: n.color }} />
                    </div>
                    <div className={`text-sm font-mono font-bold ${n.val !== null && n.val < n.thres ? 'val-danger' : 'val-ok'}`}>
                       {n.val !== null ? n.val : '--'}
                    </div>
                    <div className="text-xs text-muted font-bold tracking-wider">{n.lbl}</div>
                 </div>
              ))}
              <div className="flex-[2] mb-1">
                 <div className="card-sub mb-2">Unit: mg/kg</div>
              </div>
           </div>
        </div>

        {/* Sunlight */}
        <div className="neon-card">
           <div className="card-title">☀️ Sunlight</div>
           <div className="card-value val-info">{iotData.light === 0 ? '☀️ Bright' : iotData.light === 1 ? '🌑 Dark' : '--'}</div>
           <div className="card-sub">—</div>
        </div>

        {/* Rain */}
        <div className="neon-card">
           <div className="card-title">🌧 Rain Sensor</div>
           <div className="card-value val-info">{iotData.rain === 1 ? '🌧 Raining' : '☀️ Dry'}</div>
           <div className="card-sub">—</div>
        </div>

        {/* AI Disease Detection - Span 2 */}
        <div className="neon-card sm:col-span-2">
           <div className="card-title">🤖 AI Disease Detection</div>
           <div className="text-xl font-bold mt-2 leading-tight">{aiData.label}</div>
           
           <div className="h-1.5 bg-surface2 rounded-md mt-4 mb-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-accent2 transition-all duration-700" style={{ width: `${aiData.confidence || 0}%` }} />
           </div>
           <div className="text-xs text-muted mb-3">Confidence: {aiData.confidence !== null ? `${aiData.confidence.toFixed(1)}%` : '--'}</div>
           
           {aiData.label !== 'Unknown' && aiData.label !== 'Awaiting prediction...' && (
              aiData.isHealthy 
                 ? <span className="pill pill-green">✅ Healthy</span>
                 : <span className={`pill ${CRITICAL_KEYWORDS.some(c => aiData.label.includes(c)) ? 'pill-red' : 'pill-yellow'}`}>
                      {CRITICAL_KEYWORDS.some(c => aiData.label.includes(c)) ? '🚨 Critical Disease' : '⚠ Disease Detected'}
                   </span>
           )}
        </div>

        {/* Alerts - Span 2 */}
        <div className="neon-card sm:col-span-2">
           <div className="card-title">🚨 Alerts</div>
           <div className="flex flex-col gap-2 mt-3">
              {currentAlerts.length === 0 ? (
                 <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium bg-[#34d3991a] border-l-4 border-accent2 animate-[slideIn_0.35s_ease]">
                    ✅ No alerts — all systems nominal.
                 </div>
              ) : (
                 currentAlerts.map((a, i) => (
                    <div key={i} className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium animate-[slideIn_0.35s_ease] ${
                       a.cls === 'alert-crit' ? 'bg-[#f871711a] border-l-4 border-danger' : 'bg-[#fbbf241a] border-l-4 border-warn'
                    }`}>
                       {a.msg}
                    </div>
                 ))
              )}
           </div>
        </div>

        {/* Temp History Chart - Span 2 */}
        <div className="neon-card sm:col-span-2">
           <div className="card-title">📈 Temperature History (last 10)</div>
           <div className="h-[200px] mt-4 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={tempHistory}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#63b3ed12" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}°C`} />
                    <Tooltip contentStyle={{ backgroundColor: '#111d35', border: '1px solid rgba(99,179,237,0.12)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="val" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#tempGrad)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Soil Moisture Chart - Span 2 */}
        <div className="neon-card sm:col-span-2">
           <div className="card-title">📉 Soil Moisture History (last 10)</div>
           <div className="h-[200px] mt-4 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={soilHistory}>
                    <defs>
                      <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#63b3ed12" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#111d35', border: '1px solid rgba(99,179,237,0.12)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="val" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#soilGrad)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-surface border border-borderLine rounded-[18px] p-8 w-full max-w-lg shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
              <h2 className="text-xl font-bold mb-6">⚙️ ThingSpeak Configuration</h2>
              
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1">IoT Channel ID</label>
                   <input type="text" value={config.iotChannelId} onChange={e => setConfig({...config, iotChannelId: e.target.value})} className="w-full bg-bg2 border border-borderLine text-textPrimary px-3 py-2 rounded-lg font-mono text-sm focus:outline-none focus:border-accent" />
                 </div>
                 <div>
                   <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1">IoT Read API Key</label>
                   <input type="text" value={config.iotApiKey} onChange={e => setConfig({...config, iotApiKey: e.target.value})} className="w-full bg-bg2 border border-borderLine text-textPrimary px-3 py-2 rounded-lg font-mono text-sm focus:outline-none focus:border-accent" />
                 </div>
                 <div>
                   <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1">AI / Disease Channel ID</label>
                   <input type="text" value={config.aiChannelId} onChange={e => setConfig({...config, aiChannelId: e.target.value})} className="w-full bg-bg2 border border-borderLine text-textPrimary px-3 py-2 rounded-lg font-mono text-sm focus:outline-none focus:border-accent" />
                 </div>
                 <div>
                   <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1">AI Read API Key</label>
                   <input type="text" value={config.aiApiKey} onChange={e => setConfig({...config, aiApiKey: e.target.value})} className="w-full bg-bg2 border border-borderLine text-textPrimary px-3 py-2 rounded-lg font-mono text-sm focus:outline-none focus:border-accent" />
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                 <button onClick={() => setShowConfig(false)} className="px-5 py-2 rounded-lg text-sm font-bold bg-surface2 text-textPrimary hover:bg-bg2 border border-borderLine transition-colors">Cancel</button>
                 <button onClick={() => {
                    localStorage.setItem('cg_iot_ch', config.iotChannelId);
                    localStorage.setItem('cg_iot_key', config.iotApiKey);
                    localStorage.setItem('cg_ai_ch', config.aiChannelId);
                    localStorage.setItem('cg_ai_key', config.aiApiKey);
                    setShowConfig(false);
                 }} className="px-5 py-2 rounded-lg text-sm font-bold bg-accent text-bg hover:brightness-110 transition-all">Save & Connect</button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
