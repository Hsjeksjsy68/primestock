import { useState, useEffect } from "react";
import { Plus, Target, Image as ImageIcon, CheckCircle, Clock, Upload } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { compressImage } from "./utils/imageUtils";

export default function SellerAdsTab({ user }: { user: any }) {
  const [ads, setAds] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [adForm, setAdForm] = useState({ placement: 'home_front', imageUrl: '', targetUrl: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adPrice, setAdPrice] = useState(500);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'ad_pricing'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.home_front) {
            setAdPrice(data.home_front);
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'ads'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fbAds: any[] = [];
      snapshot.forEach(doc => {
        fbAds.push({ id: doc.id, ...doc.data() });
      });
      setAds(fbAds);
    });
    return () => unsubscribe();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    try {
      const base64Str = await compressImage(file);
      setAdForm(prev => ({ ...prev, imageUrl: base64Str }));
    } catch (err: any) {
      setError(`Failed to process image: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!adForm.imageUrl) {
      setError('Please provide an image for the ad.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'ads'), {
        sellerId: user.uid,
        sellerEmail: user.email,
        placement: adForm.placement,
        imageUrl: adForm.imageUrl,
        targetUrl: adForm.targetUrl,
        status: 'pending',
        cost: adPrice,
        createdAt: new Date().toISOString()
      });
      
      setSuccess(`Ad request submitted! ৳${adPrice} has been deducted from your wallet.`);
      setShowForm(false);
      setAdForm({ placement: 'home_front', imageUrl: '', targetUrl: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">ADVERTISING</h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Boost your store's visibility</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }}
          className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-white transition-colors flex items-center gap-2"
        >
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> Run New Ad</>}
        </button>
      </div>

      {success && <div className="bg-[#D4FF00]/10 border border-[#D4FF00] text-[#D4FF00] p-4 mb-6 font-bold text-sm uppercase tracking-widest">{success}</div>}
      {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mb-6 font-bold text-sm uppercase tracking-widest">{error}</div>}

      {showForm ? (
        <form onSubmit={handleSubmit} className="border border-neutral-800 p-6 bg-neutral-900 mb-8">
          <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4FF00]" /> CREATE AD CAMPAIGN
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Ad Placement</label>
              <select 
                value={adForm.placement}
                onChange={e => setAdForm({...adForm, placement: e.target.value})}
                className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none"
              >
                <option value="home_front">Home Page Front Ad (Replacing "FOR GEN-Z") - ৳{adPrice}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2 flex items-center justify-between">
                <span>Ad Image</span>
                <span className="text-neutral-500 font-normal normal-case tracking-normal">Recommended ratio: 16:9 or 21:9</span>
              </label>
              <div className="flex flex-col gap-4">
                {adForm.imageUrl && (
                  <div className="w-full max-w-sm aspect-video bg-black border border-neutral-800 overflow-hidden">
                    <img src={adForm.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative w-full max-w-sm">
                  <input 
                    type="file" 
                    accept="image/*"
                    required={!adForm.imageUrl}
                    onChange={handleImageUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingImage}
                  />
                  <div className="w-full bg-black border border-neutral-800 border-dashed text-neutral-400 px-4 py-3 flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-bold">{uploadingImage ? 'Processing...' : 'Click to upload ad image'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Target Link (Optional)</label>
              <input 
                type="url"
                value={adForm.targetUrl} 
                onChange={e => setAdForm({...adForm, targetUrl: e.target.value})} 
                className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" 
                placeholder="https://swiftshop.com/brand/your-store"
              />
              <p className="text-neutral-500 text-xs mt-2 italic">Where users go when they click the ad.</p>
            </div>

            <div className="bg-black border border-neutral-800 p-4 flex items-center justify-between">
              <span className="text-neutral-400 font-bold uppercase tracking-widest text-sm">Total Cost:</span>
              <span className="text-[#D4FF00] font-black text-xl">৳{adPrice}</span>
            </div>

            <button 
              type="submit" 
              disabled={loading || uploadingImage}
              className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : 'PAY AND SUBMIT FOR REVIEW'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          {ads.length === 0 ? (
            <div className="border border-neutral-800 p-12 text-center bg-neutral-900">
              <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">No ads created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map(ad => (
                <div key={ad.id} className="border border-neutral-800 p-4 bg-neutral-900 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-48 aspect-video bg-black shrink-0 relative border border-neutral-800 overflow-hidden">
                    <img src={ad.imageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-bold uppercase tracking-widest">{ad.placement.replace('_', ' ')}</h4>
                      {ad.status === 'approved' ? (
                        <span className="bg-[#D4FF00]/20 text-[#D4FF00] text-[10px] font-black px-2 py-1 uppercase flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Live
                        </span>
                      ) : ad.status === 'rejected' ? (
                        <span className="bg-red-500/20 text-red-500 text-[10px] font-black px-2 py-1 uppercase">
                          Rejected
                        </span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-1 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest space-y-1">
                      <p>Cost: ৳{ad.cost}</p>
                      <p>Target: {ad.targetUrl || 'None'}</p>
                      <p>Submitted: {new Date(ad.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
