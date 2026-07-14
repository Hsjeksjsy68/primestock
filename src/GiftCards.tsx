import React from 'react';
import { Gift } from 'lucide-react';

export default function GiftCards() {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-white flex items-center gap-4">
        <Gift className="w-10 h-10 text-[#D4FF00]" /> GIFT CARDS
      </h1>
      <div className="bg-black border-2 border-neutral-800 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 w-full aspect-video bg-neutral-900 flex items-center justify-center border border-neutral-800 relative">
          <div className="absolute top-4 left-4 text-[#D4FF00] font-black tracking-widest uppercase">PRIME STOCK</div>
          <div className="text-5xl font-black text-white">$100</div>
        </div>
        <div className="flex-1 space-y-6 w-full">
          <div>
            <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Digital Gift Card</h3>
            <p className="text-neutral-500 font-medium">Send the gift of choice directly to their inbox.</p>
          </div>
          <select className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-4 focus:border-[#D4FF00] outline-none font-bold uppercase tracking-widest">
            <option>$25 USD</option>
            <option>$50 USD</option>
            <option>$100 USD</option>
            <option>$200 USD</option>
          </select>
          <button className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors">
            Purchase Gift Card
          </button>
        </div>
      </div>
    </div>
  );
}
