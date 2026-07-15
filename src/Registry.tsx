import { ClipboardList } from 'lucide-react';

export default function Registry() {
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 text-center py-12">
      <div className="inline-flex items-center justify-center w-24 h-24 border-2 border-[#D4FF00] mb-8">
        <ClipboardList className="w-10 h-10 text-[#D4FF00]" />
      </div>
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-white">
        GIFT REGISTRY
      </h1>
      <p className="text-neutral-400 font-medium max-w-xl mx-auto uppercase tracking-widest text-sm mb-12">
        Create and manage registries for weddings, birthdays, or special events. Build your wishlist and share it with friends and family.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
        <div className="bg-black border-2 border-neutral-800 p-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Find a Registry</h3>
          <input placeholder="Enter name or registry ID" className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3 mb-4 focus:border-[#D4FF00] outline-none" />
          <button className="w-full bg-white text-black font-black uppercase tracking-widest py-4 hover:bg-[#D4FF00] transition-colors">
            Search
          </button>
        </div>
        <div className="bg-black border-2 border-neutral-800 p-8">
          <h3 className="text-2xl font-black text-[#D4FF00] uppercase tracking-widest mb-4">Create a Registry</h3>
          <p className="text-neutral-500 text-sm mb-6">Sign in to start adding items to your personalized registry.</p>
          <button className="w-full bg-[#D4FF00] text-black font-black uppercase tracking-widest py-4 hover:bg-white transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
