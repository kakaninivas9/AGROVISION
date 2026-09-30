import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { RiMailLine, RiLockPasswordLine, RiEyeFill, RiEyeOffFill, RiGridFill, RiArrowRightLine } from 'react-icons/ri'

export default function Login() {
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(formData.identifier, formData.password)
      if (result.success) {
        toast.success('Access Granted')
        navigate('/dashboard')
      } else {
        toast.error(result.error || 'Authentication Failed')
      }
    } catch (err) {
      toast.error('Connection Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-obsidian-dark flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_40%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md p-10 bg-obsidian-light/40 backdrop-blur-3xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10 border border-white/5"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.8 }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
          >
            <RiGridFill className="text-obsidian-dark" size={32} />
          </motion.div>
          <h1 className="text-[32px] font-black text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-emerald-500/80 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Identity Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2.5">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Identifier</label>
             <div className="relative group">
                <RiMailLine className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                 <input
                  type="text"
                  required
                  className="w-full bg-obsidian-dark/50 border border-white/5 rounded-2xl py-[18px] pl-[56px] pr-6 text-white text-[15px] focus:outline-none focus:border-emerald-500/30 focus:bg-obsidian-dark/80 transition-all placeholder:text-slate-600 font-medium font-sans"
                  placeholder="Email or Full Name"
                  value={formData.identifier}
                  onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                />
             </div>
          </div>

          <div className="space-y-2.5">
             <div className="flex justify-between items-center ml-1 pr-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Keyphrase</label>
                <span className="text-[10px] text-slate-600 hover:text-emerald-400 cursor-pointer transition-colors font-bold uppercase tracking-wider">Forgot?</span>
             </div>
             <div className="relative group">
                <RiLockPasswordLine className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-obsidian-dark/50 border border-white/5 rounded-2xl py-[18px] pl-[56px] pr-14 text-white text-[15px] focus:outline-none focus:border-emerald-500/30 focus:bg-obsidian-dark/80 transition-all placeholder:text-slate-600 font-medium font-sans tracking-wide"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? <RiEyeOffFill size={20} /> : <RiEyeFill size={20} />}
                </button>
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-[18px] mt-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-obsidian-dark font-black tracking-widest uppercase text-[13px] flex items-center justify-center gap-3 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 relative overflow-hidden"
          >
            {loading ? (
              <div className="flex gap-2">
                 <div className="w-1.5 h-1.5 bg-obsidian-dark rounded-full animate-bounce" />
                 <div className="w-1.5 h-1.5 bg-obsidian-dark rounded-full animate-bounce [animation-delay:-0.15s]" />
                 <div className="w-1.5 h-1.5 bg-obsidian-dark rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            ) : (
              <>Initialize Scan <RiArrowRightLine size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-slate-500 text-[12px] font-bold">
          New Operator?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-black tracking-wide ml-1 transition-colors">Create Protocol Account</Link>
        </p>
      </motion.div>
    </div>
  )
}
