// --- Types & Mock Data ---

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  image: string;
  seller: string;
  sellerId?: string;
  deliveryAvailable?: boolean;
  sizes?: string[];
  description?: string;
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
}

interface UserDoc {
  role: string;
  email: string;
  sellerProfile?: SellerProfile;
}

interface Order {
  id: string;
  userId: string;
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
  LogOut,
  User,
  ArrowRight,
  ArrowUpRight,
  Share2,
} from "lucide-react";
import AuthModal from "./AuthModal";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { useNavigate, useLocation } from "react-router-dom";

import AddProductModal from "./AddProductModal";
import ConfirmModal from "./ConfirmModal";
import SellerProfileForm from "./SellerProfileForm";
import AdminDashboard from "./AdminDashboard";
import CustomerService from "./CustomerService";
import Deals from "./Deals";
import GiftCards from "./GiftCards";
import Registry from "./Registry";
import UserProfile from "./UserProfile";
import BestSellers from "./BestSellers";

import {
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  addDoc,
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null,
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"inventory" | "orders">(
    "inventory",
  );
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const selectedProduct = productId
    ? products.find((p) => p.id === productId) || null
    : null;

  useEffect(() => {
    let unsubscribeAuth: () => void;
    let unsubscribeDoc: () => void;

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
              setSellerProfile(data.sellerProfile || null);
            }
          },
        );
      } else {
        setUserRole(null);
        if (unsubscribeDoc) unsubscribeDoc();
      }
    });

    const unsubscribeOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const fbOrders: Order[] = [];
        snapshot.forEach((doc) => {
          fbOrders.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(fbOrders);
      },
    );

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

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  const placeOrder = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (cart.length === 0) return;
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
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
      <header className="bg-black text-white sticky top-0 z-50">
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
                onClick={() => setCurrentView("deals")}
                className="hover:text-[#D4FF00] transition-colors"
              >
                Campaign
              </button>
              {user ? (
                <div className="relative group">
                  <button className="hover:text-[#D4FF00] transition-colors uppercase">
                    {userRole === "seller" ? "SELLER ACCOUNT" : "ACCOUNT"}
                  </button>
                  <div className="absolute top-full left-0 mt-4 bg-black border-2 border-neutral-800 hidden group-hover:block z-50 w-48 shadow-xl">
                    {userRole === "admin" && (
                      <button
                        onClick={() => setCurrentView("admin")}
                        className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#D4FF00] hover:text-black transition-colors"
                      >
                        Admin Dashboard
                      </button>
                    )}
                    {userRole === "seller" && (
                      <button
                        onClick={() => setCurrentView("seller")}
                        className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#D4FF00] hover:text-black transition-colors"
                      >
                        Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentView("profile")}
                      className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#D4FF00] hover:text-black transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => signOut(auth)}
                      className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-red-500 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
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
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 md:gap-2 text-xl md:text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity uppercase"
          >
            <div className="w-0 h-0 border-t-[8px] md:border-t-[10px] border-t-transparent border-l-[12px] md:border-l-[15px] border-l-white border-b-[8px] md:border-b-[10px] border-b-transparent"></div>
            <span className="hidden sm:inline">PRIME STOCK</span>
            <span className="sm:hidden">P.S.</span>
          </button>

          {/* Right: Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-3 text-neutral-400" />
              <input
                type="text"
                placeholder="SEARCH"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border border-neutral-700 focus:border-white text-white uppercase tracking-widest text-xs font-bold py-2 pl-10 pr-2 md:pr-4 w-24 sm:w-32 md:w-48 transition-all outline-none focus:w-32 sm:focus:w-40 md:focus:w-64"
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
                          <span className="text-xl font-black text-white">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
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
                  {["ALL", "OUTERWEAR", "TOPS", "BOTTOMS", "ACCESSORIES"].map(
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
                            <span className="text-xl font-black text-white">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
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
              <div className="flex-1 bg-neutral-900 border border-neutral-800 relative flex items-center justify-center p-12 min-h-[500px]">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 max-h-[600px]"
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
                <p className="text-3xl font-black text-white mb-8">
                  ${selectedProduct.price.toFixed(2)}
                </p>
                <div className="prose prose-invert max-w-none text-neutral-400 font-medium mb-10">
                  <p>
                    {selectedProduct.description ||
                      "Engineered for precision and built to last. This piece represents our commitment to brutalist aesthetics combined with uncompromising functionality."}
                  </p>
                  <ul className="mt-4 uppercase tracking-widest text-xs space-y-2">
                    {selectedProduct.sizes &&
                      selectedProduct.sizes.length > 0 && (
                        <li>
                          &bull; SIZES: {selectedProduct.sizes.join(", ")}
                        </li>
                      )}
                    <li>
                      &bull; DELIVERY:{" "}
                      {selectedProduct.deliveryAvailable
                        ? "AVAILABLE"
                        : "NOT AVAILABLE"}
                    </li>
                    <li>&bull; SELLER: {selectedProduct.seller}</li>
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
                  <button
                    onClick={() => addToCart(selectedProduct)}
                    className="flex-1 bg-[#D4FF00] hover:bg-white text-black font-black uppercase tracking-widest py-5 px-8 transition-colors flex items-center justify-center gap-3 border-2 border-transparent"
                  >
                    ADD TO CART <Plus className="w-5 h-5" />
                  </button>
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
                              Sold by: {item.product.seller}
                            </p>
                          </div>
                          <span className="font-bold text-lg whitespace-nowrap">
                            ${(item.product.price * item.quantity).toFixed(2)}
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
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping & handling:</span>
                      <span className="text-green-500 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total before tax:</span>
                      <span className="text-neutral-200">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated tax (8%):</span>
                      <span className="text-neutral-200">
                        ${(cartTotal * 0.08).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-neutral-100">
                        Order Total:
                      </span>
                      <span className="font-black text-2xl text-neutral-100">
                        ${(cartTotal * 1.08).toFixed(2)}
                      </span>
                    </div>
                  </div>

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
                    onClick={() => setIsAddProductModalOpen(true)}
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
                </div>
                <div className="p-6 sm:p-8">
                  {activeTab === "inventory" ? (
                    <>
                      {/* Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-black border-2 border-neutral-800 p-6 flex flex-col justify-between">
                          <div className="flex items-start justify-between mb-8">
                            <h3 className="font-bold text-neutral-400 uppercase tracking-widest text-xs">
                              TODAY'S REVENUE
                            </h3>
                            <BarChart3 className="w-6 h-6 text-[#D4FF00]" />
                          </div>
                          <div>
                            <div className="text-4xl font-black text-white tracking-tighter mb-2">
                              $1,248.50
                            </div>
                            <div className="text-xs text-[#D4FF00] font-bold uppercase tracking-widest flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" /> +14.5% VS
                              YESTERDAY
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
                              {
                                products.filter(
                                  (p) =>
                                    p.sellerId === user?.uid ||
                                    p.seller === user?.email ||
                                    !p.sellerId,
                                ).length
                              }
                            </div>
                            <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                              ACROSS 4 CATEGORIES
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
                              4.8
                            </div>
                            <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                              BASED ON 2,105 REVIEWS
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
                                      ${p.price.toFixed(2)}
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
                  ) : (
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
                                      $
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
                                          QTY: {item.quantity} × $
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
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === "customer-service" && <CustomerService />}
        {currentView === "admin" && <AdminDashboard />}
        {["deals", "registry", "gift-cards"].includes(currentView) && (
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
              <span className="font-bold text-white text-lg truncate max-w-[200px]">
                Hello, {user.email?.split("@")[0]}
              </span>
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
          <button
            onClick={() => {
              setCurrentView("shop");
              setActiveCategory("TOPS");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors uppercase tracking-widest text-sm font-bold"
          >
            TOPS <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentView("shop");
              setActiveCategory("BOTTOMS");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors uppercase tracking-widest text-sm font-bold"
          >
            BOTTOMS <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentView("shop");
              setActiveCategory("OUTERWEAR");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors uppercase tracking-widest text-sm font-bold"
          >
            OUTERWEAR <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentView("shop");
              setActiveCategory("ACCESSORIES");
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors uppercase tracking-widest text-sm font-bold"
          >
            ACCESSORIES <ChevronRight className="w-4 h-4" />
          </button>

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
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
      />
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
