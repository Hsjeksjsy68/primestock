import { useState } from "react";
import { Upload, Save } from 'lucide-react';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { compressImage } from "./utils/imageUtils";

export default function SellerSettingsTab({ user, sellerProfile }: { user: any, sellerProfile: any }) {
  const [formData, setFormData] = useState({
    logo: sellerProfile.logo || '',
    banner: sellerProfile.banner || '',
    chargeDelivery: sellerProfile.chargeDelivery ?? true,
    deliveryCharge: sellerProfile.deliveryCharge || 50,
    allowCOD: sellerProfile.allowCOD ?? true,
  });
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64Str = await compressImage(file);
      setFormData(prev => ({ ...prev, [field]: base64Str }));
    } catch (err) {
      console.error("Failed to process image", err);
      alert("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        sellerProfile: {
          ...sellerProfile,
          ...formData
        }
      });
      setMessage('Store settings updated successfully!');
    } catch (error) {
      console.error(error);
      setMessage('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">STORE SETTINGS</h2>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Manage your brand store appearance and policies</p>
      </div>

      {message && (
        <div className="bg-[#D4FF00]/10 border border-[#D4FF00] text-[#D4FF00] p-4 mb-6 font-bold text-sm uppercase tracking-widest">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
        <div className="bg-black border border-neutral-800 p-6 sm:p-8 space-y-6">
          <h3 className="text-xl font-black uppercase text-white tracking-widest border-b border-neutral-800 pb-4">STORE APPEARANCE</h3>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Store Logo</label>
            <div className="flex items-center gap-4">
              {formData.logo && (
                <div className="w-24 h-24 bg-neutral-900 border border-neutral-800 overflow-hidden rounded-full shrink-0">
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative flex-1">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleImageUpload(e, 'logo')} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="w-full bg-neutral-900 border border-neutral-800 border-dashed text-neutral-400 px-4 py-4 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-bold">{uploading ? 'Processing...' : 'Upload Logo'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Store Banner Background</label>
            <div className="flex flex-col gap-4">
              {formData.banner && (
                <div className="w-full aspect-[3/1] bg-neutral-900 border border-neutral-800 overflow-hidden">
                  <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative w-full">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => handleImageUpload(e, 'banner')} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="w-full bg-neutral-900 border border-neutral-800 border-dashed text-neutral-400 px-4 py-4 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-bold">{uploading ? 'Processing...' : 'Upload Banner'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black border border-neutral-800 p-6 sm:p-8 space-y-6">
          <h3 className="text-xl font-black uppercase text-white tracking-widest border-b border-neutral-800 pb-4">STORE POLICIES & DELIVERY</h3>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="chargeDelivery"
              checked={formData.chargeDelivery}
              onChange={e => setFormData({...formData, chargeDelivery: e.target.checked})}
              className="w-5 h-5 accent-[#D4FF00] bg-black border-neutral-800"
            />
            <label htmlFor="chargeDelivery" className="ml-4 text-sm font-black uppercase tracking-widest text-white cursor-pointer">
              Charge Delivery Fee
            </label>
          </div>

          {formData.chargeDelivery && (
            <div className="ml-9">
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Default Delivery Charge (৳)</label>
              <input 
                type="number" 
                value={formData.deliveryCharge}
                onChange={e => setFormData({...formData, deliveryCharge: Number(e.target.value)})}
                className="w-full max-w-xs bg-neutral-900 border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none"
              />
            </div>
          )}

          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="allowCOD"
              checked={formData.allowCOD}
              onChange={e => setFormData({...formData, allowCOD: e.target.checked})}
              className="w-5 h-5 accent-[#D4FF00] bg-black border-neutral-800"
            />
            <label htmlFor="allowCOD" className="ml-4 text-sm font-black uppercase tracking-widest text-white cursor-pointer">
              Allow Cash on Delivery (COD)
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={uploading || saving}
          className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>
      </form>
    </div>
  );
}
