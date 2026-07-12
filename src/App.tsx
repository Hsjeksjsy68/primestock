/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, Menu, Star, Package, 
  Trash2, Plus, Minus, Heart, ChevronRight,
  TrendingUp, BarChart3, CheckCircle, X, LogOut, User,
  ArrowRight, ArrowUpRight
} from 'lucide-react';
import AuthModal from './AuthModal';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'cart' | 'seller' | 'deals' | 'customer-service' | 'registry' | 'gift-cards'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const filteredProducts = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100">
      {/* Header */}
      <header className="bg-black text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left: Nav actions */}
          <div className="flex items-center gap-6">
            <button onClick={() => setIsMenuOpen(true)} className="text-white hover:text-[#D4FF00] transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:flex items-center gap-6 text-sm font-bold tracking-widest uppercase">
              <button onClick={() => setCurrentView('home')} className="hover:text-[#D4FF00] transition-colors">Shop</button>
              <button onClick={() => setCurrentView('deals')} className="hover:text-[#D4FF00] transition-colors">Campaign</button>
              <button onClick={() => setIsAuthModalOpen(true)} className="hover:text-[#D4FF00] transition-colors">Account</button>
            </div>
          </div>

          {/* Logo */}
          <button
            onClick={() => setCurrentView('home')}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-xl md:text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity uppercase"
          >
            <div className="w-0 h-0 border-t-[8px] md:border-t-[10px] border-t-transparent border-l-[12px] md:border-l-[15px] border-l-white border-b-[8px] md:border-b-[10px] border-b-transparent"></div>
            PRIME STOCK
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
                 className="bg-transparent border border-neutral-700 focus:border-white text-white uppercase tracking-widest text-xs font-bold py-2 pl-10 pr-4 w-32 md:w-48 transition-colors outline-none"
               />
            </div>
            <button
              onClick={() => setCurrentView('cart')}
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
        {currentView === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Banner */}
            {!searchQuery && (
              <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 text-white min-h-[60vh] flex flex-col items-center justify-center shadow-lg group">
                <div className="absolute inset-0 w-full h-full">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000" alt="Mountains" className="w-full h-full object-cover grayscale opacity-40 group-hover:scale-105 transition-transform duration-1000" />
                </div>
                <div className="relative z-10 w-full flex flex-col items-center justify-center p-8">
                  <h1 className="text-6xl md:text-9xl font-black leading-none tracking-tighter text-center uppercase drop-shadow-2xl">
                    FOR GEN-Z
                  </h1>
                  
                  <div className="mt-12 flex flex-col sm:flex-row items-center gap-8 text-sm md:text-base font-bold tracking-[0.2em] uppercase">
                    <span>SS // 26</span>
                    <button onClick={() => {
                       const productsSection = document.getElementById('products');
                       productsSection?.scrollIntoView({ behavior: 'smooth' });
                    }} className="border border-white hover:bg-white hover:text-black rounded-full px-8 py-3 transition-colors flex items-center gap-2">
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
                     RADICAL<br/>SIMPLICITY
                   </h2>
                   <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-md font-medium leading-relaxed">
                     We strip away the unnecessary to reveal the essential. Prime Stock is an ongoing study in material, form, and brutalist aesthetics.
                   </p>
                   <p className="text-neutral-500 mb-12 max-w-md">
                     Designed in our studio. Manufactured with precision. Built to outlast trends.
                   </p>
                   <div>
                     <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-[#D4FF00] transition-colors">
                       READ MANIFESTO <ArrowUpRight className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
                 <div className="relative bg-neutral-900 rounded-2xl overflow-hidden hidden md:block">
                   <img src="https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&q=80&w=1000" alt="Abstract" className="w-full h-full object-cover grayscale opacity-80" />
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold tracking-widest uppercase text-neutral-400">
                     CAMPAIGN 2026
                   </div>
                 </div>
               </div>
            )}

            {/* Product Grid */}
            <div id="products" className="pt-12">
              {searchQuery ? (
                <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Search results for "{searchQuery}"</h2>
              ) : (
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                  <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                    SHOP
                  </h2>
                  <p className="text-neutral-400 text-sm tracking-widest uppercase max-w-xs md:text-right font-medium">
                    A brutalist approach to everyday essentials. Form follows function.
                  </p>
                </div>
              )}
              
              {/* Category Pills (Mock) */}
              {!searchQuery && (
                <div className="flex flex-wrap gap-4 mb-12 uppercase text-xs font-bold tracking-widest">
                  <button className="bg-[#D4FF00] text-black px-6 py-2 rounded-full">ALL</button>
                  <button className="border border-neutral-700 text-neutral-400 hover:border-white hover:text-white px-6 py-2 rounded-full transition-colors">OUTERWEAR</button>
                  <button className="border border-neutral-700 text-neutral-400 hover:border-white hover:text-white px-6 py-2 rounded-full transition-colors">TOPS</button>
                  <button className="border border-neutral-700 text-neutral-400 hover:border-white hover:text-white px-6 py-2 rounded-full transition-colors">BOTTOMS</button>
                  <button className="border border-neutral-700 text-neutral-400 hover:border-white hover:text-white px-6 py-2 rounded-full transition-colors">ACCESSORIES</button>
                </div>
              )}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-500">No products found.</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-neutral-900 border border-neutral-800 overflow-hidden hover:border-[#D4FF00] transition-colors group flex flex-col rounded-2xl"
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
                        <button className="absolute top-4 right-4 p-2 bg-black/80 backdrop-blur-md rounded-full text-white hover:text-[#D4FF00] transition-colors opacity-0 group-hover:opacity-100">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-5 flex flex-col flex-1 bg-black">
                        <h3 className="font-bold text-lg md:text-xl text-white uppercase tracking-tighter leading-tight mb-4 flex-1">
                          {product.name}
                        </h3>
                        <div className="flex items-end justify-between mt-auto">
                          <div className="flex flex-col">
                            <span className="text-xl font-black text-white">${product.price.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
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

        {currentView === 'cart' && (
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
                <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">YOUR CART IS EMPTY</h2>
                <p className="text-neutral-400 mb-8 font-medium">Form follows function. Start adding items.</p>
                <button
                  onClick={() => setCurrentView('home')}
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
                    <div key={item.product.id} className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-32 h-32 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-2">
                        <img src={item.product.image} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-neutral-100 leading-tight mb-1">{item.product.name}</h3>
                            <p className="text-sm text-green-500 font-medium mb-1">In Stock</p>
                            <p className="text-xs text-neutral-500 mb-4">Sold by: {item.product.seller}</p>
                          </div>
                          <span className="font-bold text-lg whitespace-nowrap">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-neutral-700">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-700 text-neutral-300 transition-all"
                            >
                              {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                            </button>
                            <span className="w-10 text-center font-medium text-neutral-200">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-700 text-neutral-300 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => updateQuantity(item.product.id, -item.quantity)}
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
                  <h3 className="font-bold text-lg mb-4 text-neutral-100">Order Summary</h3>
                  <div className="space-y-3 text-sm text-neutral-400 mb-6">
                    <div className="flex justify-between">
                      <span>Items ({cartItemCount}):</span>
                      <span className="text-neutral-200">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping & handling:</span>
                      <span className="text-green-500 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total before tax:</span>
                      <span className="text-neutral-200">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated tax (8%):</span>
                      <span className="text-neutral-200">${(cartTotal * 0.08).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-800 pt-4 mb-6">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg text-neutral-100">Order Total:</span>
                      <span className="font-black text-2xl text-neutral-100">${(cartTotal * 1.08).toFixed(2)}</span>
                    </div>
                  </div>

                  <button className="w-full bg-[#D4FF00] hover:bg-white text-black font-black py-4 px-4 uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'seller' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-right-8 duration-300">
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-neutral-950 border-b border-neutral-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black mb-1">Seller Central</h1>
                  <p className="text-neutral-400 text-sm">Manage your inventory and track sales</p>
                </div>
                <button className="bg-[#D4FF00] hover:bg-white text-black font-black py-3 px-6 uppercase tracking-widest transition-colors flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add Product
                </button>
              </div>
              
              <div className="p-6 sm:p-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-neutral-400">Today's Sales</h3>
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-black text-neutral-100">$1,248.50</div>
                    <div className="text-sm text-green-500 font-medium mt-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +14.5% vs yesterday
                    </div>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-neutral-400">Active Listings</h3>
                      <Package className="w-5 h-5 text-[#D4FF00]" />
                    </div>
                    <div className="text-3xl font-black text-neutral-100">124</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      across 8 categories
                    </div>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-neutral-400">Customer Rating</h3>
                      <Star className="w-5 h-5 text-[#D4FF00]" />
                    </div>
                    <div className="text-3xl font-black text-neutral-100">4.8</div>
                    <div className="text-sm text-neutral-500 mt-2">
                      Based on 2,105 reviews
                    </div>
                  </div>
                </div>

                {/* Inventory Table */}
                <div>
                  <h2 className="text-lg font-bold text-neutral-100 mb-4">Recent Inventory</h2>
                  <div className="overflow-x-auto border border-neutral-800 rounded-xl">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-neutral-950 text-neutral-400 font-medium border-b border-neutral-800">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Stock</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {PRODUCTS.slice(0, 5).map((p, i) => (
                          <tr key={i} className="hover:bg-neutral-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded flex-shrink-0 p-1">
                                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="font-medium text-neutral-200 w-48 truncate">{p.name}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-neutral-500">PRM-{(1000 + i).toString()}</td>
                            <td className="px-4 py-3 font-medium text-neutral-200">${p.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-neutral-300">
                              <span className="font-medium">{Math.floor(Math.random() * 50) + 5}</span> units
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                Active
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="text-blue-400 hover:text-blue-300 hover:underline font-medium">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'deals' && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
             <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#D4FF00]" />
              Today's Deals
            </h1>
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-12 text-center">
                <h2 className="text-2xl font-bold text-neutral-100 mb-2">Exclusive Deals Coming Soon</h2>
                <p className="text-neutral-400 mb-8">Check back later for massive discounts on top brands.</p>
                <button
                  onClick={() => setCurrentView('home')}
                  className="bg-[#D4FF00] hover:bg-white text-black font-black py-4 px-10 uppercase tracking-widest transition-colors inline-flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Continue Shopping
                </button>
            </div>
          </div>
        )}

        {currentView === 'customer-service' && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
             <h1 className="text-3xl font-black mb-8">Customer Service</h1>
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-8">
                <h2 className="text-xl font-bold text-neutral-100 mb-4">How can we help you?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-neutral-800 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors">
                    <Package className="w-8 h-8 text-[#D4FF00] mb-3" />
                    <h3 className="font-bold text-white mb-1">A delivery, order or return</h3>
                  </div>
                  <div className="p-4 border border-neutral-800 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors">
                    <ShoppingCart className="w-8 h-8 text-[#D4FF00] mb-3" />
                    <h3 className="font-bold text-white mb-1">Payment, charges or gift cards</h3>
                  </div>
                  <div className="p-4 border border-neutral-800 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors">
                    <Star className="w-8 h-8 text-[#D4FF00] mb-3" />
                    <h3 className="font-bold text-white mb-1">Prime Stock Membership</h3>
                  </div>
                </div>
            </div>
          </div>
        )}

        {currentView === 'registry' && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
             <h1 className="text-3xl font-black mb-8">Registry & Gifting</h1>
             <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-12 text-center">
                <Heart className="w-12 h-12 text-[#D4FF00] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-neutral-100 mb-2">Create a Registry</h2>
                <p className="text-neutral-400 mb-8">Easily share what you really want with family and friends.</p>
                <button
                  className="bg-white hover:bg-neutral-200 text-neutral-950 font-bold py-3 px-8 rounded-full transition-colors"
                >
                  Get Started
                </button>
            </div>
          </div>
        )}

        {currentView === 'gift-cards' && (
          <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
             <h1 className="text-3xl font-black mb-8">Gift Cards</h1>
             <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-12 text-center">
                <Package className="w-12 h-12 text-[#D4FF00] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-neutral-100 mb-2">Give the perfect gift</h2>
                <p className="text-neutral-400 mb-8">Prime Stock gift cards never expire and carry no fees.</p>
                <button
                  className="bg-[#D4FF00] hover:bg-white text-black font-black py-4 px-10 uppercase tracking-widest transition-colors"
                >
                  Buy a Gift Card
                </button>
            </div>
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
        className={`fixed inset-y-0 left-0 w-4/5 max-w-sm bg-neutral-950 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        <div className="bg-neutral-900 p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-neutral-800 p-2 rounded-full">
              <User className="w-5 h-5 text-white" />
            </div>
            {user ? (
               <span className="font-bold text-white text-lg truncate max-w-[200px]">Hello, {user.email?.split('@')[0]}</span>
            ) : (
               <button onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }} className="font-bold text-white text-lg hover:text-[#D4FF00]">Hello, Sign in</button>
            )}
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-neutral-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">Trending</h3>
          </div>
          <button onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors">
            Best Sellers
          </button>
          <button onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors">
            New Releases
          </button>
          
          <div className="my-4 border-t border-neutral-800" />
          
          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">Shop By Department</h3>
          </div>
          <button onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors">
            Electronics <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors">
            Computers <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 flex items-center justify-between transition-colors">
            Smart Home <ChevronRight className="w-4 h-4" />
          </button>
          
          <div className="my-4 border-t border-neutral-800" />

          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">Programs & Features</h3>
          </div>
          <button onClick={() => { setCurrentView('deals'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors">
            Today's Deals
          </button>
          <button onClick={() => { setCurrentView('gift-cards'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors">
            Gift Cards
          </button>
          <button onClick={() => { setCurrentView('registry'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors">
            Registry
          </button>

          <div className="my-4 border-t border-neutral-800" />

          <div className="px-6 mb-2">
            <h3 className="font-black text-lg text-white">Help & Settings</h3>
          </div>
          <button onClick={() => {
            if(user) {
              if (userRole === 'seller') {
                setCurrentView('seller'); setIsMenuOpen(false);
              } else {
                alert('You need a seller account to access this.');
              }
            } else {
              setIsAuthModalOpen(true); setIsMenuOpen(false);
            }
          }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors">
            Seller Dashboard
          </button>
          <button onClick={() => { setCurrentView('customer-service'); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-neutral-300 hover:bg-neutral-900 hover:text-[#D4FF00] transition-colors">
            Customer Service
          </button>
          {user && (
            <button onClick={() => { signOut(auth); setIsMenuOpen(false); }} className="w-full text-left px-6 py-3 text-red-400 hover:bg-neutral-900 transition-colors">
              Sign Out
            </button>
          )}
        </div>
      </div>

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
}

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
}

interface CartItem {
  product: Product;
  quantity: number;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    price: 348.00,
    category: 'Electronics',
    rating: 4.8,
    reviews: 12453,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=400',
    seller: 'Sony Direct'
  },
  {
    id: '2',
    name: 'Apple Watch Series 9 [GPS 45mm] Smartwatch with Midnight Aluminum Case',
    price: 399.00,
    category: 'Electronics',
    rating: 4.9,
    reviews: 8302,
    image: 'https://images.unsplash.com/photo-1434493789847-29088732c633?auto=format&fit=crop&q=80&w=400',
    seller: 'Apple Inc.'
  },
  {
    id: '3',
    name: 'YETI Rambler 20 oz Tumbler, Stainless Steel, Vacuum Insulated',
    price: 35.00,
    category: 'Kitchen',
    rating: 4.7,
    reviews: 45210,
    image: 'https://images.unsplash.com/photo-1544681280-d2dc2dd648f0?auto=format&fit=crop&q=80&w=400',
    seller: 'YETI Authorized Retailer'
  },
  {
    id: '4',
    name: 'Herschel Little America Laptop Backpack, Classic 25L',
    price: 109.99,
    category: 'Fashion',
    rating: 4.6,
    reviews: 3205,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    seller: 'Herschel Supply Co.'
  },
  {
    id: '5',
    name: 'Nike Men\'s Air Force 1 \'07 Basketball Shoe',
    price: 110.00,
    category: 'Fashion',
    rating: 4.8,
    reviews: 21940,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400',
    seller: 'Nike Official'
  },
  {
    id: '6',
    name: 'Ninja AF101 Air Fryer that Crisps, Roasts, Reheats, & Dehydrates',
    price: 89.95,
    category: 'Kitchen',
    rating: 4.8,
    reviews: 58210,
    image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400',
    seller: 'Ninja Kitchen'
  },
  {
    id: '7',
    name: 'Logitech MX Master 3S - Wireless Performance Mouse',
    price: 99.99,
    category: 'Electronics',
    rating: 4.7,
    reviews: 15420,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=400',
    seller: 'Logitech Store'
  },
  {
    id: '8',
    name: 'Hydro Flask Standard Mouth Bottle with Flex Cap',
    price: 34.95,
    category: 'Sports & Outdoors',
    rating: 4.8,
    reviews: 28900,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400',
    seller: 'Hydro Flask'
  }
];
