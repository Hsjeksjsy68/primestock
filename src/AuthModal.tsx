import React, { useState } from 'react';
import { X } from 'lucide-react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          role,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">{isLogin ? 'Sign In' : 'Create Account'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
                placeholder="••••••••"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">I want to</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={role === 'buyer'}
                      onChange={() => setRole('buyer')}
                      className="text-[#D4FF00] focus:ring-[#D4FF00] bg-neutral-800 border-neutral-700"
                    />
                    <span className="text-neutral-300">Buy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={role === 'seller'}
                      onChange={() => setRole('seller')}
                      className="text-[#D4FF00] focus:ring-[#D4FF00] bg-neutral-800 border-neutral-700"
                    />
                    <span className="text-neutral-300">Sell</span>
                  </label>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4FF00] hover:bg-white text-neutral-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center text-neutral-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#D4FF00] hover:underline font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
