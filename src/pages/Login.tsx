import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Loader2, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, isFirebasePlaceholder } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function LoginScreen() {
  const { setCurrentUser } = useApp();
  const { t } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isFirebasePlaceholder) {
      setError('Firebase is not configured yet. Please enter your name and use the "Continue Offline" button to start tracking your sales locally.');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.name });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please enable it in the console.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLocal = () => {
    const localName = formData.name.trim() || 'Store Staff';
    localStorage.setItem('jeweltrack_storage_mode', 'local');
    setCurrentUser({
      id: 'local_staff',
      name: localName,
      role: 'owner',
      email: 'local@jeweltrack.com'
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-gray-800 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <h1 className="text-5xl font-serif text-[#b68c5b] tracking-tight mb-2">JewelTrack</h1>
          <p className="text-sm font-medium tracking-widest text-[#b68c5b]/60 uppercase">Cloud Sync System</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-[#b68c5b]/5 border border-gray-100 animate-in zoom-in duration-500">
          <h2 className="text-2xl font-serif mb-8 text-center text-gray-800">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full bg-gray-50 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#b68c5b]/20 transition-all border border-transparent focus:border-[#b68c5b]/20"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                placeholder="Email Address"
                className="w-full bg-gray-50 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#b68c5b]/20 transition-all border border-transparent focus:border-[#b68c5b]/20"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full bg-gray-50 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#b68c5b]/20 transition-all border border-transparent focus:border-[#b68c5b]/20"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in shake duration-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#b68c5b] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#b68c5b]/20 hover:bg-[#a07b4f] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isRegistering ? (
                <>
                  <UserPlus size={20} /> Register
                </>
              ) : (
                <>
                  <LogIn size={20} /> Sign In
                </>
              )}
            </button>

            <div className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 py-3 select-none">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span>OR</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            <button
              type="button"
              onClick={handleContinueLocal}
              className="w-full bg-emerald-50 border border-emerald-100/40 text-emerald-800 py-4 rounded-2xl font-bold text-base hover:bg-emerald-100/35 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Database size={18} className="text-emerald-700" /> Continue Offline
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-medium text-gray-500 hover:text-[#b68c5b] transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest opacity-50">
          Powered by JewelTrack Security
        </div>
      </div>
    </div>
  );
}
