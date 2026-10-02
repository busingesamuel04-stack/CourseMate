import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  Phone,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useApp } from '../../context/AppContext';

export interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'cat-books', name: 'Books & Textbooks' },
  { id: 'cat-electronics', name: 'Electronics & Gadgets' },
  { id: 'cat-hostel', name: 'Hostel & Dorm Gear' },
  { id: 'cat-stationery', name: 'Calculators & Stationery' },
  { id: 'cat-clothing', name: 'Apparel & Merch' },
  { id: 'cat-other', name: 'General & Other' },
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;

const DEFAULT_PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=500&auto=format&fit=crop&q=60';

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { student, selectedUniversity } = useApp();

  // Form states
  const [title, setTitle] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<typeof CONDITIONS[number]>('Like New');
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Image upload states (up to 3 images)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Categories from Supabase
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Submission & Validation states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load categories and user WhatsApp profile
  useEffect(() => {
    if (!isOpen) return;

    fetchCategories();
    loadSellerProfile();
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (!error && data && data.length > 0) {
        setCategories(data);
        if (!categoryId) setCategoryId(data[0].id);
      } else {
        setCategories(DEFAULT_CATEGORIES);
        if (!categoryId) setCategoryId(DEFAULT_CATEGORIES[0].id);
      }
    } catch {
      setCategories(DEFAULT_CATEGORIES);
      if (!categoryId) setCategoryId(DEFAULT_CATEGORIES[0].id);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSellerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('whatsapp_number, phone, full_name')
          .eq('id', user.id)
          .single();

        if (profile?.whatsapp_number) {
          setWhatsappNumber(profile.whatsapp_number);
        } else if (profile?.phone) {
          setWhatsappNumber(profile.phone);
        }
      }
    } catch {
      // Fallback
    }
  };

  // Image Selection Handler (max 3)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 3 - imageFiles.length;
    if (remainingSlots <= 0) {
      setErrorMessage('You can upload a maximum of 3 images.');
      return;
    }

    const selectedToKeep = files.slice(0, remainingSlots);
    const newFiles = [...imageFiles, ...selectedToKeep];
    setImageFiles(newFiles);

    // Create object URLs for previews
    const newPreviews = selectedToKeep.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setErrorMessage(null);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  // Format Price with thousands separators
  const handlePriceChange = (val: string) => {
    // Strip everything except numbers
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      setPriceInput('');
      return;
    }
    const num = parseInt(clean, 10);
    setPriceInput(num.toLocaleString());
  };

  const getNumericPrice = (): number => {
    const clean = priceInput.replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validation
    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage('Please provide a descriptive title (at least 3 characters).');
      return;
    }

    const price = getNumericPrice();
    if (!price || price <= 0) {
      setErrorMessage('Please enter a valid price in UGX.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please select a category.');
      return;
    }

    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMessage('Please enter a valid WhatsApp phone number (at least 9 digits).');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Upload images to Supabase Storage bucket 'marketplace-images'
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${i}.${ext}`;
        const filePath = `listings/${fileName}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from('marketplace-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('marketplace-images')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedUrls.push(publicUrlData.publicUrl);
            }
          } else {
            console.warn('[Marketplace Storage] Upload error:', uploadError.message);
          }
        } catch (storageErr) {
          console.warn('[Marketplace Storage] Upload exception:', storageErr);
        }
      }

      // Fallback placeholder image if no images uploaded
      if (uploadedUrls.length === 0) {
        uploadedUrls.push(DEFAULT_PLACEHOLDER_IMAGE);
      }

      // 3. Update Seller's profile WhatsApp number if logged in
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            whatsapp_number: cleanPhone,
            full_name: student?.name || user.user_metadata?.full_name || 'Campus Student',
          })
          .eq('id', user.id);
      }

      // 4. Insert into 'products' table
      const newProductRecord = {
        title: title.trim(),
        price,
        condition,
        description: description.trim(),
        image_urls: uploadedUrls,
        category_id: categoryId.startsWith('cat-') ? null : categoryId,
        user_id: user?.id || null,
        university: selectedUniversity || student?.university || 'ISBAT University',
      };

      const { error: insertError } = await supabase
        .from('products')
        .insert([newProductRecord]);

      if (insertError) {
        console.warn('[Marketplace] DB Insert error:', insertError.message);
        // If categories foreign key is strictly UUID and fallback cat- was used, retry with general null category
        if (insertError.message?.includes('category_id') || insertError.code === '23503') {
          await supabase.from('products').insert([{ ...newProductRecord, category_id: null }]);
        }
      }

      setSuccessMessage('Listing published successfully! Refreshing marketplace...');

      // Notify caller & reset form
      setTimeout(() => {
        onSuccess?.();
        handleReset();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('[Marketplace] Publish failed:', err);
      setErrorMessage(err.message || 'Failed to publish listing. Please check your connection.');
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setPriceInput('');
    setDescription('');
    setImageFiles([]);
    setImagePreviews([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal / Bottom Sheet Card */}
      <div
        className="relative w-full sm:max-w-xl max-h-[92dvh] bg-[#12131F] border border-white/[0.12] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)',
        }}
      >
        {/* Mobile Swipe / Dismiss Handle Indicator */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5">
                <span>Create Student Listing</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Direct Trade
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                List for verified students on campus with 1-tap WhatsApp chat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4 text-xs">
          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <p className="font-semibold leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <p className="font-semibold leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* 1. Image Upload Section (Up to 3 images) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Product Photos</span>
                <span className="text-[10px] text-zinc-500 normal-case font-medium">
                  ({imagePreviews.length}/3 max · optional)
                </span>
              </label>
              {imagePreviews.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photo</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Images Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {imagePreviews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-[#1A1F2E] border border-white/10 group"
                >
                  <img
                    src={src}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-black/70 text-indigo-300 border border-white/10">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {imagePreviews.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-zinc-400 hover:text-white"
                >
                  <Upload className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px] font-bold">Upload</span>
                  <span className="text-[9px] text-zinc-500">Max 3</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 italic">
              Leave blank to automatically use a curated university item cover photo.
            </p>
          </div>

          {/* 2. Title Field */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Item Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engineering Mathematics IV Textbook (K.A. Stroud, 8th Ed)"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs sm:text-sm"
            />
          </div>

          {/* 3. Price & Condition Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Price in UGX <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-zinc-400 font-mono">
                  UGX
                </span>
                <input
                  type="text"
                  required
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="35,000"
                  className="w-full pl-13 pr-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-extrabold placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs sm:text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Condition <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`py-2 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer text-center ${
                      condition === c
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                        : 'bg-[#090A0E] hover:bg-white/5 border border-white/[0.08] text-zinc-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Category & WhatsApp Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none text-xs"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Tag className="w-3.5 h-3.5 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Seller's WhatsApp Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +256 701 234 567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 5. Description Field */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Description & Campus Pickup Location
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight edition, condition details, working status, and where on campus you can hand over the item..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none text-xs leading-relaxed"
            />
          </div>

          {/* Footer Submit Action */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-full font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-initial px-7 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>Publish Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
