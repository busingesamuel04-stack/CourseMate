import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  Link2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Smartphone,
  School,
  ShieldCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { SupportedUniversity, SUPPORTED_UNIVERSITIES } from '../../types';

export const SourceConnectModal: React.FC = () => {
  const {
    closeModal,
    modalData,
    syncPortalData,
    isPortalSynced,
    student,
    selectedUniversity,
    setSelectedUniversity,
  } = useApp();

  const [selectedSource, setSelectedSource] = useState<'portal' | 'lms' | 'pdf' | 'whatsapp'>(
    modalData?.initialSource || 'portal'
  );
  const [selectedUni, setSelectedUni] = useState<SupportedUniversity>(
    selectedUniversity || 'ISBAT University'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [scrapingStage, setScrapingStage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Portal form credentials (clean, never pre-filled with demo values)
  const [portalUsername, setPortalUsername] = useState<string>(() => {
    if (student?.regNumber && student.regNumber !== 'Not Synced' && student.university === selectedUni) {
      return student.regNumber;
    }
    return '';
  });
  const [portalPassword, setPortalPassword] = useState<string>('');

  const [syncSummary, setSyncSummary] = useState<{
    studentName: string;
    regNumber: string;
    coursesCount: number;
    feeStatus: string;
    university?: string;
  } | null>(null);

  const handleUniversityChange = (newUni: SupportedUniversity) => {
    setSelectedUni(newUni);
    setSelectedUniversity(newUni);
    if (student?.regNumber && student.regNumber !== 'Not Synced' && student.university === newUni) {
      setPortalUsername(student.regNumber);
    } else {
      setPortalUsername('');
    }
    setPortalPassword('');
    setIsSuccess(false);
    setErrorMessage(null);
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setIsProcessing(true);
      setErrorMessage(null);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 1200);
    }
  };

  const handleConnectPortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUsername.trim() || !portalPassword.trim()) {
      setErrorMessage('Please enter both your Student ID / Registration Number and Password.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setIsSuccess(false);
    setSyncSummary(null);

    // Multi-stage loading skeleton progress
    setScrapingStage(`Initiating secure TLS session with ${selectedUni} portal...`);
    const timer1 = setTimeout(() => {
      setScrapingStage(`Authenticating credentials on ${selectedUni === 'ISBAT University' ? 'erp.isbatuniversity.ac.ug' : 'ACMIS portal'}...`);
    }, 1200);
    const timer2 = setTimeout(() => {
      setScrapingStage('Navigating student dashboard & extracting registered modules...');
    }, 3200);
    const timer3 = setTimeout(() => {
      setScrapingStage('Reconciling academic attendance and official tuition ledger...');
    }, 5500);

    try {
      const response = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: portalUsername.trim(),
          password: portalPassword.trim(),
          university: selectedUni,
          mock: false,
          useMock: false,
        }),
      });

      const data = await response.json();

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (response.ok && data.status === 'success') {
        syncPortalData(data, selectedUni);
        setIsSuccess(true);
        setSyncSummary({
          studentName: data.student?.name || portalUsername.toUpperCase(),
          regNumber: data.student?.regNumber || portalUsername,
          coursesCount: data.courses?.length || 0,
          feeStatus: data.feeSummary?.outstandingBalance || 'Account Verified',
          university: selectedUni,
        });
      } else {
        const msg = data.message || `Authentication failed for ${selectedUni}. Please verify your student credentials.`;
        setErrorMessage(msg);
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorMessage(err.message || 'Unable to contact university portal. Please check your network connection.');
    } finally {
      setIsProcessing(false);
      setScrapingStage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#12131F] border border-white/[0.1] rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-5 text-white modal-sheet-dynamic overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Academic Data Synchronization</span>
            </span>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Sync University Records
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium leading-relaxed">
            Connect your official student portal to automatically ingest enrolled modules, timetable schedules, exam dates, and tuition balance.
          </p>
        </div>

        {/* Source selector tabs */}
        <div className="grid grid-cols-4 gap-2 text-xs bg-[#090A0E] border border-white/[0.06] p-1.5 rounded-2xl">
          {[
            { id: 'portal', label: 'University Portal', icon: School },
            { id: 'pdf', label: 'Upload PDF', icon: Upload },
            { id: 'lms', label: 'Moodle LMS', icon: Link2 },
            { id: 'whatsapp', label: 'WhatsApp Bot', icon: Smartphone },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setSelectedSource(id as any);
                setIsSuccess(false);
                setErrorMessage(null);
              }}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedSource === id
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] truncate font-bold">{label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Source Form */}
        <div className="space-y-4 text-xs">
          {/* 1. Official Portal Form */}
          {selectedSource === 'portal' && (
            <div className="space-y-4">
              {/* University Selector Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                  Select University / Institution
                </label>
                <select
                  value={selectedUni}
                  onChange={(e) => handleUniversityChange(e.target.value as SupportedUniversity)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  {SUPPORTED_UNIVERSITIES.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni} {uni === 'ISBAT University' ? '(Official ISMIS ERP)' : '(Official ACMIS Portal)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Portal Credentials Form */}
              <form onSubmit={handleConnectPortal} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                    {selectedUni === 'ISBAT University'
                      ? 'Registration Number / Student ID'
                      : 'Student No. / Reg No. (e.g. 22/U/1048 or 2100...)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      selectedUni === 'ISBAT University'
                        ? 'Enter ISBAT Registration No.'
                        : 'Enter Student Registration Number'
                    }
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                    {selectedUni === 'ISBAT University' ? 'Portal Password' : 'ACMIS Portal Password / PIN'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your portal password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-zinc-600"
                  />
                </div>

                {/* Production Security Badge */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-zinc-300 font-medium">
                    Your portal credentials are used exclusively in an encrypted session to sync your academic ledger and are never stored in plaintext.
                  </p>
                </div>

                {/* Loading Skeleton */}
                {isProcessing && (
                  <div className="p-4 rounded-2xl bg-[#090A0E] border border-indigo-500/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                        <span>{scrapingStage || `Connecting to ${selectedUni}...`}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">TLS SECURE</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="h-2.5 bg-white/[0.08] rounded-full animate-pulse w-full" />
                      <div className="h-2.5 bg-white/[0.05] rounded-full animate-pulse w-4/5" />
                      <div className="h-2.5 bg-white/[0.06] rounded-full animate-pulse w-2/3" />
                    </div>

                    <p className="text-[10px] text-zinc-500">
                      Scraper running in secure sandbox. This typically takes 5–15 seconds depending on university portal response time.
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold block">Portal Synchronization Error</span>
                      <span className="text-[11px] leading-relaxed">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Success Card */}
                {isSuccess && syncSummary && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Ledger Verified & Synchronized</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Student Name</span>
                        <span className="font-bold text-white truncate block">{syncSummary.studentName}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Registration</span>
                        <span className="font-bold text-white truncate block">{syncSummary.regNumber}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Course Units</span>
                        <span className="font-bold text-white">{syncSummary.coursesCount} Enrolled</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase font-bold">Tuition Status</span>
                        <span className="font-bold text-emerald-400">{syncSummary.feeStatus}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white py-3 rounded-2xl text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <span>Scraping {selectedUni}...</span>
                  ) : isSuccess ? (
                    <span>Sync Again</span>
                  ) : (
                    <>
                      <span>Authenticate & Sync</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 2. PDF Upload */}
          {selectedSource === 'pdf' && (
            <div className="p-6 rounded-2xl border-2 border-dashed border-white/[0.12] hover:border-indigo-500/50 text-center space-y-3 transition-colors bg-[#090A0E]">
              <Upload className="w-8 h-8 text-zinc-400 mx-auto" />
              <div>
                <p className="font-bold text-white text-sm">
                  Upload Course Outline, Past Paper, or Timetable
                </p>
                <p className="text-zinc-400 text-[11px] mt-0.5 font-medium">
                  PDF, DOCX, or Image (Max 25MB)
                </p>
              </div>

              <label className="inline-block bg-white hover:bg-zinc-100 text-black px-5 py-2.5 rounded-full text-xs font-bold shadow-md cursor-pointer transition-all">
                <span>Browse Files</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg"
                  onChange={handleSimulateUpload}
                  className="hidden"
                />
              </label>

              {fileName && (
                <div className="flex items-center justify-center gap-2 text-zinc-200 font-bold text-xs pt-1">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
          )}

          {/* 3. Moodle LMS */}
          {selectedSource === 'lms' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsProcessing(true);
                setTimeout(() => {
                  setIsProcessing(false);
                  setIsSuccess(true);
                }, 1000);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  University Moodle URL
                </label>
                <input
                  type="text"
                  required
                  defaultValue={
                    selectedUni === 'Makerere University'
                      ? 'https://muele.mak.ac.ug'
                      : selectedUni === 'Kyambogo University'
                      ? 'https://kelms.kyu.ac.ug'
                      : selectedUni === 'MUBS'
                      ? 'https://mubselearning.mubs.ac.ug'
                      : 'https://elearning.isbatuniversity.ac.ug'
                  }
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#090A0E] border border-white/[0.08] text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-white hover:bg-zinc-100 text-black py-3 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Connect Moodle Web Services Token</span>
              </button>
            </form>
          )}

          {/* 4. WhatsApp Class Rep Announcements */}
          {selectedSource === 'whatsapp' && (
            <div className="p-4 rounded-2xl bg-[#090A0E] border border-white/[0.08] space-y-2">
              <h4 className="font-bold text-white text-sm">
                Class WhatsApp Rep Group Ingestion
              </h4>
              <p className="text-zinc-300 leading-relaxed font-normal">
                Forward official course announcement broadcasts or export WhatsApp group chat text. CourseMate automatically categorizes timetable shifts and tests.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsProcessing(true);
                    setTimeout(() => {
                      setIsProcessing(false);
                      setIsSuccess(true);
                    }, 1000);
                  }}
                  className="bg-white hover:bg-zinc-100 text-black px-5 py-2.5 rounded-full text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Verify WhatsApp Course Bot Integration
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <span className="text-[11px] text-zinc-500 font-medium">
            {isPortalSynced ? `✓ ${selectedUniversity} Connected` : 'Portal Not Synced'}
          </span>
          <button
            onClick={closeModal}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-zinc-300 bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const AcademicConnectionsModal = SourceConnectModal;
