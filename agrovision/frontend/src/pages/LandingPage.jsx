import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  RiLeafLine, RiSparkling2Line, RiRadarLine, 
  RiArrowRightLine, RiShieldLine, RiCpuLine 
} from 'react-icons/ri'

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
    className="bento-card p-10 group"
  >
    <div className="w-16 h-16 rounded-2xl bg-white bg-opacity-[0.02] border border-white border-opacity-5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald group-hover:text-black transition-all duration-500">
      <Icon size={32} />
    </div>
    <h3 className="text-2xl font-display text-white mb-4">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-lg">{desc}</p>
  </motion.div>
)

export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.2], [1, 0.9]), { stiffness: 100, damping: 30 })
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div ref={containerRef} className="bg-obsidian min-h-screen selection:bg-emerald selection:text-black">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 grid-accent opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald opacity-[0.03] blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan opacity-[0.03] blur-[150px] animate-pulse-soft" />

        <motion.div style={{ scale, opacity }} className="relative z-10 text-center max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-emerald border-opacity-20 bg-emerald bg-opacity-5 text-emerald text-sm font-black tracking-widest uppercase mb-8"
          >
            <RiSparkling2Line className="animate-pulse" />
            The Future of Agriculture is Here
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-7xl md:text-9xl font-display holographic-text leading-[0.9] mb-8"
          >
            Agro<span className="text-emerald italic">Vision</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
          >
            A cinematic AI platform designed to transform local farming with 
            quantum-grade diagnostics and real-time field telemetry.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <Link to="/register" className="btn-obelisk flex items-center justify-center gap-3">
              Begin Exploration <RiArrowRightLine />
            </Link>
            <Link to="/login" className="btn-obelisk-outline flex items-center justify-center gap-3">
              Operator Login
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating Specimen (Visual Only) */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 pointer-events-none"
        >
           <RiLeafLine className="w-full h-full text-emerald" />
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section className="relative py-32 px-6 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-6xl font-display text-white mb-6 leading-tight">
                Designed for the <br /> <span className="text-emerald">Field Expert.</span>
              </h2>
              <p className="text-xl text-slate-500 font-medium">
                High-fidelity tools that bridge the gap between physical soil and digital intelligence.
              </p>
            </div>
            <div className="h-px bg-white bg-opacity-10 flex-1 hidden md:block mb-8" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={RiRadarLine}
              title="Quantum Telemetry"
              desc="Real-time sensor fusion from NodeMCU nodes directly to your operational dashboard."
              delay={0.1}
            />
            <FeatureCard 
              icon={RiLeafLine}
              title="Neural Pathology"
              desc="Proprietary CNN models combined with Gemini Vision for instant disease identification."
              delay={0.2}
            />
            <FeatureCard 
              icon={RiSparkling2Line}
              title="AgroBot Intelligence"
              desc="A Llama-3-powered expert system tailored for regional Indian agricultural nuances."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 px-6 border-t border-white border-opacity-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-24">
           <div className="flex-1">
              <motion.div 
                whileInView={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.9 }}
                className="bento-card aspect-square flex items-center justify-center p-24"
              >
                 <RiShieldLine className="w-full h-full text-emerald text-opacity-20 animate-float" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <RiCpuLine className="text-white text-opacity-40 animate-spin-slow" size={120} />
                 </div>
              </motion.div>
           </div>
           
           <div className="flex-1">
              <span className="text-emerald font-black tracking-[0.3em] uppercase text-sm mb-6 block">Field Tested Reliability</span>
              <h2 className="text-5xl font-display text-white mb-8">Zero Compromise on Data Integrity.</h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-12">
                Every pulse from your DHT22 and soil sensors is encrypted and relayed with sub-second latency. 
                Our platform ensures that even in remote village networks, your farm's digital mirror stays synchronized.
              </p>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <h4 className="text-3xl font-display text-white mb-2">99.8%</h4>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Uptime Target</p>
                 </div>
                 <div>
                    <h4 className="text-3xl font-display text-white mb-2">&lt;15ms</h4>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Local Latency</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white border-opacity-5 text-center">
        <p className="text-slate-600 text-sm font-bold tracking-widest uppercase">
          © 2026 AgroVision Obelisk Protocol — Engineered for Excellence
        </p>
      </footer>
    </div>
  )
}
