import React, { useState } from 'react';
import { X } from 'lucide-react';
import { auth, db, googleProvider } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'buyer', // Default role for google sign in
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-black rounded-none border-2 border-white w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-6 border-b-2 border-white bg-[#D4FF00]">
          <h2 className="text-2xl font-black text-black uppercase tracking-tighter">{isLogin ? 'ACCESS ACCOUNT' : 'JOIN THE MOVEMENT'}</h2>
          <button onClick={onClose} className="text-black hover:bg-black hover:text-[#D4FF00] p-1 transition-colors border-2 border-transparent hover:border-black">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8">
          {error && (
            <div className="bg-red-500 text-white font-bold uppercase tracking-widest p-4 text-xs mb-6 border-2 border-red-700">
              ERROR: {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 text-black font-black uppercase tracking-widest py-4 border-2 border-white transition-colors flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            CONTINUE WITH GOOGLE
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-xs font-black tracking-widest uppercase">
              <span className="bg-black px-4 text-neutral-500">OR WITH EMAIL</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-neutral-400 mb-2 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border-2 border-neutral-700 focus:border-[#D4FF00] text-white px-4 py-3 outline-none transition-colors"
                placeholder="YOU@EXAMPLE.COM"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-neutral-400 mb-2 uppercase tracking-widest">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border-2 border-neutral-700 focus:border-[#D4FF00] text-white px-4 py-3 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-xs font-black text-neutral-400 mb-3 uppercase tracking-widest">Select Account Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer border-2 p-4 flex items-center justify-center transition-colors ${role === 'buyer' ? 'border-[#D4FF00] text-[#D4FF00]' : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                    <input
                      type="radio"
                      checked={role === 'buyer'}
                      onChange={() => setRole('buyer')}
                      className="hidden"
                    />
                    <span className="font-black uppercase tracking-widest text-sm">BUYER</span>
                  </label>
                  <label className={`cursor-pointer border-2 p-4 flex items-center justify-center transition-colors ${role === 'seller' ? 'border-[#D4FF00] text-[#D4FF00]' : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                    <input
                      type="radio"
                      checked={role === 'seller'}
                      onChange={() => setRole('seller')}
                      className="hidden"
                    />
                    <span className="font-black uppercase tracking-widest text-sm">SELLER</span>
                  </label>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4FF00] hover:bg-white text-black font-black uppercase tracking-widest py-4 border-2 border-transparent transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'PROCESSING...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>
          <div className="mt-8 text-center text-neutral-500 text-xs font-black uppercase tracking-widest">
            {isLogin ? "NEW TO PRIME STOCK? " : "ALREADY REGISTERED? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white hover:text-[#D4FF00] underline decoration-2 underline-offset-4 ml-2 transition-colors"
            >
              {isLogin ? 'CREATE ONE' : 'SIGN IN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
