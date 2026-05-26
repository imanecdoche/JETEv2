import React from 'react';
import { motion } from 'motion/react';

export function LoadingScreen({ message = 'Fetching data...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-[#faf8f5] flex flex-col items-center justify-center z-[9999] p-6 text-center select-none">
      {/* Background soft glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#b68c5b]/5 blur-[80px]" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#b68c5b]/5 blur-[60px]" />

      <div className="relative flex flex-col items-center max-w-xs text-center">
        {/* Animated Rings */}
        <div className="relative w-18 h-18 mb-8 flex items-center justify-center">
          {/* Inner pulsating ring */}
          <motion.div
            className="absolute rounded-full border border-[#b68c5b]/15 w-full h-full"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Center gold dot with orbit tracker */}
          <motion.div
            className="absolute rounded-full border-t-2 border-r-2 border-b-2 border-transparent border-l-2 border-l-[#b68c5b] w-12 h-12"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <div className="w-5 h-5 rounded-full bg-[#b68c5b] shadow-sm shadow-[#b68c5b]/45" />
        </div>

        {/* Brand Text */}
        <div className="space-y-1.5 z-10">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b68c5b]/80"
          >
            JEWELTRACK
          </motion.h3>
          <motion.h2 
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base font-serif font-semibold text-gray-800 tracking-tight"
          >
            {message}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.25 }}
            className="text-[11px] text-gray-500 font-medium tracking-wide"
          >
            Menyiapkan akses aman...
          </motion.p>
        </div>
      </div>
    </div>
  );
}
