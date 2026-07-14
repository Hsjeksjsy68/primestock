import React, { useState } from 'react';
import { Gift, CheckCircle } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function GiftCards({ user }: { user: any }) {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [purchasedCode, setPurchasedCode] = useState('');
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    if (!user) {
      setError("Please sign in to purchase a gift card.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = 'GC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      await addDoc(collection(db, 'gift_cards'), {
        code,
        amount,
        balance: amount,
        purchaserId: user.uid,
        purchaserEmail: user.email,
        createdAt: new Date().toISOString()
      });
      setPurchasedCode(code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-white flex items-center gap-4">
        <Gift className="w-10 h-10 text-[#D4FF00]" /> GIFT CARDS
      </h1>

      {purchasedCode ? (
        <div className="bg-[#D4FF00]/10 border-2 border-[#D4FF00] p-8 md:p-12 text-center">
          <CheckCircle className="w-16 h-16 text-[#D4FF00] mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white uppercase mb-2">Purchase Successful</h2>
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm mb-8">Your digital gift card code is ready.</p>
          <div className="bg-black border border-[#D4FF00] py-6 px-4 inline-block mx-auto mb-8 min-w-[250px]">
            <div className="text-3xl font-mono text-[#D4FF00] font-bold tracking-widest">{purchasedCode}</div>
          </div>
          <p className="text-neutral-500 italic">Please save this code. It can be used during checkout.</p>
          <button 
            onClick={() => setPurchasedCode('')}
            className="mt-8 bg-[#D4FF00] text-black font-black uppercase tracking-widest px-8 py-3 hover:bg-white transition-colors"
          >
            Buy Another
          </button>
        </div>
      ) : (
        <div className="bg-black border-2 border-neutral-800 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 w-full aspect-video bg-neutral-900 flex items-center justify-center border border-neutral-800 relative">
            <div className="absolute top-4 left-4 text-[#D4FF00] font-black tracking-widest uppercase text-xs">PRIME STOCK</div>
            <div className="text-6xl font-black text-white">$${amount}</div>
          </div>
          <div className="flex-1 space-y-6 w-full">
            <div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Digital Gift Card</h3>
              <p className="text-neutral-500 font-medium text-sm">Send the gift of choice directly to their inbox, or buy it for yourself.</p>
            </div>
            
            {error && <div className="text-red-500 font-bold p-3 bg-red-500/10 border border-red-500 text-sm">{error}</div>}

            <select 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-4 focus:border-[#D4FF00] outline-none font-bold uppercase tracking-widest"
            >
              <option value={25}>$25 USD</option>
              <option value={50}>$50 USD</option>
              <option value={100}>$100 USD</option>
              <option value={200}>$200 USD</option>
            </select>
            <button 
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : 'PURCHASE GIFT CARD'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
