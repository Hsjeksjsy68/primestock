import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export default function CustomerService() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'return',
    orderId: '',
    reason: '',
    details: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!auth.currentUser) throw new Error("Please log in to submit a request.");
      await addDoc(collection(db, 'support_requests'), {
        ...formData,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setFormData({ type: 'return', orderId: '', reason: '', details: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">CUSTOMER SERVICE</h1>
      <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm mb-12">
        Returns, complaints, and general support
      </p>

      {success ? (
        <div className="bg-[#D4FF00]/10 border-2 border-[#D4FF00] p-8 text-center">
          <h2 className="text-2xl font-black text-[#D4FF00] uppercase mb-2">Request Submitted</h2>
          <p className="text-white">Our management team or the seller will contact you shortly.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-6 bg-[#D4FF00] text-black font-black uppercase px-6 py-3 hover:bg-white transition-colors"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 font-bold p-4 bg-red-500/10 border border-red-500">{error}</div>}
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Request Type</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none"
            >
              <option value="return">Return Product to Seller</option>
              <option value="complain_seller">Complain about a Seller</option>
              <option value="general">General Prime Stock Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Order ID (if applicable)</label>
            <input 
              type="text" 
              value={formData.orderId}
              onChange={(e) => setFormData({...formData, orderId: e.target.value})}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Reason</label>
            <input 
              required
              type="text" 
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Details</label>
            <textarea 
              required
              rows={5}
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
          </button>
        </form>
      )}
    </div>
  );
}
