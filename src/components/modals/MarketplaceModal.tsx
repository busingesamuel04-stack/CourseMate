import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Send,
  Check,
  User,
} from 'lucide-react';
import { MarketplaceItem, SupportedUniversity } from '../../types';
import { getUniversityCampusVenues } from '../../data/mockData';

export const MarketplaceModal: React.FC = () => {
  const { modalData, closeModal, triggerCelebration, selectedUniversity, student } = useApp();
  const item: MarketplaceItem = modalData;

  const activeUni: SupportedUniversity =
    (item?.university as SupportedUniversity) ||
    selectedUniversity ||
    (student.university as SupportedUniversity) ||
    'ISBAT University';
  const campusMeetupVenues = getUniversityCampusVenues(activeUni);

  const [activeTab, setActiveTab] = useState<'details' | 'make-offer'>('details');
  const [selectedVenue, setSelectedVenue] = useState(campusMeetupVenues[0] || 'Main Campus Library Foyer');
  const [customOffer, setCustomOffer] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(
    'Hi! I saw your listing on CourseMate. Is this still available today?'
  );
  const [offerSent, setOfferSent] = useState(false);

  if (!item) return null;

  const quickMessageChips = [
    'Hi! Is this still available today?',
    `Can we meet at ${campusMeetupVenues[0] || 'Main Campus'} for inspection?`,
    'Is the price negotiable?',
    'I can pay cash or Mobile Money right away.',
  ];

  const handleSendOffer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOfferSent(true);
    triggerCelebration();

    // Create a real WhatsApp link with prefilled text
    const fullText = encodeURIComponent(
      `Hello ${item.sellerName}, regarding your CourseMate listing "${item.title}" (${item.price}):\n` +
      `${customOffer ? `My offer: UGX ${customOffer}\n` : ''}` +
      `Proposed meetup: ${selectedVenue}\n` +
      `Message: "${selectedMessage}"`
    );
    const whatsappUrl = `https://wa.me/${item.contactNumber.replace(/[^0-9]/g, '')}?text=${fullText}`;
    
    // Open in separate safe tab if requested
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#13141D] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white modal-sheet-dynamic overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold py-1 px-3 rounded-full uppercase tracking-wider">
              {item.category}
            </span>
            <span className="text-[11px] font-bold text-zinc-400 bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
              {item.condition}
            </span>
          </div>

          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 rounded-2xl bg-[#090A0E] border border-white/[0.06] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'details'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Listing Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('make-offer')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'make-offer'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat & Make Offer</span>
          </button>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {item.title}
              </h2>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-indigo-400 tabular-nums">
                  {item.price}
                </p>
                <span className="text-xs text-zinc-400 font-medium">
                  (UGX {item.priceUgx.toLocaleString()})
                </span>
              </div>
            </div>

            {/* Seller Badge */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-white">{item.sellerName}</p>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Verified Student
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    {item.sellerYear} · Location: {item.location}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-zinc-400">
                {item.contactNumber}
              </span>
            </div>

            {/* Description */}
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px]">
                Description & Notes
              </h4>
              <p className="text-zinc-300 leading-relaxed font-normal p-3.5 rounded-2xl bg-[#090A0E] border border-white/[0.08]">
                {item.description}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => setActiveTab('make-offer')}
                className="bg-white hover:bg-zinc-100 text-black px-6 py-2.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Contact & Make Offer</span>
              </button>
            </div>
          </div>
        )}

        {/* Make Offer & Chat Tab */}
        {activeTab === 'make-offer' && (
          <form onSubmit={handleSendOffer} className="space-y-4 text-xs">
            {offerSent && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Inquiry opened! Connecting you with {item.sellerName} on WhatsApp...</span>
              </div>
            )}

            {/* Counter Offer Input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Your Price Offer (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-xs">
                  UGX
                </span>
                <input
                  type="text"
                  value={customOffer}
                  onChange={(e) => setCustomOffer(e.target.value)}
                  placeholder={`Listing price is ${item.price} (e.g. ${(item.priceUgx * 0.9).toLocaleString()})`}
                  className="w-full pl-14 pr-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Quick Chips */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Quick Message Template
              </label>
              <div className="space-y-1.5">
                {quickMessageChips.map((chip, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedMessage(chip)}
                    className={`w-full text-left p-2.5 rounded-xl font-medium text-xs transition-all border ${
                      selectedMessage === chip
                        ? 'border-indigo-500/50 bg-indigo-500/15 text-white font-bold'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300'
                    }`}
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>

            {/* Campus Safe Meet-up Location */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Preferred Campus Meet-up Spot
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campusMeetupVenues.map((venue) => (
                  <button
                    type="button"
                    key={venue}
                    onClick={() => setSelectedVenue(venue)}
                    className={`p-2.5 rounded-xl text-left text-[11px] font-medium transition-all border ${
                      selectedVenue === venue
                        ? 'border-indigo-500/50 bg-indigo-500/15 text-white font-bold'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300'
                    }`}
                  >
                    {venue}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Field */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Full Message to {item.sellerName}
              </label>
              <textarea
                rows={2}
                value={selectedMessage}
                onChange={(e) => setSelectedMessage(e.target.value)}
                className="w-full p-3 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-medium resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="px-4 py-2 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Back to Details
              </button>

              <button
                type="submit"
                className="bg-white hover:bg-zinc-100 text-black px-6 py-2.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp Offer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
