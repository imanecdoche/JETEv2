import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';
import Rupiah from './Rupiah';

interface SuccessOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sell' | 'terima';
  customerName: string;
  totalGram: number;
  totalPrice: number;
}

// Sparkle element helper
interface SparkleProps {
  delay: number;
  angle: number;
  distance: number;
  duration: number;
  key?: any;
}

function Sparkle({ delay, angle, distance, duration }: SparkleProps) {
  const radian = (angle * Math.PI) / 180;
  const targetX = Math.cos(radian) * distance;
  const targetY = Math.sin(radian) * distance;

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
      animate={{
        x: targetX,
        y: targetY,
        scale: [0, 1, 1, 0],
        opacity: [0, 1, 1, 0]
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
      className="absolute w-2.5 h-2.5 bg-[#b68c5b] rounded-full"
      style={{
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
      }}
    />
  );
}

export default function SuccessOverlay({
  isOpen,
  onClose,
  type,
  customerName,
  totalGram,
  totalPrice
}: SuccessOverlayProps) {
  useEffect(() => {
    if (isOpen) {
      // Play a delightful luxury success chime
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 string
          gain1.gain.setValueAtTime(0, ctx.currentTime);
          gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 string
          gain2.gain.setValueAtTime(0, ctx.currentTime);
          gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
          
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 1.5);
          
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 1.8);
        }
      } catch (err) {
        console.warn('Audio feedback autoplay was blocked by policy.', err);
      }

      // Auto dismiss / continue after 4.5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  // Generate 12 sparkle stars in a polar distribution
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    angle: i * 30 + Math.random() * 10,
    distance: 45 + Math.random() * 20,
    delay: Math.random() * 0.15,
    duration: 0.8 + Math.random() * 0.4
  }));

  const svgVariants = {
    hidden: { rotate: -15, scale: 0.8, opacity: 0 },
    visible: {
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }
    }
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut', delay: 0.45 }
    }
  };

  const ringVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur/darken */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2c2a29]/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            {/* Success Card container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-gray-100 flex flex-col p-6 text-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Checkmark, rings, and sparkling stars */}
              <div className="relative h-32 flex items-center justify-center mb-6">
                
                {/* Outermost ambient ring */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.4, 1.6], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, ease: 'easeOut' }}
                  className="absolute w-24 h-24 rounded-full border border-[#b68c5b]/30"
                />

                {/* Inner ripple animation */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.25, 1.45], opacity: [0, 0.4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8, ease: 'easeOut', delay: 0.3 }}
                  className="absolute w-24 h-24 rounded-full border border-[#b68c5b]/15"
                />

                {/* Sparkling gold particles */}
                {sparkles.map((s, idx) => (
                  <Sparkle key={idx} delay={s.delay} angle={s.angle} distance={s.distance} duration={s.duration} />
                ))}

                {/* Golden Animated Checkmark Circle */}
                <motion.div
                  variants={ringVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative w-22 h-22 rounded-full bg-[#fcfaf7] border border-[#b68c5b]/20 shadow-inner flex items-center justify-center text-[#b68c5b]"
                >
                  <motion.svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 80 80"
                    variants={svgVariants}
                    initial="hidden"
                    animate="visible"
                    className="absolute w-12 h-12"
                  >
                    <motion.path
                      d="M23 41 L34 51 L56 28"
                      fill="none"
                      stroke="#b68c5b"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      variants={pathVariants}
                    />
                  </motion.svg>
                </motion.div>
              </div>

              {/* Success title with elegant header typography */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="font-serif font-bold text-xl text-gray-800 tracking-tight"
              >
                Transaksi Berhasil!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="text-xs text-gray-400 mt-1 font-medium font-sans px-4"
              >
                Tanda terima dan berat Logam Mulia telah terverifikasi secara aman di sistem.
              </motion.p>

              {/* Detail list card with clean, gold-rimmed borders */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="mt-5 bg-[#fcfaf7] rounded-2xl border border-gray-100 p-4 text-left divide-y divide-gray-100/60"
              >
                <div className="pb-3 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Tipe Transaksi</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                    type === 'terima' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    {type === 'terima' ? 'Terima Masuk' : 'Beli / Sell'}
                  </span>
                </div>

                <div className="py-2.5 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">No. HP / Customer</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700">{customerName}</p>
                  </div>
                </div>

                <div className="py-2.5 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Total Berat</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{totalGram.toFixed(2)} gram</span>
                </div>

                <div className="pt-2.5 flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium font-sans">Total Nilai</span>
                  <Rupiah value={totalPrice} classNameValue="text-base" classNameRp="text-[0.8em] opacity-70 font-normal" />
                </div>
              </motion.div>

              {/* Positive reinforcement message or confirmation CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="mt-6 space-y-3"
              >
                <button
                  onClick={onClose}
                  className="w-full bg-[#b68c5b] hover:bg-[#a07a4f] active:scale-98 text-white py-3.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-[#b68c5b]/20 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer pointer-events-auto"
                >
                  Lanjutkan <ArrowRight size={14} />
                </button>
                <p className="text-[10px] text-gray-400/80 font-medium animate-pulse">
                  Mengalihkan halaman dalam 5 detik
                </p>
              </motion.div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
