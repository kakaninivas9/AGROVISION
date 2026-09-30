import React from 'react';
import { motion } from 'framer-motion';

export default function Gauge({ value, max = 100, label, icon: Icon, color = "#10b981", delay = 0 }) {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDasharray = `${(percentage / 100) * 126}, 126`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass card relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          {Icon && <Icon className="text-xl" style={{ color }} />}
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</h3>
        </div>
        <div className="relative flex flex-col items-center justify-center py-2">
          <svg viewBox="0 0 100 50" className="w-full max-w-[180px] mx-auto overflow-visible drop-shadow-2xl">
            <path d="M 10 45 A 35 35 0 0 1 90 45" stroke="rgba(255,255,255,0.03)" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path 
              d="M 10 45 A 35 35 0 0 1 90 45" 
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none" 
              strokeDasharray={strokeDasharray}
              style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
          <div className="absolute bottom-0 flex items-baseline gap-1">
            <span className="text-3xl font-black text-white tracking-tighter" style={{ textShadow: `0 0 30px ${color}A0` }}>
              {Math.round(value)}
            </span>
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
