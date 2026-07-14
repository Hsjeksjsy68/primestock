import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export default function AddProductModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('TOPS');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth.currentUser) throw new Error('Not authenticated');

      await addDoc(collection(db, 'products'), {
        name,
        price: parseFloat(price),
        category,
        image,
        sellerId: auth.currentUser.uid,
        seller: auth.currentUser.email,
        rating: 0,
        reviews: 0,
        createdAt: new Date().toISOString()
      });
      
      onClose();
      setName('');
      setPrice('');
      setImage('');
      setCategory('TOPS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border-2 border-neutral-800 p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-white">ADD LISTING</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mb-6 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">PRODUCT NAME</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">PRICE ($)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">CATEGORY</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors appearance-none"
              >
                <option value="TOPS">TOPS</option>
                <option value="BOTTOMS">BOTTOMS</option>
                <option value="OUTERWEAR">OUTERWEAR</option>
                <option value="ACCESSORIES">ACCESSORIES</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">IMAGE URL</label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input 
                type="url" 
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black border border-neutral-800 text-white pl-12 pr-4 py-3 focus:border-[#D4FF00] outline-none transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'ADDING...' : <><Plus className="w-5 h-5" /> LIST PRODUCT</>}
          </button>
        </form>
      </div>
    </div>
  );
}
