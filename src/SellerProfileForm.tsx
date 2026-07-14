import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export default function SellerProfileForm({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    tradeLicense: '',
    nid: '',
    phone: '',
    officeAddress: '',
    shopName: '',
    shopLocation: '',
    sellerEmail: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) throw new Error("Not authenticated");
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        sellerProfile: formData
      });
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black border-2 border-neutral-800 p-8 max-w-2xl mx-auto animate-in fade-in">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">SELLER VERIFICATION</h2>
      <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm mb-8">
        Please provide required business information to start selling
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mb-6 text-sm font-bold uppercase">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Shop/Brand Name</label>
            <input required name="shopName" value={formData.shopName} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Trade License No.</label>
            <input required name="tradeLicense" value={formData.tradeLicense} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">NID / Birth Certificate</label>
            <input required name="nid" value={formData.nid} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Phone Number</label>
            <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Seller Email</label>
            <input required type="email" name="sellerEmail" value={formData.sellerEmail} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Office Address</label>
            <input required name="officeAddress" value={formData.officeAddress} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Shop/Brand Location</label>
            <input required name="shopLocation" value={formData.shopLocation} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 mt-8 hover:bg-white transition-colors disabled:opacity-50">
          {loading ? 'SUBMITTING...' : 'SUBMIT VERIFICATION'}
        </button>
      </form>
    </div>
  );
}
