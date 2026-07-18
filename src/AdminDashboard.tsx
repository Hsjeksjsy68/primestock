import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"sellers" | "support" | "campaigns" | "gift-cards">("sellers");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);

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
    return () => {
      unsubscribeUsers();
      unsubscribeSupport();
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

  if (loading) return <div className="text-white text-center p-12">Loading...</div>;

  const pendingSellers = users.filter(u => u.sellerProfile?.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-white">ADMIN DASHBOARD</h1>
      
      <div className="flex border-b-2 border-neutral-800 bg-neutral-900 px-6 sm:px-8 mb-8 overflow-x-auto">
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
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">CAMPAIGN MANAGEMENT</h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mb-4">Run and manage campaigns (Coming soon)</p>
          <div className="border border-neutral-800 p-8 text-center bg-neutral-900">
            <h3 className="text-xl font-bold text-white mb-2 uppercase">Create New Campaign</h3>
            <p className="text-neutral-400 mb-4">Set up a new promotional campaign with custom discounts and banners.</p>
            <button className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-3 px-6 hover:bg-white transition-colors">
              Start Campaign Setup
            </button>
          </div>
        </div>
      )}

      {activeTab === "gift-cards" && (
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8 animate-in fade-in duration-300">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">GIFT CARD REGISTRY</h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mb-4">Manage gift card offerings and registry</p>
          <div className="border border-neutral-800 p-8 text-center bg-neutral-900">
            <h3 className="text-xl font-bold text-white mb-2 uppercase">Add Special Gift Card</h3>
            <p className="text-neutral-400 mb-4">Create a new gift card tier or special edition card for users to purchase.</p>
            <button className="bg-[#D4FF00] text-black font-black uppercase tracking-widest py-3 px-6 hover:bg-white transition-colors">
              Create Gift Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
