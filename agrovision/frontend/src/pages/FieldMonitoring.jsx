import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RiTempHotLine, RiDropLine, RiShieldCheckLine, RiWifiLine, RiRefreshLine,
  RiCloudLine, RiPlantLine, RiFireLine, RiWaterFlashLine
} from 'react-icons/ri';
import Gauge from '../components/UI/Gauge';
import SensorCard from '../components/UI/SensorCard';
import AlertCard from '../components/UI/AlertCard';

export default function FieldMonitoring() {
  const [data, setData] = useState({
    temp: 0,
    humidity: 0,
    moisture: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    water: 85,
    health: 0,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [loading, setLoading] = useState(true);
  const [isSerialConnected, setIsSerialConnected] = useState(false);

  // Web Serial API Connection
  const connectSerial = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setIsSerialConnected(true);
      
      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        if (buffer.includes("\n")) {
          const lines = buffer.split("\n");
          buffer = lines.pop(); // keep remainder
          for (const line of lines) {
            if (line.includes("{") && line.includes("}")) {
              try {
                const jsonStr = line.substring(line.indexOf("{"), line.lastIndexOf("}") + 1);
                const iotData = JSON.parse(jsonStr);
                
                // Push copy to backend so Dashboard history stays updated
                fetch('/api/iot/push', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(iotData)
                }).catch(() => {});
                
                // Update live state natively at 120 FPS
                setData(prev => {
                  const newData = {
                    temp: iotData.temp || 0,
                    humidity: iotData.hum || 0,
                    moisture: iotData.soil || 0,
                    nitrogen: iotData.n || 0,
                    phosphorus: iotData.p || 0,
                    potassium: iotData.k || 0,
                    water: iotData.oil || 85,
                    lastUpdate: new Date().toLocaleTimeString()
                  };
                  const moistureScore = (newData.moisture > 30 && newData.moisture < 80) ? 100 : 50;
                  const npkScore = (newData.nitrogen + newData.phosphorus + newData.potassium) / 3;
                  newData.health = Math.round((moistureScore + npkScore) / 2);
                  if (newData.health > 100) newData.health = 100;
                  
                  const dryThreshold = 40;
                  const isRaining = newData.humidity > 90;
                  newData.prediction = {
                    needed: newData.moisture < dryThreshold && !isRaining,
                    reason: isRaining ? "Rain detected" : (newData.moisture < dryThreshold ? "Soil is dry" : "Optimal")
                  };
                  return newData;
                });
              } catch (e) { /* ignore parse errors */ }
            }
          }
        }
      }
    } catch (err) {
      console.error("Web Serial Error:", err);
      setIsSerialConnected(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/iot/data`);
      const iotData = await res.json();
      
      if (iotData && iotData.lastUpdate) {
        const newData = {
          temp: iotData.temp || 0,
          humidity: iotData.hum || 0,
          moisture: iotData.soil || 0,
          nitrogen: iotData.n || 0,
          phosphorus: iotData.p || 0,
          potassium: iotData.k || 0,
          water: iotData.oil || 85,
          lastUpdate: new Date(iotData.lastUpdate).toLocaleTimeString()
        };

        const moistureScore = (newData.moisture > 30 && newData.moisture < 80) ? 100 : 50;
        const npkScore = (newData.nitrogen + newData.phosphorus + newData.potassium) / 3;
        newData.health = Math.round((moistureScore + npkScore) / 2);
        if (newData.health > 100) newData.health = 100;

        const dryThreshold = 40;
        const isRaining = newData.humidity > 90;
        newData.prediction = {
          needed: newData.moisture < dryThreshold && !isRaining,
          reason: isRaining ? "Rain detected - skipping irrigation" : 
                  (newData.moisture < dryThreshold ? "Soil is dry - Irrigate now" : "Moisture levels optimal")
        };

        setData(newData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Local API Fetch Error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSerialConnected) return; // Stop polling if natively connected
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [isSerialConnected]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12">
      <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Field Monitoring</h1>
          <p className="text-emerald-500/80 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Telemetry System
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={connectSerial} 
            className={`bg-obsidian-light/40 border ${isSerialConnected ? 'border-emerald-500/50 text-emerald-400' : 'border-blue-500/50 text-blue-400'} px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all outline-none`}
          >
            <RiWifiLine size={20} className={isSerialConnected ? 'animate-pulse' : ''} />
            <span className="text-xs font-bold tracking-widest uppercase">
              {isSerialConnected ? 'COM Active' : 'Connect USB'}
            </span>
          </button>

          <div className="bg-obsidian-light/40 border border-white/5 px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <RiWifiLine className={`text-xl ${isSerialConnected ? 'text-emerald-400' : (loading ? 'text-slate-400 animate-pulse' : 'text-emerald-400')}`} />
            <span className="text-xs text-slate-300 font-bold tracking-widest uppercase">Sync: {data.lastUpdate}</span>
            <button onClick={fetchData} disabled={loading || isSerialConnected} className="p-1.5 hover:bg-white/5 rounded-xl transition-all hover:scale-110 disabled:opacity-50 outline-none">
              <RiRefreshLine className={`text-lg text-emerald-400 ${loading && !isSerialConnected ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Gauges */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Gauge value={data.moisture} label="Soil Moisture" icon={RiDropLine} color="#3b82f6" delay={0.1} />
          <SensorCard value={data.temp} label="Temperature" unit="°C" icon={RiTempHotLine} color="#f97316" delay={0.2} />
          
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
             <SensorCard value={data.nitrogen} max={255} label="Nitrogen (N)" unit="mg/kg" icon={RiPlantLine} color="#3b82f6" delay={0.3} />
             <SensorCard value={data.phosphorus} max={255} label="Phosphorus (P)" unit="mg/kg" icon={RiFireLine} color="#a855f7" delay={0.4} />
             <SensorCard value={data.potassium} max={255} label="Potassium (K)" unit="mg/kg" icon={RiShieldCheckLine} color="#10b981" delay={0.5} />
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-6">
          {/* Health Gauge */}
          <Gauge value={data.health} label="Overall Health Index" icon={RiShieldCheckLine} color="#10b981" delay={0.6} />

          {/* Smart Alerts */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} delay={0.7} className="glass card flex-1 space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 pb-4 border-b border-white/5">Smart Insights</h3>
             
             {data.prediction?.needed ? (
                <AlertCard title="Irrigation Required" message={data.prediction.reason} type="warning" />
             ) : (
                <AlertCard title="Optimal Moisture" message={data.prediction?.reason || "No action needed"} type="success" />
             )}

             {data.temp > 35 && (
                <AlertCard title="Heat Stress Warning" message="High temp detected. Consider shade netting." type="error" />
             )}
             
             {data.moisture < 30 && (
                <AlertCard title="Critical Alert" message="Extreme soil dryness detected. Crop health at risk." type="error" />
             )}

             {data.nitrogen < 50 && (
                <AlertCard title="Nutrient Deficiency" message="Low Nitrogen levels. Fertilizer recommended." type="warning" />
             )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
