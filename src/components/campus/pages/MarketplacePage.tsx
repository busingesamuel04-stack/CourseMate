import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  ShoppingBag,
  Search,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';

interface MarketplacePageProps {
  onBack: () => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = () => {
  const { marketplaceItems, student, openModal, selectedUniversity } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Books', 'Electronics', 'Hostel Gear', 'Stationery'];

  const scopedMarketplace = useMemo(() => {
    return marketplaceItems.filter((item) => !item.university || item.university === activeUni);
  }, [marketplaceItems, activeUni]);

  const filtered = useMemo(() => {
    return scopedMarketplace.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.sellerName.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [scopedMarketplace, selectedCategory, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#9333EA] via-[#7E22CE] to-[#581C87] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Economy & Utility
              </span>
              <span>·</span>
              <span>Verified Student Trade ({scopedMarketplace.length})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
              Buy and sell pre-loved course textbooks, scientific calculators, hostel equipment, and electronics safely with fellow verified {student?.university || 'campus'} peers.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search textbooks, calculators, monitors, or gear..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#13141F] border border-white/[0.08] text-xs sm:text-sm font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#181A27] hover:bg-[#202334] border border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filtered.length === 0 ? (
        <div className="ios-liquid-card p-10 text-center rounded-[28px] max-w-md mx-auto space-y-3">
          <ShoppingBag className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">No items found</h3>
          <p className="text-xs text-zinc-400">
            No items matched your search query. Try another search or select "All".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => openModal('marketplace-detail', item)}
              className="ios-liquid-card p-5 card-soft-hover cursor-pointer shadow-hi-fi-md flex flex-col justify-between liquid-sheen space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="pill-tag-coral text-[9px] py-0.5 px-2 font-bold uppercase">
                    {item.category}
                  </span>
                  <span className="font-bold text-zinc-400 bg-[#1A1C2B] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                    {item.condition}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                <p className="text-lg font-extrabold text-indigo-400 tabular-nums pt-1">
                  {item.price}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300 font-semibold truncate">
                    {item.sellerName}
                  </span>
                </div>

                <span className="bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1 rounded-full text-white text-[11px] font-bold shadow-xs flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>Offer</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
