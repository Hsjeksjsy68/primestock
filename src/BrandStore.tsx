import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MapPin, Heart, Plus, Store, Phone, Box } from 'lucide-react';

interface BrandStoreProps {
  sellerId: string;
  products: any[];
  onViewProduct: (id: string) => void;
  addToCart: (product: any) => void;
  toggleFavorite: (id: string) => void;
  favorites: string[];
}

export default function BrandStore({
  sellerId,
  products,
  onViewProduct,
  addToCart,
  toggleFavorite,
  favorites
}: BrandStoreProps) {
  const [sellerProfile, setSellerProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', sellerId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.sellerProfile) {
            setSellerProfile(data.sellerProfile);
          }
        }
      } catch (err) {
        console.error("Error fetching seller profile", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (sellerId) {
      fetchSeller();
    }
  }, [sellerId]);

  const sellerProducts = products.filter(p => p.sellerId === sellerId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4FF00]"></div>
      </div>
    );
  }

  if (!sellerProfile) {
    if (sellerProducts.length > 0) {
      // Fallback profile if the seller doesn't have a full profile yet
      const fallbackName = sellerProducts[0].seller.split('@')[0].toUpperCase() + "'S STORE";
      return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
          <div className="bg-neutral-900 border border-neutral-800 p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-[#D4FF00]/5 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <div className="w-32 h-32 md:w-48 md:h-48 bg-black border-4 border-[#D4FF00] flex items-center justify-center shrink-0 z-10">
              <Store className="w-16 h-16 md:w-24 md:h-24 text-[#D4FF00]" />
            </div>
            <div className="flex-1 text-center md:text-left z-10">
              <div className="inline-flex items-center gap-2 bg-[#D4FF00] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">
                SELLER STORE
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                {fallbackName}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-bold text-neutral-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-[#D4FF00]" />
                  {sellerProducts.length} PRODUCTS
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-8 border-b-2 border-neutral-800 pb-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">ALL PRODUCTS</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sellerProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onViewProduct(product.id)}
                className="bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-[#D4FF00] transition-colors group flex flex-col rounded-2xl cursor-pointer"
              >
                <div className="aspect-[4/5] bg-neutral-800 relative flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                    {product.category}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className={`absolute top-4 right-4 p-2 bg-black/80 backdrop-blur-md rounded-full transition-colors opacity-100 ${favorites.includes(product.id) ? "text-red-500 hover:text-red-400" : "text-white hover:text-[#D4FF00]"}`}
                  >
                    <Heart
                      className="w-4 h-4"
                      fill={
                        favorites.includes(product.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>
                <div className="p-5 flex flex-col flex-1 bg-black">
                  <h3 className="font-bold text-lg md:text-xl text-white uppercase tracking-tighter leading-tight mb-4 flex-1">
                    {product.name}
                  </h3>
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col">
                      {product.isAuction ? (
                        <>
                          <span className="text-[10px] font-bold text-[#D4FF00] uppercase tracking-widest mb-1">
                            CURRENT BID
                          </span>
                          <span className="text-xl font-black text-[#D4FF00]">
                            ৳{(product.currentBid || product.price).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-black text-white">
                          ৳{product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {!product.isAuction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="bg-transparent hover:bg-[#D4FF00] border border-neutral-700 hover:border-[#D4FF00] text-white hover:text-black p-3 rounded-full transition-all flex items-center justify-center"
                        aria-label="Add to cart"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="text-center py-20">
        <Store className="w-16 h-16 text-neutral-600 mx-auto mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">STORE NOT FOUND</h2>
        <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">We couldn't find the requested brand store.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Store Header */}
      <div 
        className="bg-neutral-900 border border-neutral-800 mb-12 relative overflow-hidden"
      >
        {sellerProfile.banner ? (
          <div className="absolute inset-0 z-0">
            <img src={sellerProfile.banner} alt={`${sellerProfile.shopName} banner`} className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute top-0 right-0 p-32 bg-[#D4FF00]/5 rounded-full blur-3xl mix-blend-screen pointer-events-none z-0"></div>
        )}
        
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-black border-4 border-[#D4FF00] flex items-center justify-center shrink-0 overflow-hidden">
            {sellerProfile.logo ? (
              <img src={sellerProfile.logo} alt={`${sellerProfile.shopName} logo`} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-16 h-16 md:w-24 md:h-24 text-[#D4FF00]" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#D4FF00] text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4">
              OFFICIAL BRAND STORE
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4 drop-shadow-lg">
              {sellerProfile.shopName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-bold text-neutral-400 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4FF00]" />
                {sellerProfile.shopLocation || sellerProfile.officeAddress}
              </div>
              {sellerProfile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#D4FF00]" />
                  {sellerProfile.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#D4FF00]" />
                {sellerProducts.length} PRODUCTS
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 border-b-2 border-neutral-800 pb-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">ALL PRODUCTS</h2>
      </div>

      {sellerProducts.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-neutral-800">
          <Box className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-neutral-500 uppercase tracking-widest">
            NO PRODUCTS AVAILABLE
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sellerProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => onViewProduct(product.id)}
              className="bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-[#D4FF00] transition-colors group flex flex-col rounded-2xl cursor-pointer"
            >
              <div className="aspect-[4/5] bg-neutral-800 relative flex items-center justify-center overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white">
                  {product.category}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  className={`absolute top-4 right-4 p-2 bg-black/80 backdrop-blur-md rounded-full transition-colors opacity-100 ${favorites.includes(product.id) ? "text-red-500 hover:text-red-400" : "text-white hover:text-[#D4FF00]"}`}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={
                      favorites.includes(product.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1 bg-black">
                <h3 className="font-bold text-lg md:text-xl text-white uppercase tracking-tighter leading-tight mb-4 flex-1">
                  {product.name}
                </h3>
                <div className="flex items-end justify-between mt-auto">
                  <div className="flex flex-col">
                    {product.isAuction ? (
                      <>
                        <span className="text-[10px] font-bold text-[#D4FF00] uppercase tracking-widest mb-1">
                          CURRENT BID
                        </span>
                        <span className="text-xl font-black text-[#D4FF00]">
                          ৳{(product.currentBid || product.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-black text-white">
                        ৳{product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {!product.isAuction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="bg-transparent hover:bg-[#D4FF00] border border-neutral-700 hover:border-[#D4FF00] text-white hover:text-black p-3 rounded-full transition-all flex items-center justify-center"
                      aria-label="Add to cart"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
