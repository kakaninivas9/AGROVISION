import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiDashboardFill, RiLeafLine, RiRobotLine, RiCloudyLine, 
  RiMoneyDollarCircleLine, RiLogoutBoxRLine, RiMenuLine, RiCloseLine,
  RiGroupLine, RiSeedlingLine, RiWifiLine
} from 'react-icons/ri'

const NAV_ITEMS = [
  { to: '/dashboard', icon: RiDashboardFill, label: 'Dashboard' },
  { to: '/field-monitoring', icon: RiWifiLine, label: 'Field Monitoring' },
  { to: '/detect',    icon: RiLeafLine,      label: 'Detect Disease' },
  { to: '/assistant', icon: RiRobotLine,     label: 'AI Assistant' },
  { to: '/weather',   icon: RiCloudyLine,    label: 'Weather Risk' },
  { to: '/income',    icon: RiMoneyDollarCircleLine, label: 'Income Advisor' },
  { to: '/schemes',   icon: RiSeedlingLine,  label: 'Govt Schemes' },
  { to: '/community', icon: RiGroupLine,     label: 'Community' },
]

export default function DashboardLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const { logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout-grid">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full h-16 bg-obsidian-dark/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-obsidian-dark shadow-glow-green-sm">
            <RiLeafLine size={18} />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">AgroVision</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 p-2 hover:text-white transition-colors">
          {isOpen ? <RiCloseLine size={24} /> : <RiMenuLine size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        sidebar transform transition-transform duration-500 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="hidden lg:flex items-center gap-3 mb-8 px-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-emerald-500 rounded-[10px] flex items-center justify-center shadow-glow-green-sm text-obsidian-dark"
          >
            <RiLeafLine size={22} className="opacity-90" />
          </motion.div>
          <div>
            <span className="block font-bold text-[17px] text-white tracking-tight">AgroVision</span>
            <span className="block text-[10px] text-emerald-500/80 font-medium">AI Agriculture Platform</span>
          </div>
        </div>

        {/* Nav Grid */}
        <nav className="flex-1 flex flex-col gap-1.5 mt-4 lg:mt-0">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} className={isActive ? 'text-emerald-400' : 'text-gray-500'} />
                <span className="text-[13px] font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Session */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="relative group cursor-pointer">
               <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'K'}
               </div>
               <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-obsidian" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">{user?.name || 'Kakani Sai Nivas'}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || 'sainivas549@gmail.com'}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 border border-transparent"
          >
            <RiLogoutBoxRLine size={18} />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="main-content relative pt-20 lg:pt-8 w-full">
        <div className="max-w-[1600px] w-full mx-auto relative z-10 min-h-full">
          {children}
        </div>
      </main>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-obsidian-dark/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
