import React from 'react';

export interface ProductData {
  id: string;
  title: string;
  price: number | string;
  condition: string;
  image_urls?: string[];
  profiles: {
    full_name: string;
    is_verified?: boolean;
    whatsapp_number?: string;
  };
  categories?: {
    name: string;
  };
}

export interface ProductCardProps {
  data: ProductData;
  onClick?: (item: ProductData) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ data, onClick }) => {
  const { title, price, condition, image_urls, profiles, categories } = data;
  const mainImage = image_urls?.[0] || 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=60';

  // Construct direct WhatsApp message link
  const cleanNumber = profiles?.whatsapp_number?.replace(/\D/g, '') || '';
  const message = encodeURIComponent(`Hi ${profiles?.full_name || 'there'}, I saw your listing "${title}" on SemesterDeck and I'm interested in buying it.`);
  const whatsappUrl = cleanNumber ? `https://wa.me/${cleanNumber}?text=${message}` : '#';

  // Parse numeric price for formatting if passed as string/number
  const numericPrice = typeof price === 'number' ? price : Number(String(price).replace(/[^0-9.-]+/g, '')) || 0;

  return (
    <div
      onClick={() => onClick?.(data)}
      className="flex flex-col bg-[#131622] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 active:scale-[0.98] group cursor-pointer"
    >
      {/* Product Image Container (1:1 Ratio) */}
      <div className="relative aspect-square w-full bg-[#1A1F2E] overflow-hidden">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Condition Tag */}
        {condition && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[11px] font-semibold bg-black/60 backdrop-blur-md text-white/90 rounded-md border border-white/10">
            {condition}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-3.5 justify-between">
        <div>
          {/* Category */}
          <p className="text-[11px] font-medium text-indigo-400 mb-1">
            {categories?.name || 'General'}
          </p>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white/90 line-clamp-1 group-hover:text-indigo-300 transition-colors">
            {title}
          </h3>

          {/* Price (UGX formatted) */}
          <p className="text-base font-bold text-white mt-1">
            UGX {numericPrice > 0 ? numericPrice.toLocaleString() : (typeof price === 'string' ? price : '0')}
          </p>
        </div>

        {/* Seller Info & WhatsApp CTA */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-white/60 truncate font-medium">
              {profiles?.full_name || 'Anonymous Seller'}
            </span>
            {profiles?.is_verified && (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                Verified
              </span>
            )}
          </div>

          {/* WhatsApp Direct Hook */}
          {cleanNumber ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center shrink-0"
              title="Chat on WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/>
              </svg>
            </a>
          ) : (
            <span className="text-[10px] text-white/40 italic">No phone</span>
          )}
        </div>
      </div>
    </div>
  );
};
