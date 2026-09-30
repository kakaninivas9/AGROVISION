import React from 'react';
import { motion } from 'framer-motion';

export default function AlertCard({ title, message, type = "info", delay = 0 }) {
  const styles = {
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]' },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', text: 'text-emerald-400', shadow: 'shadow-[0_0_20px_rgba(16,217,129,0.1)]' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.1)]' },
    error: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-500', shadow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]' },
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay }}
      className={`p-5 rounded-2xl border-l-4 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] cursor-default
        ${currentStyle.bg} border-y border-r border-y-white/5 border-r-white/5 ${currentStyle.border} ${currentStyle.shadow}
      `}
    >
      <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${currentStyle.text}`}>{title}</h4>
      <p className="text-[13px] text-slate-300 font-medium leading-relaxed">{message}</p>
    </motion.div>
  );
}
