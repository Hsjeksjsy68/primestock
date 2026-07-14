import React from 'react';
import { TrendingUp, ShoppingCart, Heart } from 'lucide-react';

export default function BestSellers({ products, onViewProduct, addToCart, toggleFavorite, favorites }: { products: any[], onViewProduct: (id: string) => void, addToCart: (p: any) => void, toggleFavorite: (id: string) => void, favorites: string[] }) {
  // Mock best sellers by just showing first few products or randomizing
  // But we can just show products array in a specific layout
  
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <TrendingUp className="w-10 h-10 text-[#D4FF00]" />
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">BEST SELLERS</h1>
      </div>
      <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm mb-12">Our most popular products based on recent sales.</p>
      
      {products.length === 0 ? (
        <div className="text-center p-12 text-neutral-500 uppercase tracking-widest">No products available</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map(product => (
            <div key={product.id} className="group relative bg-neutral-900 border border-neutral-800 hover:border-[#D4FF00] transition-colors flex flex-col">
              <button
                onClick={() => toggleFavorite(product.id)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:text-[#D4FF00] transition-colors"
              >
                <Heart className={`w-5 h-5 ${favorites.includes(product.id) ? "fill-[#D4FF00] text-[#D4FF00]" : ""}`} />
              </button>
              <div 
                className="w-full aspect-[4/5] bg-neutral-800 overflow-hidden relative cursor-pointer"
                onClick={() => onViewProduct(product.id)}
              >
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-[#D4FF00] text-black text-[10px] font-black px-2 py-1 uppercase tracking-widest">
                  HOT
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-neutral-500 font-bold tracking-widest mb-1">{product.category}</div>
                  <h3 className="font-bold text-lg mb-2 text-white truncate cursor-pointer hover:text-[#D4FF00]" onClick={() => onViewProduct(product.id)}>
                    {product.name}
                  </h3>
                  <div className="font-black text-xl text-[#D4FF00] mb-4">${product.price.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-white text-black font-black uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:bg-[#D4FF00] transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
