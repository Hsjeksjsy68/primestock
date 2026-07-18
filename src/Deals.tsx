import { useState, useEffect } from "react";
import { Tag } from 'lucide-react';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Deals() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      const fbCampaigns: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.active) {
          fbCampaigns.push({ id: doc.id, ...data });
        }
      });
      setCampaigns(fbCampaigns);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-white flex items-center gap-4">
        <Tag className="w-10 h-10 text-[#D4FF00]" /> ACTIVE CAMPAIGNS
      </h1>

      {loading ? (
        <div className="text-center py-20 text-neutral-500 font-bold uppercase tracking-widest text-sm">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 p-12 text-center text-neutral-400 font-bold uppercase tracking-widest text-sm">
          No active campaigns right now. Check back later!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map(camp => (
            <div key={camp.id} className="bg-black border-2 border-neutral-800 relative overflow-hidden group flex flex-col h-full">
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-black px-3 py-1 uppercase tracking-widest z-10">
                -{camp.discountPercentage}% OFF
              </div>
              <div className="w-full h-48 bg-neutral-900 flex items-center justify-center overflow-hidden">
                {camp.bannerUrl ? (
                  <img src={camp.bannerUrl} alt={camp.name} className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                ) : (
                  <span className="text-neutral-700 font-black text-4xl">{camp.name}</span>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tighter mb-2">{camp.name}</h3>
                  <p className="text-neutral-500 font-medium text-sm mb-4">Limited time promotional campaign. Save {camp.discountPercentage}% on selected products.</p>
                </div>
                <button className="w-full bg-white text-black font-black uppercase tracking-widest py-3 hover:bg-[#D4FF00] transition-colors mt-auto">
                  Claim Deal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
