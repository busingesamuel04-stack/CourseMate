import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { ProductCard, ProductData } from '../components/marketplace/ProductCard';
import { EmptyMarketplace } from '../components/marketplace/EmptyMarketplace';
import { CreateListingModal } from '../components/marketplace/CreateListingModal';
import {
  ShoppingBag,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Tag,
} from 'lucide-react';

interface MarketplacePageProps {
  onBack?: () => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onBack }) => {
  const { marketplaceItems, student, openModal, selectedUniversity } = useApp();
  const activeUni = selectedUniversity || student?.university || 'ISBAT University';

  const [products, setProducts] = useState<ProductData[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'All',
    'Books & Textbooks',
    'Electronics & Gadgets',
    'Hostel & Dorm Gear',
    'Calculators & Stationery',
    'General',
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch live products from Supabase
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (catData && catData.length > 0) {
        const uniqueNames = Array.from(new Set(catData.map((c) => c.name)));
        setCategoriesList(['All', ...uniqueNames]);
      }

      // 2. Fetch products with joined profiles and categories
      const { data: prodData, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          condition,
          description,
          image_urls,
          category_id,
          created_at,
          profiles (
            full_name,
            is_verified,
            whatsapp_number
          ),
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && prodData && prodData.length > 0) {
        const liveItems: ProductData[] = prodData.map((item: any) => ({
          id: item.id,
          title: item.title,
          price: Number(item.price) || 0,
          condition: item.condition || 'Good',
          image_urls: item.image_urls && item.image_urls.length > 0
            ? item.image_urls
            : ['https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=60'],
          profiles: {
            full_name: item.profiles?.full_name || 'Campus Student',
            is_verified: Boolean(item.profiles?.is_verified ?? true),
            whatsapp_number: item.profiles?.whatsapp_number || '+256701234567',
          },
          categories: {
            name: item.categories?.name || 'General',
          },
        }));

        setProducts(liveItems);
      } else {
        // Fallback to local / mock dataset if Supabase table is empty or offline
        const mockFallback: ProductData[] = marketplaceItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: Number(String(item.price).replace(/[^0-9.-]+/g, '')) || 45000,
          condition: item.condition || 'Like New',
          image_urls: [
            'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=60',
          ],
          profiles: {
            full_name: item.sellerName || 'Verified Peer',
            is_verified: true,
            whatsapp_number: '+256772123456',
          },
          categories: {
            name: item.category || 'Books & Textbooks',
          },
        }));

        setProducts(mockFallback);
      }
    } catch {
      // Offline fallback
      const mockFallback: ProductData[] = marketplaceItems.map((item) => ({
        id: item.id,
        title: item.title,
        price: Number(String(item.price).replace(/[^0-9.-]+/g, '')) || 45000,
        condition: item.condition || 'Like New',
        image_urls: [
          'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=60',
        ],
        profiles: {
          full_name: item.sellerName || 'Verified Peer',
          is_verified: true,
          whatsapp_number: '+256772123456',
        },
        categories: {
          name: item.category || 'General',
        },
      }));
      setProducts(mockFallback);
    } finally {
      setLoading(false);
    }
  }, [marketplaceItems]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Client-side filtering by category & search query
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const catName = prod.categories?.name || 'General';
      const matchesCategory =
        selectedCategory === 'All' ||
        catName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(catName.toLowerCase());

      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        prod.title.toLowerCase().includes(query) ||
        prod.profiles.full_name.toLowerCase().includes(query) ||
        catName.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  const handleProductClick = (item: ProductData) => {
    // Open legacy or detail modal
    openModal('marketplace-detail', {
      id: item.id,
      title: item.title,
      price: `UGX ${Number(item.price).toLocaleString()}`,
      category: item.categories?.name || 'General',
      condition: item.condition,
      sellerName: item.profiles.full_name,
      description: `Available for handoff at ${activeUni}. Direct contact via WhatsApp: ${item.profiles.whatsapp_number || 'available upon request'}.`,
      university: activeUni,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative pb-12">
      {/* Top Back Navigation (if onBack provided) */}
      {onBack && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141522] border border-white/[0.08] shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Campus Hub</span>
          </button>
          <span className="text-xs font-bold text-zinc-400">Marketplace</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] text-white shadow-xl border border-white/[0.1]">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeUni.split(' ')[0]} Student Exchange
              </span>
              <span>·</span>
              <span>Direct WhatsApp Trade ({products.length} live)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed">
              Buy and sell course textbooks, scientific calculators, dorm equipment, and electronics safely with fellow {activeUni} peers.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start sm:self-center px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-purple-950 font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sell Item</span>
          </button>
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

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-2.5 rounded-full bg-[#13141F] hover:bg-[#1C1E2D] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh products"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Sell Item</span>
            </button>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
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

      {/* Product Cards Grid or Empty State */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyMarketplace onSellClick={() => setIsCreateModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((item) => (
            <ProductCard
              key={item.id}
              data={item}
              onClick={handleProductClick}
            />
          ))}
        </div>
      )}

      {/* Floating "+ Sell Item" Action Button for Quick Access */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] right-5 z-40 sm:bottom-8 sm:right-8 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs sm:text-sm px-5 py-3 rounded-full shadow-2xl shadow-indigo-600/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        aria-label="Post a new listing"
      >
        <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        <span>Sell Item</span>
      </button>

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
};
