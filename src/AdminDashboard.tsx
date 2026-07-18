import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { compressImage } from "./utils/imageUtils";
import { Upload } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"sellers" | "support" | "campaigns" | "gift-cards" | "ads">("sellers");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [adPricing, setAdPricing] = useState({ home_front: 500 });
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', discountPercentage: '', bannerUrl: '' });
  
  const [showGiftCardForm, setShowGiftCardForm] = useState(false);
  const [giftCardForm, setGiftCardForm] = useState({ name: '', value: '', price: '', imageUrl: '' });

  // Prime Stock Ad
  const [showPrimeAdForm, setShowPrimeAdForm] = useState(false);
  const [primeAdForm, setPrimeAdForm] = useState({ imageUrl: '', targetUrl: '' });

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fbUsers: any[] = [];
      snapshot.forEach(doc => {
        fbUsers.push({ id: doc.id, ...doc.data() });
      });
      setUsers(fbUsers);
    });
    const unsubscribeSupport = onSnapshot(collection(db, 'support_requests'), (snapshot) => {
      const fbRequests: any[] = [];
      snapshot.forEach(doc => {
        fbRequests.push({ id: doc.id, ...doc.data() });
      });
      setSupportRequests(fbRequests);
      setLoading(false);
    });
    const unsubscribeCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      const fbCampaigns: any[] = [];
      snapshot.forEach(doc => fbCampaigns.push({ id: doc.id, ...doc.data() }));
      setCampaigns(fbCampaigns);
    });
    const unsubscribeGiftCards = onSnapshot(collection(db, 'gift_card_templates'), (snapshot) => {
      const fbGiftCards: any[] = [];
      snapshot.forEach(doc => fbGiftCards.push({ id: doc.id, ...doc.data() }));
      setGiftCards(fbGiftCards);
    });
    const unsubscribeAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const fbAds: any[] = [];
      snapshot.forEach(doc => fbAds.push({ id: doc.id, ...doc.data() }));
      setAds(fbAds);
    });
    
    // Fetch ad pricing
    const fetchPricing = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'ad_pricing'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.home_front) {
            setAdPricing({ home_front: data.home_front });
          }
        }
      } catch (err) {
        console.error("Error fetching ad pricing", err);
      }
    };
    fetchPricing();

    return () => {
      unsubscribeUsers();
      unsubscribeSupport();
      unsubscribeCampaigns();
      unsubscribeGiftCards();
      unsubscribeAds();
    };
  }, []);

  const handleApprove = async (userId: string, profile: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'seller',
        sellerProfile: {
          ...profile,
          status: 'approved'
        }
      });
      await addDoc(collection(db, 'seller_approvals'), {
        userId,
        shopName: profile.shopName,
        action: 'approved',
        timestamp: new Date().toISOString(),
        adminEmail: 'admin-001@primestock.com'
      });
    } catch (err) {
      console.error(err);
      alert("Error approving seller");
    }
  };

  const handleReject = async (userId: string, profile: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        sellerProfile: {
          ...profile,
          status: 'rejected'
        }
      });
      await addDoc(collection(db, 'seller_approvals'), {
        userId,
        shopName: profile.shopName,
        action: 'rejected',
        timestamp: new Date().toISOString(),
        adminEmail: 'admin-001@primestock.com'
      });
    } catch (err) {
      console.error(err);
      alert("Error rejecting seller");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.bannerUrl) {
      alert("Please upload a banner image");
      return;
    }
    try {
      await addDoc(collection(db, 'campaigns'), {
        name: campaignForm.name,
        discountPercentage: Number(campaignForm.discountPercentage),
        bannerUrl: campaignForm.bannerUrl,
        active: true,
        createdAt: new Date().toISOString()
      });
      setCampaignForm({ name: '', discountPercentage: '', bannerUrl: '' });
      setShowCampaignForm(false);
    } catch (err) {
      console.error(err);
      alert("Error creating campaign");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if(confirm("Delete this campaign?")) {
      await deleteDoc(doc(db, 'campaigns', id));
    }
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCardForm.imageUrl) {
      alert("Please upload a gift card image");
      return;
    }
    try {
      await addDoc(collection(db, 'gift_card_templates'), {
        name: giftCardForm.name,
        value: Number(giftCardForm.value),
        price: Number(giftCardForm.price),
        imageUrl: giftCardForm.imageUrl,
        active: true,
        createdAt: new Date().toISOString()
      });
      setGiftCardForm({ name: '', value: '', price: '', imageUrl: '' });
      setShowGiftCardForm(false);
    } catch (err) {
      console.error(err);
      alert("Error creating gift card");
    }
  };

  const handleDeleteGiftCard = async (id: string) => {
    if(confirm("Delete this gift card?")) {
      await deleteDoc(doc(db, 'gift_card_templates', id));
    }
  };
  
  const handleUpdateAdPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPrice(true);
    try {
      await setDoc(doc(db, 'settings', 'ad_pricing'), { home_front: Number(adPricing.home_front) }, { merge: true });
      alert("Ad pricing updated successfully.");
    } catch(err) {
      console.error(err);
      alert("Error updating ad pricing.");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleUpdateAdStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'ads', id), { status });
    } catch (err) {
      console.error(err);
      alert("Error updating ad status");
    }
  };
  
  const handleDeleteAd = async (id: string) => {
    if(confirm("Are you sure you want to delete this ad?")) {
      await deleteDoc(doc(db, 'ads', id));
    }
  };

  const handleCreatePrimeAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primeAdForm.imageUrl) {
      alert("Please upload an ad image");
      return;
    }
    try {
      await addDoc(collection(db, 'ads'), {
        sellerId: 'admin',
        sellerEmail: 'admin@primestock.com',
        placement: 'home_front',
        imageUrl: primeAdForm.imageUrl,
        targetUrl: primeAdForm.targetUrl,
        status: 'approved',
        cost: 0,
        createdAt: new Date().toISOString()
      });
      setShowPrimeAdForm(false);
      setPrimeAdForm({ imageUrl: '', targetUrl: '' });
      alert("Prime Stock Ad created successfully.");
    } catch(err) {
      console.error(err);
      alert("Error creating Prime Stock ad.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: any, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const base64Str = await compressImage(file);
      setter((prev: any) => ({ ...prev, [field]: base64Str }));
    } catch (err) {
      console.error("Failed to process image", err);
      alert("Failed to process image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="text-white text-center p-12">Loading...</div>;

  const pendingSellers = users.filter(u => u.sellerProfile?.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-white">ADMIN DASHBOARD</h1>
      
      <div className="flex border-b-2 border-neutral-800 bg-neutral-900 px-6 sm:px-8 mb-8 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("sellers")}
          className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "sellers" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          Sellers
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "support" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          Support
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "campaigns" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab("gift-cards")}
          className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "gift-cards" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          Gift Cards
        </button>
        <button
          onClick={() => setActiveTab("ads")}
          className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === "ads" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          Ads Management
        </button>
      </div>

      {activeTab === "sellers" && (
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8 mb-8 animate-in fade-in duration-300">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">PENDING SELLER APPROVALS</h2>
          
          {pendingSellers.length === 0 ? (
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No pending seller applications.</p>
          ) : (
            <div className="space-y-6">
              {pendingSellers.map(user => (
                <div key={user.id} className="border border-neutral-800 p-6 bg-neutral-900 flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <h3 className="text-[#D4FF00] font-black uppercase text-xl mb-2">{user.sellerProfile.shopName}</h3>
                    <div className="space-y-1 text-sm text-neutral-300">
                      <p><span className="font-bold text-neutral-500">Email:</span> {user.email}</p>
                      <p><span className="font-bold text-neutral-500">Seller Email:</span> {user.sellerProfile.sellerEmail}</p>
                      <p><span className="font-bold text-neutral-500">Phone:</span> {user.sellerProfile.phone}</p>
                      <p><span className="font-bold text-neutral-500">Trade License:</span> {user.sellerProfile.tradeLicense}</p>
                      <p><span className="font-bold text-neutral-500">NID:</span> {user.sellerProfile.nid}</p>
                      <p><span className="font-bold text-neutral-500">Location:</span> {user.sellerProfile.shopLocation}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 min-w-[150px]">
                    <button 
                      onClick={() => handleApprove(user.id, user.sellerProfile)}
                      className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-3 px-6 hover:bg-white transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(user.id, user.sellerProfile)}
                      className="bg-red-500 text-white font-black uppercase tracking-widest py-3 px-6 hover:bg-red-400 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "support" && (
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8 animate-in fade-in duration-300">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">CUSTOMER SUPPORT REQUESTS</h2>
          {supportRequests.length === 0 ? (
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No support requests.</p>
          ) : (
            <div className="space-y-6">
              {supportRequests.map(req => (
                <div key={req.id} className="border border-neutral-800 p-6 bg-neutral-900">
                  <div className="flex justify-between items-start mb-4 border-b border-neutral-800 pb-4">
                    <div>
                      <span className="bg-[#D4FF00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-2 inline-block">
                        {req.type.replace('_', ' ')}
                      </span>
                      <h3 className="text-white font-bold">{req.userEmail}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-500 font-black uppercase tracking-widest mb-1">ORDER ID</div>
                      <div className="text-white font-mono text-sm">{req.orderId || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p><strong className="text-neutral-400">Reason:</strong> <span className="text-white">{req.reason}</span></p>
                    <p><strong className="text-neutral-400">Details:</strong> <span className="text-neutral-300">{req.details}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">CAMPAIGN MANAGEMENT</h2>
            <button 
              onClick={() => setShowCampaignForm(!showCampaignForm)}
              className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-white transition-colors"
            >
              {showCampaignForm ? 'Cancel' : 'Create Campaign'}
            </button>
          </div>

          {showCampaignForm && (
            <form onSubmit={handleCreateCampaign} className="mb-8 border border-neutral-800 p-6 bg-neutral-900 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Campaign Name</label>
                <input required value={campaignForm.name} onChange={e => setCampaignForm({...campaignForm, name: e.target.value})} className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Discount Percentage (%)</label>
                <input required type="number" value={campaignForm.discountPercentage} onChange={e => setCampaignForm({...campaignForm, discountPercentage: e.target.value})} className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Banner Image</label>
                <div className="flex flex-col gap-4">
                  {campaignForm.bannerUrl && (
                    <div className="w-full h-32 bg-black border border-neutral-800 overflow-hidden">
                      <img src={campaignForm.bannerUrl} alt="Banner preview" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                  <div className="relative w-full">
                    <input 
                      type="file" 
                      accept="image/*"
                      required={!campaignForm.bannerUrl}
                      onChange={e => handleImageUpload(e, setCampaignForm, 'bannerUrl')} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <div className="w-full bg-black border border-neutral-800 border-dashed text-neutral-400 px-4 py-3 flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-bold">{uploadingImage ? 'Processing...' : 'Click to upload banner image'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={uploadingImage} className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-3 px-6 hover:bg-white transition-colors w-full disabled:opacity-50">Save Campaign</button>
            </form>
          )}

          {campaigns.length === 0 ? (
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm text-center py-8 border border-neutral-800">No active campaigns.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {campaigns.map(camp => (
                <div key={camp.id} className="border border-neutral-800 bg-neutral-900 flex overflow-hidden">
                  <div className="w-1/3 bg-black">
                    <img src={camp.bannerUrl} alt={camp.name} className="w-full h-full object-cover mix-blend-luminosity opacity-80" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-black uppercase text-xl tracking-tighter">{camp.name}</h3>
                        <span className="bg-[#D4FF00] text-black px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                          {camp.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-neutral-400 font-bold mb-4">{camp.discountPercentage}% OFF</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteCampaign(camp.id)}
                      className="self-end text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "gift-cards" && (
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">GIFT CARD REGISTRY</h2>
            <button 
              onClick={() => setShowGiftCardForm(!showGiftCardForm)}
              className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-white transition-colors"
            >
              {showGiftCardForm ? 'Cancel' : 'Add Gift Card'}
            </button>
          </div>

          {showGiftCardForm && (
            <form onSubmit={handleCreateGiftCard} className="mb-8 border border-neutral-800 p-6 bg-neutral-900 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Gift Card Name</label>
                <input required value={giftCardForm.name} onChange={e => setGiftCardForm({...giftCardForm, name: e.target.value})} className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Value (৳)</label>
                  <input required type="number" value={giftCardForm.value} onChange={e => setGiftCardForm({...giftCardForm, value: e.target.value})} className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Price (৳)</label>
                  <input required type="number" value={giftCardForm.price} onChange={e => setGiftCardForm({...giftCardForm, price: e.target.value})} className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Gift Card Image</label>
                <div className="flex flex-col gap-4">
                  {giftCardForm.imageUrl && (
                    <div className="w-full h-32 bg-black border border-neutral-800 overflow-hidden">
                      <img src={giftCardForm.imageUrl} alt="Card preview" className="w-full h-full object-cover opacity-80" />
                    </div>
                  )}
                  <div className="relative w-full">
                    <input 
                      type="file" 
                      accept="image/*"
                      required={!giftCardForm.imageUrl}
                      onChange={e => handleImageUpload(e, setGiftCardForm, 'imageUrl')} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    <div className="w-full bg-black border border-neutral-800 border-dashed text-neutral-400 px-4 py-3 flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-bold">{uploadingImage ? 'Processing...' : 'Click to upload gift card image'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={uploadingImage} className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-3 px-6 hover:bg-white transition-colors w-full disabled:opacity-50">Save Gift Card</button>
            </form>
          )}

          {giftCards.length === 0 ? (
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm text-center py-8 border border-neutral-800">No gift cards available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {giftCards.map(card => (
                <div key={card.id} className="border border-neutral-800 bg-neutral-900 overflow-hidden relative">
                  <div className="aspect-[16/9] bg-black p-6 flex flex-col justify-between relative overflow-hidden">
                    {card.imageUrl && (
                      <img src={card.imageUrl} alt={card.name} className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-40" />
                    )}
                    <div className="relative z-10 flex justify-between items-start">
                      <h3 className="text-white font-black uppercase tracking-tighter text-xl">{card.name}</h3>
                      <span className="text-[#D4FF00] font-black text-2xl">৳{card.value}</span>
                    </div>
                    <div className="relative z-10 flex justify-between items-end">
                      <div className="text-neutral-400 font-mono text-xs uppercase tracking-widest">
                        Price: ৳{card.price}
                      </div>
                      <button 
                        onClick={() => handleDeleteGiftCard(card.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest bg-black/50 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ads" && (
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">ADS MANAGEMENT</h2>
            <button 
              onClick={() => setShowPrimeAdForm(!showPrimeAdForm)}
              className="bg-white text-black font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-[#D4FF00] transition-colors"
            >
              {showPrimeAdForm ? 'Cancel' : 'Create Prime Stock Ad (Free)'}
            </button>
          </div>

          <form onSubmit={handleUpdateAdPricing} className="mb-8 border border-neutral-800 p-6 bg-neutral-900 flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Home Page Front Ad Price (৳)</label>
              <input required type="number" value={adPricing.home_front} onChange={e => setAdPricing({ home_front: Number(e.target.value) })} className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-[#D4FF00] outline-none" />
            </div>
            <button type="submit" disabled={isUpdatingPrice} className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-3 px-6 hover:bg-white transition-colors disabled:opacity-50">
              {isUpdatingPrice ? 'Updating...' : 'Update Pricing'}
            </button>
          </form>

          {showPrimeAdForm && (
            <form onSubmit={handleCreatePrimeAd} className="mb-8 border border-neutral-800 p-6 bg-neutral-900 space-y-4 border-l-4 border-l-white">
              <h3 className="text-xl font-bold text-white mb-4 uppercase">New Prime Stock Official Ad</h3>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Ad Image</label>
                <div className="flex flex-col gap-4">
                  {primeAdForm.imageUrl && (
                    <div className="w-full max-w-sm aspect-video bg-black border border-neutral-800 overflow-hidden">
                      <img src={primeAdForm.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative w-full max-w-sm">
                    <input 
                      type="file" 
                      accept="image/*"
                      required={!primeAdForm.imageUrl}
                      onChange={e => handleImageUpload(e, setPrimeAdForm, 'imageUrl')} 
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
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Target URL (Optional)</label>
                <input type="url" value={primeAdForm.targetUrl} onChange={e => setPrimeAdForm({...primeAdForm, targetUrl: e.target.value})} className="w-full bg-black border border-neutral-800 text-white px-4 py-3 focus:border-white outline-none" />
              </div>
              <button type="submit" disabled={uploadingImage} className="bg-white text-black font-black uppercase tracking-widest py-3 px-6 hover:bg-[#D4FF00] transition-colors w-full disabled:opacity-50">Save Official Ad</button>
            </form>
          )}

          {ads.length === 0 ? (
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm text-center py-8 border border-neutral-800">No ads submitted.</p>
          ) : (
            <div className="space-y-6">
              {ads.map(ad => (
                <div key={ad.id} className="border border-neutral-800 p-6 bg-neutral-900 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-full sm:w-48 aspect-video bg-black shrink-0 relative border border-neutral-800 overflow-hidden">
                      <img src={ad.imageUrl} alt="Ad preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-white font-black uppercase tracking-widest mb-1">{ad.placement.replace('_', ' ')}</h3>
                      <div className="space-y-1 text-sm text-neutral-400">
                        <p><strong className="text-neutral-500">Seller:</strong> {ad.sellerEmail}</p>
                        <p><strong className="text-neutral-500">Status:</strong> <span className={ad.status === 'approved' ? 'text-[#D4FF00]' : ad.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}>{ad.status.toUpperCase()}</span></p>
                        <p><strong className="text-neutral-500">Cost:</strong> ৳{ad.cost}</p>
                        {ad.targetUrl && <p><strong className="text-neutral-500">Target:</strong> <a href={ad.targetUrl} target="_blank" rel="noreferrer" className="text-white underline">{ad.targetUrl}</a></p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 min-w-[150px]">
                    {ad.status !== 'approved' && (
                      <button 
                        onClick={() => handleUpdateAdStatus(ad.id, 'approved')}
                        className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-white transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {ad.status !== 'rejected' && (
                      <button 
                        onClick={() => handleUpdateAdStatus(ad.id, 'rejected')}
                        className="bg-neutral-700 text-white font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-neutral-600 transition-colors"
                      >
                        Reject
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteAd(ad.id)}
                      className="text-red-500 font-black uppercase tracking-widest py-2 px-4 text-xs hover:bg-red-500/10 transition-colors mt-2"
                    >
                      Delete Ad
                    </button>
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
