import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Package, Heart, User as UserIcon, Save, Upload } from "lucide-react";
import { db } from "./firebase";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { compressImage } from "./utils/imageUtils";

interface UserProfileProps {
  user: User;
  onViewProduct: (productId: string) => void;
  favorites: string[];
  products: any[];
}

export default function UserProfile({ user, onViewProduct, favorites, products }: UserProfileProps) {
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.displayName || '',
    phone: '',
    address: '',
    photoURL: user.photoURL || ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileDoc = await getDoc(doc(db, "users", user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfileData({
            name: data.name || user.displayName || '',
            phone: data.phone || '',
            address: data.address || '',
            photoURL: data.photoURL || user.photoURL || ''
          });
        }
        
        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const orders: any[] = [];
        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        setUserOrders(orders);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const base64Str = await compressImage(file);
      setProfileData(prev => ({ ...prev, photoURL: base64Str }));
    } catch (err) {
      console.error("Failed to process image", err);
      alert("Failed to process image");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        photoURL: profileData.photoURL,
        email: user.email,
      }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-8 border-b border-neutral-800">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              <UserIcon className="w-8 h-8 md:w-10 md:h-10 text-[#D4FF00]" />
              MY ACCOUNT
            </h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mt-2">{user.email}</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="border-2 border-[#D4FF00] text-[#D4FF00] font-black uppercase tracking-widest px-6 py-2 hover:bg-[#D4FF00] hover:text-black transition-colors text-xs"
            >
              EDIT DETAILS
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                {profileData.photoURL && (
                  <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 shrink-0 overflow-hidden rounded-full">
                    <img src={profileData.photoURL} alt="Profile preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    disabled={uploadingImage}
                  />
                  <div className="w-full bg-neutral-900 border border-neutral-800 border-dashed text-neutral-400 px-4 py-3 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-bold">{uploadingImage ? 'Processing...' : 'Click to upload profile picture'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-4 focus:border-[#D4FF00] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Phone Number</label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-4 focus:border-[#D4FF00] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Shipping Address</label>
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-4 focus:border-[#D4FF00] outline-none min-h-[100px]"
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={saveProfile}
                disabled={isSaving || uploadingImage}
                className="flex items-center gap-2 bg-[#D4FF00] text-black font-black uppercase tracking-widest px-6 py-3 hover:bg-white transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'SAVING...' : 'SAVE DETAILS'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                disabled={isSaving || uploadingImage}
                className="text-neutral-500 font-bold uppercase tracking-widest px-6 py-3 hover:text-white transition-colors disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-neutral-300">
            {profileData.photoURL && (
              <div className="md:col-span-2 flex items-center gap-4">
                <img src={profileData.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-[#D4FF00]" />
              </div>
            )}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">Full Name</p>
              <p className="font-medium text-lg">{profileData.name || <span className="italic text-neutral-600">Not provided</span>}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">Phone Number</p>
              <p className="font-medium text-lg">{profileData.phone || <span className="italic text-neutral-600">Not provided</span>}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-1">Shipping Address</p>
              <p className="font-mono whitespace-pre-wrap">{profileData.address || <span className="italic font-sans text-neutral-600">No address saved yet. Save an address for faster checkout.</span>}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order History */}
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-2">
            <Package className="w-6 h-6 text-[#D4FF00]" /> RECENT ORDERS
          </h2>
          
          {userOrders.length === 0 ? (
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No orders found.</p>
          ) : (
            <div className="space-y-6">
              {userOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                <div key={order.id} className="border border-neutral-800 p-4 bg-neutral-900">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-800">
                    <div>
                      <span className="text-neutral-400 font-mono text-xs block mb-1">ID: {order.id}</span>
                      <span className="text-neutral-500 font-mono text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="bg-[#D4FF00] text-black text-[10px] font-black uppercase tracking-widest px-2 py-1">
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-white font-medium">{item.product.name} x {item.quantity}</span>
                        <span className="text-neutral-400">৳{(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-center font-bold">
                    <span className="text-white uppercase tracking-widest">Total</span>
                    <span className="text-[#D4FF00]">৳{order.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Products */}
        <div className="bg-black border-2 border-neutral-800 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#D4FF00]" /> FAVORITES
          </h2>
          
          {favoriteProducts.length === 0 ? (
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No favorites added yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favoriteProducts.map(product => (
                <div 
                  key={product.id} 
                  className="group cursor-pointer border border-neutral-800 bg-neutral-900 overflow-hidden relative"
                  onClick={() => onViewProduct(product.id)}
                >
                  <div className="aspect-square bg-neutral-800 overflow-hidden relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold truncate">{product.name}</h3>
                    <p className="text-[#D4FF00] font-black mt-1">৳{product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
