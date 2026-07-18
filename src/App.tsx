// --- Types & Mock Data ---

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  seller: string;
  sellerId?: string;
  deliveryAvailable?: boolean;
  sizes?: string[];
  description?: string;
  stock?: number;
  sku?: string;
  brand?: string;
  shippingFee?: number;
  isAuction?: boolean;
  auctionEndDate?: string | null;
  currentBid?: number | null;
  highestBidder?: string | null;
  comments?: Comment[];
}

interface SellerProfile {
  status?: string;
  tradeLicense: string;
  nid: string;
  phone: string;
  officeAddress: string;
  shopName: string;
  shopLocation: string;
  sellerEmail: string;
  logo?: string;
  banner?: string;
}

interface UserDoc {
  role: string;
  email: string;
  address?: string;
  photoURL?: string;
  sellerProfile?: SellerProfile;
}

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  items: CartItem[];
  total: number;
  status: string;
  createdAt: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Menu,
  Star,
  Package,
  Trash2,
  Plus,
  Minus,
  Heart,
  ChevronRight,
  TrendingUp,
  BarChart3,
  CheckCircle,
  X,
  User,
  ArrowRight,
  ArrowUpRight,
  Share2,
} from "lucide-react";
import AuthModal from "./AuthModal";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { useNavigate, useLocation } from "react-router-dom";

import AddListing from "./AddListing";
import UserProfile from "./UserProfile";
import ConfirmModal from "./ConfirmModal";
import SellerProfileForm from "./SellerProfileForm";
import AdminDashboard from "./AdminDashboard";
import CustomerService from "./CustomerService";
import Deals from "./Deals";
import GiftCards from "./GiftCards";
import Registry from "./Registry";
import BestSellers from "./BestSellers";
import BrandStore from "./BrandStore";
import ProductComments from "./ProductComments";

import {
  collection,
  doc,
  deleteDoc, getDoc,
  onSnapshot,
  addDoc,
  updateDoc,
} from "firebase/firestore";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split("/");
  const currentView = pathParts[1] || "home";
  const productId = currentView === "product" ? pathParts[2] : null;

  const setCurrentView = (view: string) => {
    navigate(view === "home" ? "/" : "/" + view);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null,
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"inventory" | "orders" | "support">(
    "inventory",
  );
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [sellers, setSellers] = useState<any[]>([]);

  const placeBid = async (productId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product || !product.isAuction) return;

    const currentBid = product.currentBid || product.price;
    const newBid = parseFloat(bidAmount);

    if (isNaN(newBid) || newBid <= currentBid) {
      setSuccessModal({
        isOpen: true,
        message: "Your bid must be higher than the current bid.",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "products", productId), {
        currentBid: newBid,
        highestBidder: user.email,
      });
      setBidAmount("");
      setSuccessModal({
        isOpen: true,
        message: "Bid placed successfully!",
      });
    } catch (error) {
      console.error("Error placing bid", error);
    }
  };

  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setShowTopBar(false);
        } else {
          setShowTopBar(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const [activeProductImageIndex, setActiveProductImageIndex] = useState(0);

  useEffect(() => {
    setActiveProductImageIndex(0);
  }, [productId]);

  const selectedProduct = productId
    ? products.find((p) => p.id === productId) || null
    : null;

  useEffect(() => {
    let unsubscribeAuth: () => void;
    let unsubscribeDoc: () => void;

    let unsubscribeOrders: () => void;
    let unsubscribeSupport: () => void;

    unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        unsubscribeDoc = onSnapshot(
          doc(db, "users", currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserDoc;
              if (currentUser.email === "admin-001@primestock.com") {
                setUserRole("admin");
              } else {
                setUserRole(data.role);
              }
              setUserAddress(data.address || '');
              setSellerProfile(data.sellerProfile || null);
            }
          },
        );

        unsubscribeOrders = onSnapshot(
          collection(db, "orders"),
          (snapshot) => {
            const fbOrders: Order[] = [];
            snapshot.forEach((doc) => {
              fbOrders.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(fbOrders);
          },
        );

        unsubscribeSupport = onSnapshot(
          collection(db, "support_requests"),
          (snapshot) => {
            const fbReqs: any[] = [];
            snapshot.forEach((doc) => {
              fbReqs.push({ id: doc.id, ...doc.data() });
            });
            setSupportRequests(fbReqs);
          }
        );
      } else {
        setUserRole(null);
        if (unsubscribeDoc) unsubscribeDoc();
        if (unsubscribeOrders) unsubscribeOrders();
        if (unsubscribeSupport) unsubscribeSupport();
      }
    });

    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const fbProducts: Product[] = [];
        snapshot.forEach((doc) => {
          fbProducts.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(fbProducts);
      },
    );

    const unsubscribeSellers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const fbSellers: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.role === "seller" && data.sellerProfile && data.sellerProfile.status === "approved") {
            fbSellers.push({ id: doc.id, ...data });
          }
        });
        setSellers(fbSellers);
      }
    );

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSupport) unsubscribeSupport();
      if (unsubscribeSellers) unsubscribeSellers();
    };
  }, []);

  const placeOrder = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (cart.length === 0) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      if (!userData.address) {
        setSuccessModal({ isOpen: true, message: "Please add a shipping address in your profile first." });
        return;
      }
      
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
        customerName: userData.name || 'Unknown',
        customerPhone: userData.phone || 'Unknown',
        shippingAddress: userData.address,
        items: cart,
        total: cartTotal * 1.08,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setCart([]);
      setSuccessModal({ isOpen: true, message: "Order placed successfully!" });
      setCurrentView("home");
    } catch (error) {
      console.error(error);
      setSuccessModal({ isOpen: true, message: "Failed to place order." });
    }
  };

  const deleteProduct = async (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, "products", deleteConfirm));
      setDeleteConfirm(null);
    } catch (error) {
      console.error(error);
      setSuccessModal({ isOpen: true, message: "Failed to delete listing." });
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "ALL" || p.category.toUpperCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100">
      {/* Header */}
      <header className={`bg-black text-white sticky top-0 z-50 transition-transform duration-300 ${showTopBar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left: Nav actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-white hover:text-[#D4FF00] transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:flex items-center gap-6 text-sm font-bold tracking-widest uppercase">
              <button
                onClick={() => {
                  setCurrentView("shop");
                  setActiveCategory("ALL");
                  setSearchQuery("");
                }}
                className="hover:text-[#D4FF00] transition-colors"
              >
                Shop
              </button>
              <button
                onClick={() => setCurrentView("auctions")}
                className="hover:text-[#D4FF00] transition-colors"
              >
                Auctions
              </button>
              <button
                onClick={() => setCurrentView("deals")}
                className="hover:text-[#D4FF00] transition-colors"
              >
                Campaign
              </button>
              {user ? (
                <>
                  <button
                    onClick={() => setCurrentView("profile")}
                    className="hover:text-[#D4FF00] transition-colors uppercase"
                  >
                    PROFILE
                  </button>
                  {userRole === "admin" && (
                    <button
                      onClick={() => setCurrentView("admin")}
                      className="hover:text-[#D4FF00] transition-colors uppercase"
                    >
                      ADMIN
                    </button>
                  )}
                  {userRole === "seller" && (
                    <button
                      onClick={() => setCurrentView("seller")}
                      className="hover:text-[#D4FF00] transition-colors uppercase"
                    >
                      SELLER DASH
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hover:text-[#D4FF00] transition-colors"
                >
                  Account
                </button>
              )}
            </div>
          </div>

          {/* Logo */}
          <button
            onClick={() => {
              setCurrentView("home");
              setActiveCategory("ALL");
              setSearchQuery("");
            }}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-xl md:text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity uppercase"
          >
            <div className="w-0 h-0 border-t-[8px] md:border-t-[10px] border-t-transparent border-l-[12px] md:border-l-[15px] border-l-white border-b-[8px] md:border-b-[10px] border-b-transparent"></div>
            PRIME STOCK
          </button>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative flex items-center group">
              <Search className="w-5 h-5 absolute left-3 text-neutral-400 z-10 pointer-events-none" />
              <input
                type="text"
                placeholder="SEARCH"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border border-transparent sm:border-neutral-700 focus:border-white text-white uppercase tracking-widest text-xs font-bold py-2 pl-10 pr-2 md:pr-4 w-12 sm:w-32 md:w-48 transition-all outline-none focus:w-48 md:focus:w-64 cursor-pointer focus:cursor-text opacity-0 sm:opacity-100 focus:opacity-100 group-hover:opacity-100"
              />
            </div>
            <button
              onClick={() => setCurrentView("cart")}
              className="text-white hover:text-[#D4FF00] transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4FF00] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Marquee Banner */}
        <div className="bg-[#D4FF00] text-black text-xs md:text-sm font-black uppercase tracking-widest py-2 overflow-hidden flex whitespace-nowrap">
          <div className="animate-marquee inline-flex gap-4 md:gap-12">
            <span>SPRING/SUMMER 26</span>
            <span>•</span>
            <span>FREE WORLDWIDE SHIPPING</span>
            <span>•</span>
            <span>NEW MODERNITY</span>
            <span>•</span>
            <span>SPRING/SUMMER 26</span>
            <span>•</span>
            <span>FREE WORLDWIDE SHIPPING</span>
            <span>•</span>
            <span>NEW MODERNITY</span>
            <span>•</span>
            <span>SPRING/SUMMER 26</span>
            <span>•</span>
            <span>FREE WORLDWIDE SHIPPING</span>
            <span>•</span>
            <span>NEW MODERNITY</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
        {currentView === "home" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Banner */}
            {!searchQuery && (
              <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 text-white min-h-[60vh] flex flex-col items-center justify-center shadow-lg group">
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000"
                    alt="Mountains"
                    className="w-full h-full object-cover grayscale opacity-40 group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
                <div className="relative z-10 w-full flex flex-col items-center justify-center p-8">
                  <h1 className="text-6xl md:text-9xl font-black leading-none tracking-tighter text-center uppercase drop-shadow-2xl">
                    FOR GEN-Z
                  </h1>

                  <div className="mt-12 flex flex-col sm:flex-row items-center gap-8 text-sm md:text-base font-bold tracking-[0.2em] uppercase">
                    <span>SS // 26</span>
                    <button
                      onClick={() => setCurrentView("shop")}
                      className="border border-white hover:bg-white hover:text-black rounded-full px-8 py-3 transition-colors flex items-center gap-2"
                    >
                      EXPLORE <ArrowRight className="w-4 h-4" />
                    </button>
                    <span>GLOBAL</span>
                  </div>
                </div>
              </div>
            )}

            {/* Split Section: Radical Simplicity */}
            {!searchQuery && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch min-h-[50vh] py-12 border-b border-neutral-800">
                <div className="flex flex-col justify-center pr-8">
                  <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
                    RADICAL
                    <br />
                    SIMPLICITY
                  </h2>
                  <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-md font-medium leading-relaxed">
                    We strip away the unnecessary to reveal the essential. Prime
                    Stock is an ongoing study in material, form, and brutalist
                    aesthetics.
                  </p>
                  <p className="text-neutral-500 mb-12 max-w-md">
                    Designed in our studio. Manufactured with precision. Built
                    to outlast trends.
                  </p>
                  <div>
                    <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-[#D4FF00] transition-colors">
                      READ MANIFESTO <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="relative bg-neutral-900 rounded-2xl overflow-hidden hidden md:block">
                  <img
                    src="https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&q=80&w=1000"
                    alt="Abstract"
                    className="w-full h-full object-cover grayscale opacity-80"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold tracking-widest uppercase text-neutral-400">
                    CAMPAIGN 2026
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Brand Stores */}
            {!searchQuery && sellers.length > 0 && (
              <div className="pt-12 border-t border-neutral-800">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                    BRAND
                    <br />
                    STORES
                  </h2>
                  <p className="text-neutral-400 text-sm tracking-widest uppercase max-w-xs md:text-right font-medium">
                    Discover official brands and top sellers.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {sellers.slice(0, 4).map((seller) => (
                    <div
                      key={seller.id}
                      onClick={() => navigate("/brand/" + seller.id)}
                      className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-[#D4FF00] transition-colors cursor-pointer group text-center"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 bg-black border-2 border-neutral-800 group-hover:border-[#D4FF00] transition-colors flex items-center justify-center rounded-full overflow-hidden">
                        {seller.sellerProfile?.logo ? (
                          <img src={seller.sellerProfile.logo} alt={seller.sellerProfile.shopName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-white">{seller.sellerProfile?.shopName?.charAt(0) || seller.email.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-white uppercase tracking-tighter mb-2 truncate">
                        {seller.sellerProfile?.shopName || seller.email.split('@')[0]}
                      </h3>
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                        {seller.sellerProfile?.shopLocation || 'Global'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auction Suggestions */}
            {!searchQuery && products.filter(p => p.isAuction).length > 0 && (
              <div className="pt-12 border-t border-neutral-800">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                    LIVE
                    <br />
                    AUCTIONS
                  </h2>
                  <p className="text-neutral-400 text-sm tracking-widest uppercase max-w-xs md:text-right font-medium">
                    Bid on exclusive drops and rare items.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.filter(p => p.isAuction).slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate("/product/" + product.id)}
                      className="bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-[#D4FF00] transition-colors group flex flex-col rounded-2xl cursor-pointer relative"
                    >
                      <div className="absolute top-4 right-4 bg-[#D4FF00] text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 animate-pulse">
                        LIVE AUCTION
                      </div>
                      <div className="aspect-[4/5] bg-neutral-800 relative flex items-center justify-center overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="object-cover w-full h-full mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1 bg-black">
                        <h3 className="font-bold text-lg text-white uppercase tracking-tighter leading-tight mb-4 flex-1">
                          {product.name}
                        </h3>
                        <div>
                          <span className="text-[10px] font-bold text-[#D4FF00] uppercase tracking-widest mb-1 block">
                            CURRENT BID
                          </span>
                          <span className="text-xl font-black text-[#D4FF00]">
                            ৳{(product.currentBid || product.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Products */}
            <div className="pt-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                  TOP
                  <br />
                  PICKS
                </h2>
                <p className="text-neutral-400 text-sm tracking-widest uppercase max-w-xs md:text-right font-medium">
                  Curated selection of our best brutalist essentials.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      navigate("/product/" + product.id);
                    }}
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
              <div className="mt-12 text-center">
                <button
                  onClick={() => setCurrentView("shop")}
                  className="bg-[#D4FF00] text-black font-black uppercase tracking-widest px-8 py-4 hover:bg-white transition-colors border-2 border-transparent"
                >
                  VIEW FULL COLLECTION
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "auctions" && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                LIVE
                <br />
                AUCTIONS
              </h2>
              <p className="text-neutral-400 text-sm tracking-widest uppercase max-w-xs md:text-right font-medium">
                Bid on exclusive drops.
              </p>
            </div>
            {products.filter(p => p.isAuction).length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-lg font-medium text-neutral-500 uppercase tracking-widest">
                  No active auctions.
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => p.isAuction).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => navigate("/product/" + product.id)}
                    className="bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-[#D4FF00] transition-colors group flex flex-col rounded-2xl cursor-pointer relative"
                  >
                    <div className="absolute top-4 right-4 bg-[#D4FF00] text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 animate-pulse">
                      LIVE AUCTION
                    </div>
                    <div className="aspect-[4/5] bg-neutral-800 relative flex items-center justify-center overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1 bg-black">
                      <h3 className="font-bold text-lg text-white uppercase tracking-tighter leading-tight mb-4 flex-1">
                        {product.name}
                      </h3>
                      <div>
                        <span className="text-[10px] font-bold text-[#D4FF00] uppercase tracking-widest mb-1 block">
                          CURRENT BID
                        </span>
                        <span className="text-xl font-black text-[#D4FF00]">
                          ৳{(product.currentBid || product.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === "shop" && (
          <div className="animate-in fade-in duration-500">
            {/* Product Grid */}
            <div id="products">
              {searchQuery ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">
                    Search results for "{searchQuery}"
                  </h2>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-neutral-400 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors"
                  >
                    CLEAR SEARCH
                  </button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                  <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                    SHOP
                  </h2>
                  <p className="text-neutral-400 text-sm tracking-widest uppercase max-w-xs md:text-right font-medium">
                    A brutalist approach to everyday essentials. Form follows
                    function.
                  </p>
                </div>
              )}

              <div className="mb-12 relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-500" />
                <input
                  type="text"
                  placeholder="SEARCH COLLECTION..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border-2 border-neutral-800 focus:border-[#D4FF00] text-white py-4 pl-14 pr-4 uppercase tracking-widest text-sm font-bold outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>

              {/* Category Pills */}
              {!searchQuery && (
                <div className="flex flex-wrap gap-4 mb-12 uppercase text-xs font-bold tracking-widest">
                  {["ALL", ...Array.from(new Set(products.map(p => (p.category || 'OTHER').toUpperCase())))].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full transition-colors ${
                          activeCategory === cat
                            ? "bg-[#D4FF00] text-black border-2 border-[#D4FF00]"
                            : "border-2 border-neutral-800 text-neutral-400 hover:border-white hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ),
                  )}
                </div>
              )}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-500">
                    No products found.
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        navigate("/product/" + product.id);
                      }}
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
          </div>
        )}

        {currentView === "product" && selectedProduct && (
          <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
            <button
              onClick={() => setCurrentView("shop")}
              className="text-neutral-400 hover:text-white uppercase tracking-widest text-xs font-bold mb-8 flex items-center gap-2 transition-colors"
            >
              &larr; BACK TO SHOP
            </button>
            <div className="flex flex-col md:flex-row gap-12">
              {/* Product Image */}
              <div className="flex-1 bg-neutral-900 border border-neutral-800 relative flex flex-col items-center justify-center p-4 md:p-12 min-h-[500px]">
                <img
                  src={(selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[activeProductImageIndex] : selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 max-h-[600px]"
                />
                <button
                  onClick={() => toggleFavorite(selectedProduct.id)}
                  className={`absolute top-6 right-6 p-3 bg-black/80 backdrop-blur-md rounded-full transition-colors ${favorites.includes(selectedProduct.id) ? "text-red-500 hover:text-red-400" : "text-white hover:text-[#D4FF00]"}`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={
                      favorites.includes(selectedProduct.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
                
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-black/50 backdrop-blur-md border border-neutral-800">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveProductImageIndex(idx)}
                        className={`w-16 h-16 relative border-2 transition-all ${activeProductImageIndex === idx ? 'border-[#D4FF00] scale-110' : 'border-neutral-600/50 hover:border-neutral-400 opacity-70 hover:opacity-100'}`}
                      >
                        <img src={img} alt={`${selectedProduct.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-4 inline-flex items-center gap-2">
                  <span className="bg-[#D4FF00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1">
                    {selectedProduct.category}
                  </span>
                  <div className="flex items-center gap-1 text-[#D4FF00]">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-white text-xs font-bold">
                      {selectedProduct.rating} ({selectedProduct.reviews})
                    </span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                  {selectedProduct.name}
                </h1>
                
                {selectedProduct.isAuction ? (
                  <div className="mb-8">
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">
                      CURRENT BID
                    </p>
                    <p className="text-4xl font-black text-[#D4FF00] mb-2">
                      ৳{(selectedProduct.currentBid || selectedProduct.price).toFixed(2)}
                    </p>
                    {selectedProduct.highestBidder && (
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">
                        HIGHEST BIDDER: {selectedProduct.highestBidder}
                      </p>
                    )}
                    {selectedProduct.auctionEndDate && (
                      <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">
                        ENDS: {new Date(selectedProduct.auctionEndDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-3xl font-black text-white mb-8">
                    ৳{selectedProduct.price.toFixed(2)}
                  </p>
                )}

                <div className="prose prose-invert max-w-none text-neutral-400 font-medium mb-10">
                  <p>
                    {selectedProduct.description ||
                      "Engineered for precision and built to last. This piece represents our commitment to brutalist aesthetics combined with uncompromising functionality."}
                  </p>
                  <ul className="mt-4 uppercase tracking-widest text-xs space-y-2">
                    {selectedProduct.brand && (
                      <li>
                        &bull; BRAND: <span className="text-white">{selectedProduct.brand}</span>
                      </li>
                    )}
                    {selectedProduct.sku && (
                      <li>
                        &bull; SKU: <span className="text-white">{selectedProduct.sku}</span>
                      </li>
                    )}
                    {selectedProduct.sizes &&
                      selectedProduct.sizes.length > 0 && (
                        <li>
                          &bull; SIZES: <span className="text-white">{selectedProduct.sizes.join(", ")}</span>
                        </li>
                      )}
                    <li>
                      &bull; STOCK: <span className="text-white">{selectedProduct.stock !== undefined ? selectedProduct.stock : 'IN STOCK'}</span>
                    </li>
                    {selectedProduct.deliveryAvailable !== false && (
                      <li>
                        &bull; DELIVERY: <span className="text-white">AVAILABLE</span> {selectedProduct.shippingFee ? `(৳{selectedProduct.shippingFee.toFixed(2)})` : ''}
                      </li>
                    )}
                    <li>
                      &bull; SELLER:{" "}
                      {selectedProduct.sellerId ? (
                        <button onClick={() => navigate(`/brand/${selectedProduct.sellerId}`)} className="text-white hover:text-[#D4FF00] transition-colors underline decoration-[#D4FF00] underline-offset-4">
                          {selectedProduct.seller}
                        </button>
                      ) : (
                        <span className="text-white">{selectedProduct.seller}</span>
                      )}
                    </li>
                  </ul>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-4 mb-8 text-xs text-neutral-400">
                  <h4 className="text-[#D4FF00] font-bold uppercase tracking-widest mb-2">
                    Prime Stock Agreement
                  </h4>
                  <p>
                    By purchasing this product, you acknowledge that Prime Stock
                    is a public marketplace. While you can complain to Prime
                    Stock Management regarding fraudulent activities, Prime
                    Stock itself is not the manufacturer and cannot be held
                    solely responsible for the product's quality.
                  </p>
                </div>

                <div className="flex gap-4">
                  {selectedProduct.isAuction ? (
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="number" 
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="ENTER BID AMOUNT"
                        className="flex-1 bg-black border-2 border-neutral-800 focus:border-[#D4FF00] text-white py-5 px-4 font-bold outline-none transition-colors"
                      />
                      <button
                        onClick={() => placeBid(selectedProduct.id)}
                        className="bg-[#D4FF00] hover:bg-white text-black font-black uppercase tracking-widest py-5 px-8 transition-colors flex items-center justify-center border-2 border-transparent"
                      >
                        PLACE BID
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(selectedProduct)}
                      className="flex-1 bg-[#D4FF00] hover:bg-white text-black font-black uppercase tracking-widest py-5 px-8 transition-colors flex items-center justify-center gap-3 border-2 border-transparent"
                    >
                      ADD TO CART <Plus className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + '/product/' + selectedProduct.id);
                      alert('Product link copied to clipboard!');
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-black uppercase tracking-widest py-5 px-6 transition-colors border border-neutral-800 flex items-center justify-center"
                    title="Share Product"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <ProductComments productId={selectedProduct.id} user={user} />
          </div>
        )}

        {currentView === "cart" && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-6xl md:text-8xl font-black mb-12 flex items-center gap-4 uppercase tracking-tighter">
              <ShoppingCart className="w-12 h-12 md:w-20 md:h-20 text-[#D4FF00]" />
              CART
            </h1>

            {cart.length === 0 ? (
              <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-12 text-center uppercase tracking-widest">
                <div className="bg-neutral-800 w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="w-10 h-10 text-[#D4FF00]" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">
                  YOUR CART IS EMPTY
                </h2>
                <p className="text-neutral-400 mb-8 font-medium">
                  Form follows function. Start adding items.
                </p>
                <button
                  onClick={() => setCurrentView("home")}
                  className="bg-[#D4FF00] hover:bg-white text-black font-black py-4 px-10 uppercase transition-colors inline-flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6 flex flex-col sm:flex-row gap-6"
                    >
                      <div className="w-full sm:w-32 h-32 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-neutral-100 leading-tight mb-1">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-green-500 font-medium mb-1">
                              In Stock
                            </p>
                            <p className="text-xs text-neutral-500 mb-4">
                              Sold by: {item.product.sellerId ? (
                                <button onClick={() => navigate(`/brand/${item.product.sellerId}`)} className="hover:text-[#D4FF00] transition-colors underline decoration-[#D4FF00] underline-offset-4">
                                  {item.product.seller}
                                </button>
                              ) : (
                                item.product.seller
                              )}
                            </p>
                          </div>
                          <span className="font-bold text-lg whitespace-nowrap">
                            ৳{(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, -1)
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-700 text-neutral-300 transition-all"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-4 h-4 text-red-500" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                            </button>
                            <span className="w-10 text-center font-medium text-neutral-200">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-700 text-neutral-300 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, -item.quantity)
                            }
                            className="text-sm text-red-500 font-medium hover:underline flex items-center gap-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-80 h-fit bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6 sticky top-24">
                  <h3 className="font-bold text-lg mb-4 text-neutral-100">
                    Order Summary
                  </h3>
                  <div className="space-y-3 text-sm text-neutral-400 mb-6">
                    <div className="flex justify-between">
                      <span>Items ({cartItemCount}):</span>
                      <span className="text-neutral-200">
                        ৳{cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping & handling:</span>
                      <span className="text-green-500 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total before tax:</span>
                      <span className="text-neutral-200">
                        ৳{cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated tax (8%):</span>
                      <span className="text-neutral-200">
                        ৳{(cartTotal * 0.08).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-neutral-100">
                        Order Total:
                      </span>
                      <span className="font-black text-2xl text-neutral-100">
                        ৳{(cartTotal * 1.08).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {user && (
                    <div className="bg-neutral-900 border border-neutral-800 p-4 mb-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">Shipping To</h4>
                      {userAddress ? (
                        <p className="text-white text-sm font-mono whitespace-pre-wrap">{userAddress}</p>
                      ) : (
                        <div className="text-red-400 text-sm font-bold uppercase mb-2">No address set</div>
                      )}
                      <button 
                        onClick={() => setCurrentView("profile")}
                        className="text-[#D4FF00] hover:underline uppercase tracking-widest text-xs font-black mt-2 inline-block"
                      >
                        {userAddress ? 'Change Address' : 'Add Address in Profile'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={placeOrder}
                    className="w-full bg-[#D4FF00] hover:bg-white text-black font-black py-4 px-4 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === "seller" && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-right-8 duration-300">
            {!sellerProfile ? (
              <SellerProfileForm onComplete={() => window.location.reload()} />
            ) : sellerProfile.status === 'pending' ? (
              <div className="bg-black border-2 border-neutral-800 p-12 text-center">
                <h2 className="text-3xl font-black uppercase text-[#D4FF00] mb-4">Application Pending</h2>
                <p className="text-white font-bold uppercase tracking-widest text-sm">Your seller application is currently under review by our administration. We will notify you once approved.</p>
              </div>
            ) : (
              <div className="bg-black border-2 border-neutral-800 overflow-hidden rounded-none">
                {/* Dashboard Header */}
                <div className="bg-[#D4FF00] border-b-2 border-neutral-800 text-black p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black mb-1 uppercase tracking-tighter">
                      SELLER DASHBOARD
                    </h1>
                    <p className="text-black font-medium tracking-widest uppercase text-sm">
                      MANAGE INVENTORY AND TRACK METRICS
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setCurrentView("add-listing");
                    }}
                    className="bg-black hover:bg-neutral-800 text-white font-black py-4 px-6 uppercase tracking-widest transition-colors flex items-center gap-2 border-2 border-black"
                  >
                    <Plus className="w-5 h-5" /> ADD LISTING
                  </button>
                </div>

                <div className="flex border-b-2 border-neutral-800 bg-neutral-900 px-6 sm:px-8">
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors ${activeTab === "inventory" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors ${activeTab === "orders" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setActiveTab("support")}
                    className={`py-4 px-6 font-black uppercase tracking-widest text-sm border-b-2 transition-colors ${activeTab === "support" ? "border-[#D4FF00] text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Support
                  </button>
                </div>
                <div className="p-6 sm:p-8">
                  {activeTab === "inventory" && (
                    <>
                      {/* Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-black border-2 border-neutral-800 p-6 flex flex-col justify-between">
                          <div className="flex items-start justify-between mb-8">
                            <h3 className="font-bold text-neutral-400 uppercase tracking-widest text-xs">
                              TOTAL REVENUE
                            </h3>
                            <BarChart3 className="w-6 h-6 text-[#D4FF00]" />
                          </div>
                          <div>
                            <div className="text-4xl font-black text-white tracking-tighter mb-2">
                              ৳{orders.reduce((total, order) => {
                                if (order.status === 'cancelled') return total;
                                const sellerItems = order.items.filter(item => item.product.sellerId === user?.uid);
                                const itemsTotal = sellerItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                                return total + itemsTotal;
                              }, 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-[#D4FF00] font-bold uppercase tracking-widest flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" /> ALL TIME
                            </div>
                          </div>
                        </div>
                        <div className="bg-black border-2 border-neutral-800 p-6 flex flex-col justify-between">
                          <div className="flex items-start justify-between mb-8">
                            <h3 className="font-bold text-neutral-400 uppercase tracking-widest text-xs">
                              ACTIVE LISTINGS
                            </h3>
                            <Package className="w-6 h-6 text-[#D4FF00]" />
                          </div>
                          <div>
                            <div className="text-4xl font-black text-white tracking-tighter mb-2">
                              {products.filter(p => p.sellerId === user?.uid).length}
                            </div>
                            <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                              PRODUCTS LIVE
                            </div>
                          </div>
                        </div>
                        <div className="bg-black border-2 border-neutral-800 p-6 flex flex-col justify-between">
                          <div className="flex items-start justify-between mb-8">
                            <h3 className="font-bold text-neutral-400 uppercase tracking-widest text-xs">
                              GLOBAL RATING
                            </h3>
                            <Star className="w-6 h-6 text-[#D4FF00]" />
                          </div>
                          <div>
                            <div className="text-4xl font-black text-white tracking-tighter mb-2">
                              {(() => {
                                const sellerProducts = products.filter(p => p.sellerId === user?.uid);
                                const totalReviews = sellerProducts.reduce((sum, p) => sum + (p.reviews || 0), 0);
                                return totalReviews > 0 
                                  ? (sellerProducts.reduce((sum, p) => sum + ((p.rating || 0) * (p.reviews || 0)), 0) / totalReviews).toFixed(1)
                                  : "0.0";
                              })()}
                            </div>
                            <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                              BASED ON {products.filter(p => p.sellerId === user?.uid).reduce((sum, p) => sum + (p.reviews || 0), 0)} REVIEWS
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Inventory Table */}
                      <div>
                        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">
                          RECENT INVENTORY
                        </h2>
                        <div className="overflow-x-auto border-2 border-neutral-800">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-neutral-900 text-neutral-400 border-b-2 border-neutral-800 uppercase tracking-widest text-xs font-black">
                              <tr>
                                <th className="px-6 py-4">PRODUCT</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">PRICE</th>
                                <th className="px-6 py-4">STOCK</th>
                                <th className="px-6 py-4">STATUS</th>
                                <th className="px-6 py-4 text-right">
                                  ACTIONS
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-neutral-800">
                              {products
                                .filter(
                                  (p) =>
                                    p.sellerId === user?.uid ||
                                    p.seller === user?.email ||
                                    !p.sellerId,
                                )
                                .slice(0, 5)
                                .map((p, i) => (
                                  <tr
                                    key={i}
                                    className="hover:bg-neutral-900 transition-colors"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neutral-800 flex-shrink-0">
                                          <img
                                            src={p.image}
                                            alt={p.name}
                                            className="w-full h-full object-cover mix-blend-luminosity"
                                          />
                                        </div>
                                        <div className="font-black text-white uppercase tracking-widest text-xs w-48 truncate">
                                          {p.name}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-neutral-500 font-bold">
                                      PRM-{(1000 + i).toString()}
                                    </td>
                                    <td className="px-6 py-4 font-black text-white">
                                      ৳{p.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-white font-bold">
                                      {Math.floor(Math.random() * 50) + 5} UNITS
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#D4FF00] text-black">
                                        ACTIVE
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingProduct(p);
                                          setCurrentView("add-listing");
                                        }}
                                        className="text-blue-400 hover:text-blue-300 hover:underline font-medium uppercase text-xs tracking-widest flex items-center gap-1 mr-2"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => deleteProduct(p.id)}
                                        className="text-red-400 hover:text-red-300 hover:underline font-medium uppercase text-xs tracking-widest flex items-center gap-1"
                                      >
                                        <Trash2 className="w-4 h-4" /> Delete
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                  {activeTab === "orders" && (
                    <div className="animate-in fade-in duration-300">
                      <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">
                        ORDER HISTORY
                      </h2>
                      {orders.length === 0 ? (
                        <div className="bg-black border-2 border-neutral-800 p-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-full mb-4">
                            <Package className="w-8 h-8 text-neutral-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-2">
                            NO ORDERS YET
                          </h3>
                          <p className="text-neutral-500 font-medium tracking-widest text-sm">
                            When customers place orders for your products, they
                            will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {orders.map((order) => {
                            const sellerItems = order.items.filter(
                              (item) =>
                                item.product.sellerId === user?.uid ||
                                item.product.seller === user?.email ||
                                !item.product.sellerId,
                            );
                            if (sellerItems.length === 0) return null;

                            return (
                              <div
                                key={order.id}
                                className="bg-black border-2 border-neutral-800 p-6"
                              >
                                <div className="flex flex-wrap justify-between items-start border-b border-neutral-800 pb-4 mb-4 gap-4">
                                  <div>
                                    <div className="text-xs text-[#D4FF00] font-black uppercase tracking-widest mb-1">
                                      ORDER ID
                                    </div>
                                    <div className="text-white font-mono text-sm">
                                      {order.id}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-neutral-500 font-black uppercase tracking-widest mb-1">
                                      DATE
                                    </div>
                                    <div className="text-white font-bold">
                                      {new Date(
                                        order.createdAt,
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-neutral-500 font-black uppercase tracking-widest mb-1">
                                      STATUS
                                    </div>
                                    <div className="inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white text-black">
                                      {order.status}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-neutral-500 font-black uppercase tracking-widest mb-1">
                                      TOTAL
                                    </div>
                                    <div className="text-white font-black text-xl">
                                      ৳
                                      {sellerItems
                                        .reduce(
                                          (acc, item) =>
                                            acc +
                                            item.product.price * item.quantity,
                                          0,
                                        )
                                        .toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-6 p-4 bg-neutral-900 border border-neutral-800">
                                  <h4 className="text-xs text-[#D4FF00] font-black uppercase tracking-widest mb-3">Customer Details</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] block mb-1">Name</span>
                                      <span className="text-white font-medium">{order.customerName || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] block mb-1">Email</span>
                                      <span className="text-white font-medium">{order.userEmail}</span>
                                    </div>
                                    <div>
                                      <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] block mb-1">Phone</span>
                                      <span className="text-white font-medium">{order.customerPhone || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] block mb-1">Address</span>
                                      <span className="text-white font-medium block whitespace-pre-wrap">{order.shippingAddress || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  {sellerItems.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-4"
                                    >
                                      <div className="w-16 h-16 bg-neutral-900 flex-shrink-0">
                                        <img
                                          src={item.product.image}
                                          alt={item.product.name}
                                          className="w-full h-full object-cover mix-blend-luminosity"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-black text-white uppercase tracking-widest text-sm truncate">
                                          {item.product.name}
                                        </div>
                                        <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                                          QTY: {item.quantity} × ৳
                                          {item.product.price.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "support" && (
                    <div className="animate-in fade-in duration-300">
                      <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">
                        CUSTOMER SUPPORT REQUESTS
                      </h2>
                      {supportRequests.filter(req => req.sellerIds && req.sellerIds.includes(user?.uid)).length === 0 ? (
                        <div className="bg-black border-2 border-neutral-800 p-12 text-center">
                          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mb-2">No support requests.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {supportRequests.filter(req => req.sellerIds && req.sellerIds.includes(user?.uid)).map(req => (
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
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === "customer-service" && <CustomerService />}
        {currentView === "profile" && <UserProfile user={user} orders={orders} favorites={favorites} products={products} onViewProduct={(id: string) => navigate(`/product/${id}`)} />}
        {currentView === "add-listing" && <AddListing onBack={() => setCurrentView("seller")} productToEdit={editingProduct} />}
        {currentView === "brand" && <BrandStore sellerId={pathParts[2]} products={products} onViewProduct={(id: string) => navigate("/product/" + id)} addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />}
        {currentView === "admin" && <AdminDashboard />}
        {currentView === "gift-cards" && <GiftCards user={user} />}
        {currentView === "deals" && <Deals />}
        {currentView === "best-sellers" && <BestSellers products={products} onViewProduct={(id: string) => navigate(`/product/${id}`)} addToCart={addToCart} toggleFavorite={toggleFavorite} favorites={favorites} />}
        {currentView === "registry" && <Registry />}
        {["deals", "registry"].includes(currentView) && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 border-2 border-[#D4FF00] flex items-center justify-center mb-8">
              <Star className="w-10 h-10 text-[#D4FF00]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              COMING SOON
            </h1>
            <p className="text-neutral-400 font-medium max-w-md uppercase tracking-widest text-sm">
              This section is currently under development. Please check back
              later.
            </p>
            <button
              onClick={() => setCurrentView("home")}
              className="mt-12 bg-[#D4FF00] text-black font-black uppercase tracking-widest px-8 py-4 hover:bg-white transition-colors"
            >
              RETURN HOME
            </button>
          </div>
        )}
      </main>

      {/* Mobile Drawer Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-4/5 max-w-sm bg-neutral-950 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}
      >
        <div className="bg-neutral-900 p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-neutral-800 p-2 rounded-full">
              <User className="w-5 h-5 text-white" />
            </div>
            {user ? (
              <button 
                onClick={() => {
                  setCurrentView("profile");
                  setIsMenuOpen(false);
                }}
                className="font-bold text-white text-lg truncate max-w-[200px] hover:text-[#D4FF00] transition-colors"
              >
                Hello, {user.email?.split("@")[0]}
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="font-bold text-white text-lg hover:text-[#D4FF00]"
              >
                Hello, Sign in
              </button>
            )}
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-neutral-400 hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">Trending</h3>
          </div>
          <button
            onClick={() => {
              setCurrentView("best-sellers");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors"
          >
            Best Sellers
          </button>
          <button
            onClick={() => {
              setCurrentView("home");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors"
          >
            New Releases
          </button>

          <div className="my-4 border-t border-neutral-800" />

          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">Categories</h3>
          </div>
          {Array.from(new Set(products.map(p => (p.category || 'OTHER').toUpperCase()))).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCurrentView("shop");
                setActiveCategory(cat);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors uppercase tracking-widest text-sm font-bold"
            >
              {cat} <ChevronRight className="w-4 h-4" />
            </button>
          ))}

          <div className="my-4 border-t border-neutral-800" />

          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">
              Programs & Features
            </h3>
          </div>
          <button
            onClick={() => {
              setCurrentView("deals");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors"
          >
            Today's Deals
          </button>
          <button
            onClick={() => {
              setCurrentView("gift-cards");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors"
          >
            Gift Cards
          </button>
          <button
            onClick={() => {
              setCurrentView("registry");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors"
          >
            Registry
          </button>

          <div className="my-4 border-t border-neutral-800" />

          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">Help & Settings</h3>
          </div>
          <button
            onClick={() => {
              if (user) {
                setCurrentView("seller");
                setIsMenuOpen(false);
              } else {
                setIsAuthModalOpen(true);
                setIsMenuOpen(false);
              }
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors"
          >
            {userRole === 'seller' ? 'Seller Dashboard' : 'Become a Seller'}
          </button>
          <button
            onClick={() => {
              setCurrentView("customer-service");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors"
          >
            Customer Service
          </button>
          {user && (
            <button
              onClick={() => {
                signOut(auth);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-6 py-3 text-red-400 hover:bg-neutral-900 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        onConfirm={confirmDeleteProduct}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Delete"
      />
      <ConfirmModal
        isOpen={successModal.isOpen}
        title="Notification"
        message={successModal.message}
        onConfirm={() => setSuccessModal({ isOpen: false, message: "" })}
        onCancel={() => setSuccessModal({ isOpen: false, message: "" })}
        confirmText="OK"
      />
    </div>
  );
}
