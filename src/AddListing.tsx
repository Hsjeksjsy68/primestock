import React, { useState } from 'react';
import { Package, Plus, Image as ImageIcon, ArrowLeft, Upload, DollarSign, Info, Truck } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export default function AddListing({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('TOPS');
  const [customCategory, setCustomCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [sizes, setSizes] = useState('');
  const [stock, setStock] = useState('10');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [shippingFee, setShippingFee] = useState('0');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      
      await addDoc(collection(db, 'products'), {
        name,
        price: parseFloat(price),
        category: category === 'CUSTOM' ? customCategory.toUpperCase() : category,
        image: images[0] || '',
        images,
        description,
        deliveryAvailable,
        sizes: sizes ? sizes.split(',').map(s => s.trim()) : [],
        stock: parseInt(stock),
        sku,
        brand,
        shippingFee: parseFloat(shippingFee),
        sellerId: auth.currentUser.uid,
        seller: auth.currentUser.email,
        rating: 0,
        reviews: 0,
        createdAt: new Date().toISOString()
      });
      
      onBack();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 font-bold tracking-widest uppercase text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> BACK TO DASHBOARD
      </button>
      
      <div className="flex items-center gap-4 mb-8">
        <Package className="w-10 h-10 text-[#D4FF00]" />
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">ADD NEW LISTING</h1>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mb-6 text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <div className="bg-black border-2 border-neutral-800 p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-4">
            <Info className="w-5 h-5 text-[#D4FF00]" />
            <h2 className="text-xl font-black uppercase text-white tracking-widest">BASIC INFORMATION</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">PRODUCT NAME *</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Cotton T-Shirt"
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">BRAND</label>
                <input 
                  type="text" 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Nike, Custom"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">CATEGORY *</label>
                <div className="flex gap-2">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors appearance-none ${category === 'CUSTOM' ? 'w-1/3' : 'w-full'}`}
                  >
                    <option value="TOPS">TOPS</option>
                    <option value="BOTTOMS">BOTTOMS</option>
                    <option value="OUTERWEAR">OUTERWEAR</option>
                    <option value="ACCESSORIES">ACCESSORIES</option>
                    <option value="CUSTOM">CUSTOM...</option>
                  </select>
                  {category === 'CUSTOM' && (
                    <input 
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. CARD GAME"
                      className="w-2/3 bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors uppercase"
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">DESCRIPTION</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product in detail..."
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors min-h-[120px] resize-y"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-black border-2 border-neutral-800 p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-4">
            <DollarSign className="w-5 h-5 text-[#D4FF00]" />
            <h2 className="text-xl font-black uppercase text-white tracking-widest">PRICING & INVENTORY</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">PRICE (৳) *</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors font-mono"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">STOCK QUANTITY *</label>
              <input 
                type="number" 
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors font-mono"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">SKU (OPTIONAL)</label>
              <input 
                type="text" 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. TSHIRT-BLK-M"
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors font-mono text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">AVAILABLE SIZES (OPTIONAL)</label>
              <input 
                type="text" 
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="e.g. S, M, L, XL (leave blank for none)"
                className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-black border-2 border-neutral-800 p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-4">
            <ImageIcon className="w-5 h-5 text-[#D4FF00]" />
            <h2 className="text-xl font-black uppercase text-white tracking-widest">PRODUCT MEDIA</h2>
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">PRODUCT IMAGES (ADD UP TO 5) *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square w-full overflow-hidden border border-neutral-800 group">
                  <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                </div>
              ))}
            </div>
            {images.length < 5 && (
              <div className="relative border-2 border-dashed border-neutral-700 bg-neutral-900 hover:bg-neutral-800 hover:border-[#D4FF00] transition-colors p-8 text-center">
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  required={images.length === 0}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setLoading(true);
                      try {
                        const newImages = await Promise.all(
                          files.slice(0, 5 - images.length).map(compressImage)
                        );
                        setImages([...images, ...newImages]);
                      } catch (err) {
                        setError('Failed to process image(s)');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Upload className="w-8 h-8 text-neutral-500" />
                  <div>
                    <p className="text-white font-bold tracking-widest uppercase mb-1">Click to add images</p>
                    <p className="text-neutral-500 text-xs">PNG, JPG up to 5MB (Max 5)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-black border-2 border-neutral-800 p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-4">
            <Truck className="w-5 h-5 text-[#D4FF00]" />
            <h2 className="text-xl font-black uppercase text-white tracking-widest">SHIPPING DETAILS</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center bg-neutral-900 border border-neutral-800 p-4">
              <input 
                type="checkbox" 
                id="deliveryAvailable"
                checked={deliveryAvailable}
                onChange={(e) => setDeliveryAvailable(e.target.checked)}
                className="w-6 h-6 border-2 border-neutral-800 bg-black checked:bg-[#D4FF00] checked:border-[#D4FF00]"
              />
              <label htmlFor="deliveryAvailable" className="ml-4 text-sm font-black uppercase tracking-widest text-white cursor-pointer">
                NATIONWIDE DELIVERY AVAILABLE
              </label>
            </div>
            
            {deliveryAvailable && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">SHIPPING FEE (৳)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none transition-colors font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex gap-4">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 px-8 hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? 'PUBLISHING LISTING...' : <><Plus className="w-5 h-5" /> PUBLISH LISTING</>}
          </button>
          <button 
            type="button" 
            onClick={onBack}
            className="bg-neutral-900 border border-neutral-800 text-white font-black uppercase tracking-widest py-4 px-8 hover:bg-neutral-800 transition-colors"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}
