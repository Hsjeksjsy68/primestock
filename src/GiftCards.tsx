import { useState, useEffect } from "react";
import { Gift, CheckCircle } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';

export default function GiftCards({ user }: { user: any }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [purchasedCode, setPurchasedCode] = useState('');
  const [error, setError] = useState('');

  const [claimCode, setClaimCode] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'gift_card_templates'), (snapshot) => {
      const fbTemplates: any[] = [];
      snapshot.forEach(doc => fbTemplates.push({ id: doc.id, ...doc.data() }));
      setTemplates(fbTemplates);
      if (fbTemplates.length > 0) {
        setSelectedTemplate(fbTemplates[0]);
        setAmount(fbTemplates[0].value);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleTemplateChange = (e: any) => {
    const t = templates.find(t => t.id === e.target.value);
    if (t) {
      setSelectedTemplate(t);
      setAmount(t.value);
    }
  };

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
        amount: selectedTemplate ? selectedTemplate.value : amount,
        balance: selectedTemplate ? selectedTemplate.value : amount,
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

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setClaimMessage({ text: "Please sign in to claim a gift card.", type: 'error' });
      return;
    }
    if (!claimCode.trim()) {
      setClaimMessage({ text: "Please enter a valid gift card code.", type: 'error' });
      return;
    }

    setClaimLoading(true);
    setClaimMessage({ text: '', type: '' });

    try {
      const q = query(collection(db, 'gift_cards'), where('code', '==', claimCode.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setClaimMessage({ text: "Invalid gift card code.", type: 'error' });
        return;
      }
      
      const gcDoc = snapshot.docs[0];
      const gcData = gcDoc.data();
      
      if (gcData.balance <= 0 || gcData.claimedBy) {
        setClaimMessage({ text: "This gift card has already been claimed or has zero balance.", type: 'error' });
        return;
      }
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.exists() && userSnap.data().walletBalance ? userSnap.data().walletBalance : 0;
      
      await setDoc(userRef, { walletBalance: currentBalance + gcData.balance }, { merge: true });
      
      await updateDoc(doc(db, 'gift_cards', gcDoc.id), { balance: 0, claimedBy: user.uid, claimedAt: new Date().toISOString() });
      
      setClaimMessage({ text: `Successfully claimed ৳${gcData.balance} to your wallet!`, type: 'success' });
      setClaimCode('');
    } catch (err: any) {
      setClaimMessage({ text: err.message, type: 'error' });
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-white flex items-center gap-4">
        <Gift className="w-10 h-10 text-[#D4FF00]" /> GIFT CARDS
      </h1>

      {purchasedCode ? (
        <div className="bg-[#D4FF00]/10 border-2 border-[#D4FF00] p-8 md:p-12 text-center mb-12">
          <CheckCircle className="w-16 h-16 text-[#D4FF00] mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white uppercase mb-2">Purchase Successful</h2>
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm mb-8">Your digital gift card code is ready.</p>
          <div className="bg-black border border-[#D4FF00] py-6 px-4 inline-block mx-auto mb-8 min-w-[250px]">
            <div className="text-3xl font-mono text-[#D4FF00] font-bold tracking-widest">{purchasedCode}</div>
          </div>
          <p className="text-neutral-500 italic">Please save this code. It can be used during checkout or claimed to your wallet.</p>
          <button 
            onClick={() => setPurchasedCode('')}
            className="mt-8 bg-[#D4FF00] text-black font-black uppercase tracking-widest px-8 py-3 hover:bg-white transition-colors"
          >
            Buy Another
          </button>
        </div>
      ) : (
        <div className="bg-black border-2 border-neutral-800 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center mb-12">
          <div className="flex-1 w-full aspect-video bg-neutral-900 flex items-center justify-center border border-neutral-800 relative overflow-hidden">
            {selectedTemplate && selectedTemplate.imageUrl ? (
              <img src={selectedTemplate.imageUrl} alt={selectedTemplate.name} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-40" />
            ) : null}
            <div className="absolute top-4 left-4 text-[#D4FF00] font-black tracking-widest uppercase text-xs">PRIME STOCK</div>
            <div className="text-6xl font-black text-white relative z-10">
              ৳{selectedTemplate ? selectedTemplate.value : amount}
            </div>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Digital Gift Card</h3>
              <p className="text-neutral-500 font-medium text-sm">Send the gift of choice directly to their inbox, or buy it for yourself.</p>
            </div>
            
            {error && <div className="text-red-500 font-bold p-3 bg-red-500/10 border border-red-500 text-sm">{error}</div>}

            {templates.length > 0 ? (
              <select 
                value={selectedTemplate?.id || ''}
                onChange={handleTemplateChange}
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-4 focus:border-[#D4FF00] outline-none font-bold uppercase tracking-widest"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} - ৳{t.price} (Value: ৳{t.value})</option>
                ))}
              </select>
            ) : (
              <select 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-4 focus:border-[#D4FF00] outline-none font-bold uppercase tracking-widest"
              >
                <option value={25}>৳2,125 BDT</option>
                <option value={50}>৳4,250 BDT</option>
                <option value={100}>৳8,500 BDT</option>
                <option value={200}>৳17,000 BDT</option>
              </select>
            )}

            <button 
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : `PURCHASE FOR ৳${selectedTemplate ? selectedTemplate.price : (amount * 85)}`}
            </button>
          </div>
        </div>
      )}

      {/* Claim Section */}
      <div className="bg-black border-2 border-neutral-800 p-8 md:p-12">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">REDEEM GIFT CARD</h3>
        <p className="text-neutral-400 font-medium text-sm mb-6">Enter your gift card code below to add the balance to your store wallet.</p>
        
        {claimMessage.text && (
          <div className={`p-4 mb-6 font-bold text-sm uppercase tracking-widest ${claimMessage.type === 'error' ? 'bg-red-500/10 border border-red-500 text-red-500' : 'bg-[#D4FF00]/10 border border-[#D4FF00] text-[#D4FF00]'}`}>
            {claimMessage.text}
          </div>
        )}

        <form onSubmit={handleClaim} className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={claimCode}
            onChange={e => setClaimCode(e.target.value)}
            placeholder="ENTER GIFT CARD CODE (e.g. GC-XXXXXX)"
            className="flex-1 bg-neutral-900 border border-neutral-800 text-white px-6 py-4 focus:border-[#D4FF00] outline-none font-bold uppercase tracking-widest"
          />
          <button 
            type="submit"
            disabled={claimLoading}
            className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 px-12 hover:bg-white transition-colors disabled:opacity-50"
          >
            {claimLoading ? 'VERIFYING...' : 'CLAIM NOW'}
          </button>
        </form>
      </div>
    </div>
  );
}
