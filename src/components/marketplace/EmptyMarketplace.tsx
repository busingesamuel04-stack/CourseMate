import React from 'react';

interface Props {
  onSellClick: () => void;
}

export const EmptyMarketplace: React.FC<Props> = ({ onSellClick }) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-8 mt-6 bg-[#131622]/50 border border-white/5 rounded-3xl text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-white mb-1">No items found</h3>
      <p className="text-sm text-white/50 max-w-[280px] mb-6 leading-relaxed">
        Be the first to list a course textbook, dorm item, or electronics in this category.
      </p>

      <button
        onClick={onSellClick}
        className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
      >
        + Post First Listing
      </button>
    </div>
  );
};
