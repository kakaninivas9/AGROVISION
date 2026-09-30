import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiScan2Line, RiUploadCloud2Line, RiHistoryLine, 
  RiShieldFlashLine, RiLeafLine, RiCheckDoubleLine,
  RiArrowRightUpLine, RiCloseFill, RiAlertLine, RiSparkling2Line,
  RiFocus3Line, RiSyringeLine, RiPlantLine, RiTimeLine, RiInformationFill, RiEarthLine, RiShareForwardLine, RiDownloadCloud2Line, RiCloudWindyLine, RiTempHotLine, RiDropLine
} from 'react-icons/ri';
import api from '../services/api';
import toast from 'react-hot-toast';

const SCAN_STAGES = [
  "Uploading High-Res Image",
  "Segmenting Leaf Architecture",
  "Cross-checking Pathogen Models",
  "Synthesizing Treatment Intelligence"
];

const PREVIOUS_SCANS = [
  { id: 'SC-8812', date: '2 Days Ago', crop: 'Tomato', disease: 'Early Blight', status: 'Recovering', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'SC-8804', date: '5 Days Ago', crop: 'Rice', disease: 'Healthy', status: 'Optimal', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'SC-8791', date: '1 Week Ago', crop: 'Potato', disease: 'Late Blight', status: 'Treated', color: 'text-blue-400', bg: 'bg-blue-500/10' },
];

export default function DiseaseDetection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanState, setScanState] = useState('idle'); // idle, scanning, result
  const [scanProgress, setScanProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
      setScanState('idle');
      setResult(null);
      setScanProgress(0);
    }
  };

  const executePipeline = async () => {
    if (!preview || !file) return;
    setScanState('scanning');
    setScanProgress(0);
    setActiveStage(0);

    const progressInterval = setInterval(() => {
        setScanProgress(prev => {
            const next = prev + 1.5;
            if (next > 25) setActiveStage(1);
            if (next > 50) setActiveStage(2);
            if (next > 80) setActiveStage(3);
            return next > 95 ? 95 : next;
        });
    }, 60);

    try {
      // Step 2 & 3: Resize and Compress via Canvas Image Processing
      const img = new Image();
      img.src = preview;
      await new Promise(r => img.onload = r);
      
      let width = img.width, height = img.height;
      if (width > height) { if (width > 1024) { height *= 1024 / width; width = 1024; } }
      else { if (height > 1024) { width *= 1024 / height; height = 1024; } }
      
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      
      const formData = new FormData();
      formData.append("image", file); // Fallback if blob mapping fails in fetch
      formData.append("modelType", selectedModel);
      if (blob) {
         formData.set("image", blob, file.name || "scan_optimized.jpg");
      }

    let detectionResult;
    try {
      // ── UNIFIED PIPELINE: Calls Backend /api/detect which handles all fallbacks (Gemini -> Groq -> Local) ──
      const { data } = await api.post("/detect", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          timeout: 90000 // 90 second explicit timeout for this heavy call
      });
      
      if (data.success) {
          detectionResult = data.prediction;
      } else {
          throw new Error(data.error || "Detection failed");
      }
    } catch (err) {
      console.error("[AgroVision] Pipeline Error:", err);
      throw err;
    }
      
      clearInterval(progressInterval);
      setScanProgress(100);

      // ── Process Result for UI ─────────────────────────────────────────────
      const pred = detectionResult;
      const isLocal = pred.source === "local_ml";
      const isHF = pred.source === "huggingface";
      
      setResult({
          diseaseLabel: pred.diseaseLabel,
          isHealthy: pred.isHealthy,
          primaryConfidence: (isLocal || isHF) ? "Cloud Offline" : `${pred.confidence}%`,
          fallbackConfidence: isLocal ? `${pred.confidence}%` : (isHF ? "Active" : "Standby"),
          consensus: isLocal ? "Local ML Active" : (isHF ? "Hugging Face AI" : "Cloud Verified"),
          fallbackModel: isLocal ? "TFJS Local CNN" : (isHF ? "Inference API" : "N/A"),
          riskLevel: pred.isHealthy ? "LOW" : (pred.severity?.toUpperCase() || "CRITICAL"),
          spreadProb: isLocal ? "78%" : (pred.isHealthy ? "None" : (pred.severity === "Critical" ? "92%" : "Unknown")),
          urgency: isLocal ? "Immediate" : (pred.isHealthy ? "Routine" : (pred.severity === "Critical" ? "URGENT" : "High")),
          impactScore: pred.isHealthy ? "None" : (isLocal ? "High" : (pred.severity || "Moderate")),
          treatment: {
              priority: isLocal ? "halt spreading vectors" : (pred.isHealthy ? "Maintain observation" : "Apply primary defense"),
              chemical: typeof pred.treatment === 'string' ? pred.treatment : (pred.treatment?.chemical || "Consult chemical catalog."),
              organic: isLocal ? "Bacillus subtilis spray" : "Ensure proper ventilation and balanced watering.",
              timeline: isLocal ? "Re-evaluate in 48 hours." : "Re-evaluate next cycle."
          },
          context: { crop: isLocal ? "Identified" : "Detected", stage: isLocal ? "Fruiting" : "Active", weather: isLocal ? "Offline" : "Telemetry linked", soil: isLocal ? "Offline" : "Monitored" }
      });
      setScanState('result');

    } catch (err) {
      clearInterval(progressInterval);
      setScanProgress(100);
      
      const errorMsg = err.response?.data?.error || err.message;
      
      setResult({
          diseaseLabel: errorMsg === "API key not configured" ? "API key not configured" : (errorMsg === "Not authorized — no token provided" ? "Authorization Failed" : "System Communication Error"),
          isHealthy: false,
          primaryConfidence: "Cloud Offline",
          fallbackConfidence: "Failed",
          consensus: "Fallback Error",
          fallbackModel: errorMsg,
          riskLevel: "UNKNOWN",
          spreadProb: "--",
          urgency: "N/A",
          impactScore: "N/A",
          treatment: { priority: "N/A", chemical: `Error connecting to AI Node: ${errorMsg}`, organic: "N/A", timeline: "N/A" },
          context: { crop: "N/A", stage: "N/A", weather: "N/A", soil: "N/A" }
      });
      setScanState('result');
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const reportText = `
AGROVISION AI DIAGNOSTIC REPORT
-------------------------------
Disease: ${result.diseaseLabel}
Risk Level: ${result.riskLevel}
Confidence: ${result.primaryConfidence}
Consensus: ${result.consensus}

TREATMENT PROTOCOL:
- Priority: ${result.treatment.priority}
- Chemical: ${result.treatment.chemical}
- Organic: ${result.treatment.organic}
- Timeline: ${result.treatment.timeline}

CONTEXT:
- Crop Stage: ${result.context.stage}
- Telemetry: ${result.context.weather}

Generated by AgroVision Neural Pathologist on ${new Date().toLocaleString()}
    `;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgroVision_Report_${result.diseaseLabel.replace(/\\s+/g, '_')}.txt`;
    link.click();
    toast.success('Report Downloaded');
  };

  const shareReport = async () => {
    if (!result) return;
    const shareData = {
      title: 'AgroVision Disease Diagnostic',
      text: `Alert: ${result.diseaseLabel} detected. Risk: ${result.riskLevel}. Action required.`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} Check details at: ${shareData.url}`);
        toast.success('Diagnostics copied to clipboard');
      }
    } catch (err) {
      console.error('Sharing failed', err);
    }
  };

  return (
    <div className="space-y-6 lg:max-w-[1400px] w-full mx-auto animate-[slideIn_0.35s_ease] pb-16 font-sans">
      
      {/* 1. Header Obelisk */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-white/5 pb-6">
        <div>
           <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-[0.3em] uppercase mb-4">
             <RiScan2Line className="animate-pulse" /> Neural Pathologist
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">Diagnostic <span className="text-slate-500">Suite.</span></h1>
           <p className="text-sm font-medium text-slate-400 max-w-lg">Medical-grade AI crop pathology system with intelligent fallback detection and real-time visual telemetry.</p>
        </div>

        {/* Dynamic Multi-Model Connection Status Indicator */}
        <div className="flex flex-col gap-2 relative">
            {scanState === 'result' && result.consensus !== 'Cloud Verified' ? (
                <div className={`px-4 py-3 rounded-xl border flex flex-col shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md relative overflow-hidden group ${result.consensus === 'Hugging Face AI' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                    <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-xl pointer-events-none transition-colors ${result.consensus === 'Hugging Face AI' ? 'bg-cyan-500/20 group-hover:bg-cyan-500/30' : 'bg-amber-500/20 group-hover:bg-amber-500/30'}`} />
                    <div className="flex items-center gap-3 font-black tracking-widest uppercase text-[10px] mb-1">
                        <span className={`w-2 h-2 rounded-full animate-pulse shadow-glow ${result.consensus === 'Hugging Face AI' ? 'bg-cyan-500' : 'bg-amber-500'}`} /> 
                        {result.consensus}
                    </div>
                    <span className={`text-xs font-bold capitalize flex items-center gap-1.5 opacity-90 ${result.consensus === 'Hugging Face AI' ? 'text-cyan-400' : 'text-amber-400'}`}><RiShieldFlashLine/> Model: {result.fallbackModel}</span>
                </div>
            ) : (
                <div className="px-4 py-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-3 font-black tracking-widest uppercase text-[10px] shadow-lg">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-glow-green-sm" /> 
                    <RiEarthLine size={16}/> Cloud Primary Armed
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
        {/* LEFT COLUMN: SCANNERS & PROGRESS */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* Visual Scanner Port */}
            <div className={`glass card p-6 min-h-[450px] relative overflow-hidden transition-all duration-700 ${scanState === 'scanning' ? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.05)]' : 'border-white/5'}`}>
                {!preview ? (
                     <label className="w-full h-full min-h-[400px] flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-white/10 hover:border-emerald-500/30 rounded-2xl transition-colors group bg-obsidian-dark/50 hover:bg-obsidian-light/50">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all duration-500 mb-6 shadow-lg">
                           <RiUploadCloud2Line size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Mount Specimen</h3>
                        <p className="text-slate-500 text-xs font-medium max-w-[200px] text-center">Drag or select a leaf image. Automated optimization pipeline active.</p>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                     </label>
                ) : (
                    <div className="w-full h-full flex flex-col relative">
                        <div className="relative flex-1 rounded-2xl overflow-hidden bg-black border border-white/10 group/preview h-full min-h-[400px]">
                            <img src={preview} className="w-full h-full object-cover absolute inset-0 opacity-80" alt="Preview" />
                            
                            {/* Scanning Animation Logic */}
                            {scanState === 'scanning' && (
                                <>
                                    <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay animate-pulse" />
                                    {/* Laser Sweep */}
                                    <motion.div 
                                        animate={{ top: ['0%', '100%', '0%'] }} 
                                        transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
                                        className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_20px_4px_rgba(16,185,129,0.8)] z-10"
                                    />
                                    {/* Targeting Reticles */}
                                    <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-emerald-500/50" />
                                    <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-emerald-500/50" />
                                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-emerald-500/50" />
                                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-emerald-500/50" />
                                </>
                            )}

                            {/* Result Heatmap Logic */}
                            {scanState === 'result' && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute inset-0 z-20 pointer-events-none"
                                >
                                    {/* Simulated infected region box */}
                                    <div className="absolute top-[30%] left-[25%] right-[30%] bottom-[40%] border-2 border-rose-500 bg-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-end p-2 transition-all">
                                        <div className="bg-rose-500 text-obsidian px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-lg backdrop-blur flex items-center gap-1">
                                            <RiFocus3Line/> Pathogen Mass
                                        </div>
                                    </div>
                                    {/* Simulated secondary region */}
                                    <div className="absolute top-[60%] left-[55%] right-[20%] bottom-[15%] border border-rose-500/50 bg-rose-500/10 flex items-start p-2">
                                        <div className="text-rose-400 px-1 py-0.5 text-[8px] font-black uppercase tracking-widest bg-obsidian/70 rounded">Low Conf Heatmap</div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Close Button when idle */}
                            {scanState === 'idle' && (
                                <div className="absolute inset-0 bg-obsidian-dark/50 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity backdrop-blur-sm">
                                    <button onClick={() => {setFile(null); setPreview(null); setResult(null);}} className="bg-rose-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-110 transition-transform">
                                        <RiCloseFill size={24} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Trigger / Status Footer */}
                        <div className="mt-4">
                            {scanState === 'idle' ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-obsidian-dark/80 border border-white/5 space-y-3 shadow-inner">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                                            <span className="flex items-center gap-2"><RiSparkling2Line /> Select Neural Engine</span>
                                            <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-[8px]">PRO-ENABLED</span>
                                        </div>
                                        <select 
                                            value={selectedModel}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="w-full bg-obsidian border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen Fast)</option>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Performance)</option>
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro (State-of-the-art)</option>
                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Classic)</option>
                                        </select>
                                    </div>
                                    <button onClick={executePipeline} className="w-full py-4 rounded-xl bg-emerald-500 text-obsidian-dark font-black tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                                        <RiScan2Line size={20} /> Initiate Telemetry Analysis
                                    </button>
                                </div>
                            ) : scanState === 'scanning' ? (
                                <div className="w-full p-4 rounded-xl bg-obsidian-light border border-white/5 space-y-3 relative overflow-hidden">
                                     {/* Background fill progress */}
                                     <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-300 ease-linear" style={{ width: `${scanProgress}%` }} />
                                     
                                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-400 relative z-10">
                                         <span>Pipeline Active • {selectedModel}</span>
                                         <span>{Math.round(scanProgress)}%</span>
                                     </div>
                                     <div className="relative z-10">
                                         <p className="text-white text-sm font-bold flex items-center gap-2">
                                             <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                             {SCAN_STAGES[activeStage]}
                                         </p>
                                     </div>
                                </div>
                            ) : (
                                <button onClick={() => {setFile(null); setPreview(null); setResult(null); setScanState('idle');}} className="w-full py-4 rounded-xl bg-obsidian-light border border-white/10 text-white font-black tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-white/5 transition-all">
                                    <RiHistoryLine size={18} /> Rescan New Specimen
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Diagnostic History Summary */}
            <div className="glass card p-6 border-white/5 flex-1">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <RiHistoryLine/> History & Diagnostics Trend
                 </h3>
                 <div className="space-y-3">
                     {PREVIOUS_SCANS.map(scan => (
                         <div key={scan.id} className="flex justify-between items-center p-3 rounded-xl bg-obsidian-dark/40 border border-white/5 hover:border-white/10 transition-colors">
                             <div>
                                 <p className="text-[10px] font-bold text-slate-500 mb-0.5">{scan.date} • {scan.id}</p>
                                 <p className="text-xs font-bold text-white tracking-wide">{scan.crop} — {scan.disease}</p>
                             </div>
                             <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded inline-block ${scan.bg} ${scan.color}`}>{scan.status}</span>
                         </div>
                     ))}
                 </div>
            </div>

        </div>

        {/* RIGHT COLUMN: INTELLIGENCE PANELS */}
        <div className="lg:col-span-7 space-y-6 flex flex-col h-full relative">
            <AnimatePresence mode="wait">
                {result ? (
                    <motion.div 
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        className="space-y-6 flex-1 flex flex-col"
                        key="result-dashboard"
                    >
                        {/* 1. Primary Diagnosis Identity & Action Banner */}
                        <div className={`glass card p-6 border flex justify-between items-center ${result.diseaseLabel === "Local Model Unavailable" ? 'border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent' : 'border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-transparent'}`}>
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ${result.diseaseLabel === "Local Model Unavailable" ? 'text-amber-500' : 'text-rose-500'}`}>
                                    <RiAlertLine/> {result.diseaseLabel === "Local Model Unavailable" ? "System Availability Error" : "Pathogen Identity Confirmed"}
                                </span>
                                <h2 className={`text-2xl md:text-3xl font-black tracking-tight leading-none ${result.diseaseLabel === "Local Model Unavailable" ? 'text-amber-400' : 'text-rose-400'}`}>{result.diseaseLabel}</h2>
                            </div>
                            <button className={`flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] text-obsidian px-5 py-3 rounded-xl font-black text-[11px] transition-all tracking-widest uppercase ${result.diseaseLabel === "Local Model Unavailable" ? 'bg-amber-500 hover:bg-amber-400' : 'bg-rose-500 hover:bg-rose-400'}`}>
                                Initiate Protocol <RiArrowRightUpLine size={16}/>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 2. Confidence Matrix Grid */}
                            <div className="glass card p-5 border-white/5 space-y-4">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                     <RiShieldFlashLine/> Multi-Layer Confidence
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-obsidian-dark/50 border border-white/5 px-3 py-2 rounded-lg">
                                        <span className="text-[11px] font-bold text-slate-400">Primary (Cloud)</span>
                                        <span className={`text-[11px] font-black px-2 py-0.5 rounded ${result.primaryConfidence === 'Cloud Offline' || result.primaryConfidence === 'Offline / Timeout' ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>{result.primaryConfidence}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-obsidian-dark/50 border border-white/5 px-3 py-2 rounded-lg relative overflow-hidden">
                                        <span className="text-[11px] font-bold text-slate-400 relative z-10">Fallback (Edge AI)</span>
                                        <div className={`absolute left-0 bottom-0 h-0.5 ${result.fallbackConfidence === 'Standby' ? 'bg-slate-500 w-[100%]' : result.fallbackConfidence === 'Failed' ? 'bg-rose-500 w-[100%]' : 'bg-amber-500 w-[84%]'}`} />
                                        <span className={`text-[12px] font-black relative z-10 ${result.fallbackConfidence === 'Standby' ? 'text-slate-400' : result.fallbackConfidence === 'Failed' ? 'text-rose-400' : 'text-amber-400'}`}>{result.fallbackConfidence}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                                        <span className="text-[11px] font-bold text-emerald-500">Consensus Result</span>
                                        <span className="text-[12px] font-black text-emerald-400 bg-obsidian-dark/50 px-2 py-0.5 rounded shadow">{result.consensus}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Risk Intelligence Panel */}
                            <div className="glass card p-5 border-white/5 grid grid-cols-2 gap-3">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest col-span-2 flex items-center gap-2 mb-1">
                                     <RiFocus3Line/> Risk Intelligence
                                </h3>
                                <div className="bg-obsidian-dark p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Risk Level</span>
                                    <span className="text-sm font-black text-rose-500">{result.riskLevel}</span>
                                </div>
                                <div className="bg-obsidian-dark p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Spread Prob.</span>
                                    <span className="text-sm font-black text-amber-400">{result.spreadProb}</span>
                                </div>
                                <div className="bg-obsidian-dark p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Urgency</span>
                                    <span className="text-sm font-black text-rose-400">{result.urgency}</span>
                                </div>
                                <div className="bg-obsidian-dark p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Crop Impact</span>
                                    <span className="text-sm font-black text-rose-500">{result.impactScore}</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Smart Treatment Intelligence & Context Combo */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
                            
                            {/* Treatment Panel */}
                            <div className="md:col-span-7 glass card p-6 border-white/5 flex flex-col">
                                <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-5 flex items-center gap-2">
                                     <RiSyringeLine className="text-blue-400"/> Treatment Intelligence
                                </h3>
                                
                                <div className="space-y-4 flex-1">
                                    <div className="border border-rose-500/20 bg-rose-500/5 p-4 rounded-xl relative">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500 text-obsidian px-2 py-0.5 rounded shadow">Pri-0 Priority</span>
                                        </div>
                                        <p className="text-sm text-slate-300 font-medium">{result.treatment.priority}</p>
                                    </div>
                                    <div className="border border-blue-500/20 bg-blue-500/5 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <RiSparkling2Line className="text-blue-400" size={14}/>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Agro-Chemical Directive</span>
                                        </div>
                                        <p className="text-[13px] text-slate-300 font-medium leading-relaxed">{result.treatment.chemical}</p>
                                    </div>
                                    <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <RiPlantLine className="text-emerald-400" size={14}/>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Organic Alternative</span>
                                        </div>
                                        <p className="text-[13px] text-slate-300 font-medium leading-relaxed">{result.treatment.organic}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span className="flex items-center gap-1.5"><RiTimeLine className="text-amber-500 text-sm"/> Recovery Timeline</span>
                                    <span className="text-amber-400">{result.treatment.timeline}</span>
                                </div>
                            </div>

                            {/* Crop Context Panel */}
                            <div className="md:col-span-5 glass card p-6 border-white/5">
                                <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-5 flex items-center gap-2">
                                     <RiInformationFill className="text-cyan-400"/> Operational Context
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-obsidian-dark/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Detected Crop Profile</p>
                                        <p className="text-[13px] font-bold text-white tracking-wide">{result.context.crop}</p>
                                    </div>
                                    <div className="bg-obsidian-dark/50 p-3 rounded-lg border border-white/5">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Vegetative Stage</p>
                                        <p className="text-[13px] font-bold text-white tracking-wide">{result.context.stage}</p>
                                    </div>
                                    <div className="bg-obsidian-dark/50 p-3 rounded-lg border border-white/5 flex flex-col gap-1.5">
                                        <span className="flex items-center gap-2 text-xs font-bold text-slate-300"><RiCloudWindyLine className="text-blue-400"/> {result.context.weather}</span>
                                        <span className="flex items-center gap-2 text-xs font-bold text-slate-300"><RiDropLine className="text-amber-400"/> {result.context.soil}</span>
                                    </div>
                                </div>
                                {/* Secondary Actions */}
                                <div className="mt-8 space-y-2">
                                    <button 
                                        onClick={downloadReport}
                                        className="w-full py-3 rounded-xl bg-obsidian-light border border-white/10 hover:bg-white/5 text-white font-black tracking-widest uppercase flex items-center justify-center gap-2 text-[10px] transition-all"
                                    >
                                        <RiDownloadCloud2Line size={16}/> Download Report
                                    </button>
                                    <button 
                                        onClick={shareReport}
                                        className="w-full py-3 rounded-xl bg-obsidian-light border border-white/10 hover:bg-white/5 text-slate-300 font-black tracking-widest uppercase flex items-center justify-center gap-2 text-[10px] transition-all"
                                    >
                                        <RiShareForwardLine size={16}/> Share Advisory Alert
                                    </button>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass card p-10 flex flex-col justify-center h-full border-dashed border-white/10 bg-transparent relative overflow-hidden group"
                        key="placeholder"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        <div className="relative z-10 opacity-60 group-hover:opacity-100 transition-opacity flex flex-col items-center text-center">
                            <RiPlantLine size={64} className="text-slate-600 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">System Armed & Waiting</h3>
                            <p className="text-slate-400 text-sm font-medium max-w-sm mb-12">Mount a specimen in the left panel to initialize the multi-layer neural diagnostic sequence.</p>
                            
                            <div className="w-full max-w-sm space-y-4 text-left">
                                <div className="bg-obsidian border border-white/5 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500"><RiEarthLine size={20}/></div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Google Cloud Core</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Primary inference engine ready</p>
                                    </div>
                                </div>
                                <div className="bg-obsidian border border-white/5 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500"><RiShieldFlashLine size={20}/></div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Local Fallback Core</p>
                                        <p className="text-[10px] text-slate-500 font-medium">TF.js MobileNetV3 on standby</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
