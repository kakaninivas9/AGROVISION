import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-obsidian-dark flex items-center justify-center p-6 text-emerald-50 text-center font-sans">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
             className="w-full max-w-md p-8 bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10"
          >
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">!</div>
            <h1 className="text-2xl font-black mb-4">A critical error occurred.</h1>
            <p className="text-sm text-red-200/80 mb-8">{this.state.error?.message || "Something went wrong rendering this view."}</p>
            <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black uppercase text-[13px] tracking-widest hover:from-red-400 hover:to-orange-400"
            >
              Restart Platform
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
