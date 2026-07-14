import React from 'react';
import { Tag } from 'lucide-react';

export default function Deals() {
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-white flex items-center gap-4">
        <Tag className="w-10 h-10 text-[#D4FF00]" /> TODAY'S DEALS
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-black border-2 border-neutral-800 p-6 relative overflow-hidden group">
            <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-black px-3 py-1 uppercase tracking-widest z-10">
              -{(i * 15)}% OFF
            </div>
            <div className="w-full h-48 bg-neutral-900 mb-4 flex items-center justify-center overflow-hidden">
              <span className="text-neutral-700 font-black text-4xl">PROMO {i}</span>
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Deal Name {i}</h3>
            <p className="text-neutral-500 font-medium text-sm mb-4">Limited time offer on selected premium merchandise.</p>
            <button className="w-full bg-white text-black font-black uppercase tracking-widest py-3 hover:bg-[#D4FF00] transition-colors">
              Claim Deal
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
