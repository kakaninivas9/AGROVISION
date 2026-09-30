import React from 'react';
import { motion } from 'framer-motion';

export default function SensorCard({ value, max = 100, label, unit = "", icon: Icon, color = "#f97316", delay = 0 }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass card relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          {Icon && <Icon className="text-xl drop-shadow-md" style={{ color }} />}
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tighter" style={{ textShadow: `0 0 30px ${color}80`, color }}>
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            <span className="text-sm font-bold opacity-50" style={{ color }}>{unit}</span>
          </div>
          
          <div className="w-full h-1.5 bg-obsidian-dark/50 rounded-full mt-6 overflow-hidden relative shadow-inner">
            <div 
               className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out" 
               style={{ width: `${percentage}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            ></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
