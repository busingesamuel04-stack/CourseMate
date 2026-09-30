import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SupportedUniversity } from '../../types';
import { INSTITUTIONS, InstitutionConfig, getInstitution } from '../../config/institutions';
import {
  Sparkles,
  School,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  RefreshCw,
  Building2,
  Check,
  Calendar,
  CreditCard,
  BookOpen,
  User,
  Plus,
} from 'lucide-react';
import {
  signInWithEmailPassword,
} from '../../services/supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map institution id → SupportedUniversity display name (legacy compatibility) */
const INSTITUTION_TO_DISPLAY: Record<string, SupportedUniversity> = {
  mak: 'Makerere University',
  kyu: 'Kyambogo University',
  mubs: 'MUBS',
  isbat: 'ISBAT University',
};

/** Small icon for institution card */
function InstitutionIcon({ institution, active }: { institution: InstitutionConfig; active: boolean }) {
  const cls = `w-5 h-5`;
  if (institution.id === 'isbat') return <ShieldCheck className={cls} />;
  if (institution.id === 'mak') return <Building2 className={cls} />;
  return <School className={cls} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const OnboardingFlow: React.FC = () => {
  const {
    setSelectedUniversity,
    syncPortalData,
    completeOnboarding,
  } = useApp();

  // Current Step: 1 = Identity, 2 = Institution, 3 = Portal Sync
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Identity State
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentFullName, setStudentFullName] = useState('');
  const [authFeedback, setAuthFeedback] = useState<{ type: 'info' | 'error'; text: string } | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Step 2: Institution Selection
  const defaultInstitution = INSTITUTIONS.find((i) => i.id === 'isbat') ?? INSTITUTIONS[0];
  const [chosenInstitution, setChosenInstitution] = useState<InstitutionConfig>(defaultInstitution);

  // Step 3: Portal Sync State
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedbackStage, setSyncFeedbackStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Step 1: Google sign-in click - show helpful toast notification
  const handleGoogleSignIn = () => {
    setAuthFeedback({
      type: 'info',
      text: 'Google Sign-In is being configured. Please use email.',
    });
  };

  // Step 1: Email + Password submission
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    if (studentPassword.trim() && studentPassword.trim().length < 6) {
      setAuthFeedback({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setIsSigningIn(true);
    setAuthFeedback(null);
    try {
      if (studentPassword.trim()) {
        const res = await signInWithEmailPassword(studentEmail.trim(), studentPassword.trim());
        if (res.error) {
          // Continue with local session smoothly
          setAuthFeedback({ type: 'info', text: 'Continuing with student workspace session.' });
        }
      }
      const inferredName =
        studentFullName.trim() ||
        studentEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      setStudentFullName(inferredName);
      setCurrentStep(2);
    } catch {
      const inferredName =
        studentFullName.trim() ||
        studentEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      setStudentFullName(inferredName);
      setCurrentStep(2);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Step 1: Skip — explore as guest
  const handleExploreAsGuest = () => {
    setStudentFullName('Guest Student');
    setStudentEmail('');
    setCurrentStep(2);
  };

  // Step 2: Selecting an institution updates state and advances to Step 3
  const handleSelectInstitution = (inst: InstitutionConfig) => {
    setChosenInstitution(inst);
    setSelectedUniversity(INSTITUTION_TO_DISPLAY[inst.id]);
    setPortalUsername('');
    setPortalPassword('');
    setErrorMessage(null);
    setCurrentStep(3);
  };

  // Step 3: Portal Sync Submission
  const handlePortalSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUsername.trim() || !portalPassword.trim()) {
      setErrorMessage(
        `Please enter your ${chosenInstitution.credentialFields.usernameLabel.toLowerCase()} and password.`
      );
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);

    const displayUniversity = INSTITUTION_TO_DISPLAY[chosenInstitution.id];
    setSyncFeedbackStage(`Connecting to ${chosenInstitution.name} portal…`);
    const t1 = setTimeout(() => setSyncFeedbackStage('Authenticating secure session…'), 900);
    const t2 = setTimeout(() => setSyncFeedbackStage('Syncing enrolled courses & credit units…'), 2000);
    const t3 = setTimeout(() => setSyncFeedbackStage('Reconciling fee ledger & timetable…'), 3400);

    try {
      const response = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: portalUsername.trim(),
          password: portalPassword.trim(),
          institutionId: chosenInstitution.id,
          university: chosenInstitution.name,
          mock: false,
          useMock: false,
        }),
      });

      const data = await response.json();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (response.ok && data.status === 'success') {
        syncPortalData(data, displayUniversity);
        setSyncFeedbackStage('Portal verified & ready!');
        setIsFinishing(true);
        setTimeout(() => {
          completeOnboarding({
            university: displayUniversity,
            studentName: data.student?.name || studentFullName || 'Student',
            email: studentEmail,
          });
        }, 900);
      } else {
        setIsSyncing(false);
        setErrorMessage(
          data.message ||
            `Authentication failed for ${chosenInstitution.name}. Please verify your credentials and try again.`
        );
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsSyncing(false);
      setErrorMessage(err.message || 'Unable to reach the CourseMate sync server.');
    }
  };

  // Step 3: Skip portal sync, go to dashboard
  const handleSkipPortalSync = () => {
    completeOnboarding({
      university: INSTITUTION_TO_DISPLAY[chosenInstitution.id],
      studentName: studentFullName || 'Student',
      email: studentEmail,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#090A0E] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-gradient-to-t from-emerald-600/10 via-cyan-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header + Step indicator */}
      <header className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between pt-2 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white">CourseMate</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Academic OS 2.6
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Personal Academic Workspace</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2">
          {([{ step: 1, label: 'Identity' }, { step: 2, label: 'Institution' }, { step: 3, label: 'Portal' }] as const).map(
            ({ step, label }) => (
              <div key={step} className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === step
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/40'
                      : currentStep > step
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.06] text-zinc-500 border border-white/[0.06]'
                  }`}
                >
                  {currentStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
                <span
                  className={`hidden md:inline text-xs font-semibold ${
                    currentStep === step ? 'text-white' : currentStep > step ? 'text-zinc-300' : 'text-zinc-600'
                  }`}
                >
                  {label}
                </span>
                {step < 3 && <div className="hidden md:block w-3 h-[1px] bg-white/[0.1] mx-0.5" />}
              </div>
            )
          )}
        </div>
      </header>

      {/* Main Card */}
      <main className="relative z-10 max-w-xl mx-auto w-full my-auto py-4">

        {/* ═══════════ STEP 1: IDENTITY ═══════════ */}
        {currentStep === 1 && (
          <div className="bg-[#12131F]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
            {/* Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Academic Companion</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Welcome to CourseMate</h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Your Personal Academic Workspace — unifying timetables, revision workflows, and real-time tuition tracking across Uganda.
              </p>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { icon: <Calendar className="w-4 h-4 text-indigo-400 mx-auto" />, title: 'Exam Engine', sub: 'Conflict Detection' },
                { icon: <CreditCard className="w-4 h-4 text-emerald-400 mx-auto" />, title: 'Tuition Tracker', sub: 'Official Ledger' },
                { icon: <BookOpen className="w-4 h-4 text-amber-400 mx-auto" />, title: 'Study Bank', sub: 'Flashcards & Quizzes' },
              ].map(({ icon, title, sub }) => (
                <div key={title} className="p-3 rounded-2xl bg-[#090A0E] border border-white/[0.06] space-y-1">
                  {icon}
                  <p className="text-[11px] font-bold text-zinc-200">{title}</p>
                  <p className="text-[9px] text-zinc-500 font-medium">{sub}</p>
                </div>
              ))}
            </div>

            {/* Feedback banner / Toast */}
            {authFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs space-y-1 animate-in fade-in ${
                  authFeedback.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/25 text-rose-300'
                    : 'bg-amber-500/10 border border-amber-500/25 text-amber-300'
                }`}
              >
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authFeedback.text}</span>
                </p>
              </div>
            )}

            {/* Email + Password form */}
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-3">
              {/* Full name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Samuel Businge"
                    value={studentFullName}
                    onChange={(e) => setStudentFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090A0E] border border-white/[0.08] text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@coursemate.ug"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090A0E] border border-white/[0.08] text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Min. 6 characters</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090A0E] border border-white/[0.08] text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>Create Account / Sign In</span>
              </button>
            </form>

            {/* Google sign-in button (shows toast info instead of broken raw OAuth redirect) */}
            <div className="border-t border-white/[0.06] pt-3 space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-[#1A1B28] hover:bg-[#222436] border border-white/[0.08] text-zinc-300 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Guest link — subtle, at the bottom */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleExploreAsGuest}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer underline underline-offset-2"
              >
                Skip for now &amp; explore as guest →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2: INSTITUTION SELECTION ═══════════ */}
        {currentStep === 2 && (
          <div className="bg-[#12131F]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                <School className="w-3.5 h-3.5" />
                <span>Select Your University</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Where do you study?</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto font-medium">
                Choose your university to load your campus portal connection and timetable adapter.
              </p>
            </div>

            {/* Institution card grid for MAK, KYU, MUBS, ISBAT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INSTITUTIONS.map((inst) => {
                const isSelected = chosenInstitution.id === inst.id;
                return (
                  <div
                    key={inst.id}
                    onClick={() => handleSelectInstitution(inst)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                        : 'bg-[#090A0E] border-white/[0.06] hover:border-white/[0.2] hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Selection checkmark */}
                    <div
                      className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-indigo-500 text-white' : 'border border-white/[0.15] group-hover:border-white/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md' : 'bg-white/[0.06] text-zinc-400'
                        }`}
                      >
                        <InstitutionIcon institution={inst} active={isSelected} />
                      </div>

                      <div className="space-y-0.5 pr-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="text-[13px] font-extrabold text-white leading-tight">{inst.name}</h2>
                        </div>
                        <span
                          className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                            inst.engine === 'ISMIS'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {inst.badgeText}
                        </span>
                        {inst.location && (
                          <p className="text-[10px] text-zinc-500 font-normal mt-0.5">{inst.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "+ Request your university" badge / link */}
            <div className="flex justify-center pt-1">
              <a
                href="mailto:support@coursemate.ug?subject=Request%20University%20Support"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-white/[0.15] text-zinc-400 hover:text-white hover:border-white/30 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Request your university</span>
              </a>
            </div>

            {/* Navigation back */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Continue to Portal Sync</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3: ADAPTIVE PORTAL SYNC ═══════════ */}
        {currentStep === 3 && (() => {
          const { credentialFields } = chosenInstitution;
          return (
            <div className="bg-[#12131F]/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure Student Portal Bridge</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Connect Your Student Portal
                </h1>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-medium">
                  Sync enrolled courses, academic records, timetable, and official fee ledger.
                </p>
              </div>

              {/* Selected Institution Context */}
              <div className="p-3.5 rounded-2xl bg-[#090A0E] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-extrabold text-sm">
                    {chosenInstitution.shortName.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{chosenInstitution.name}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{chosenInstitution.portalUrl}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  onClick={() => setCurrentStep(2)}
                >
                  Change ↺
                </span>
              </div>

              {/* Form dynamically populated from credentialFields */}
              <form onSubmit={handlePortalSyncSubmit} className="space-y-4">
                {/* Username field */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    {credentialFields.usernameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={credentialFields.usernamePlaceholder}
                    value={portalUsername}
                    onChange={(e) => setPortalUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090A0E] border border-white/[0.08] text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  {credentialFields.helperText && (
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">{credentialFields.helperText}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    {credentialFields.passwordLabel}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your portal password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090A0E] border border-white/[0.08] text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* Security notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                    Encrypted direct connection. Your portal password is <strong className="text-white">never stored in plaintext</strong>.
                  </p>
                </div>

                {/* Error banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Sync Issue</span>
                      <span className="text-[11px]">{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {isSyncing && (
                  <div className="p-4 rounded-2xl bg-[#090A0E] border border-indigo-500/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                        <span>{syncFeedbackStage || `Connecting to ${chosenInstitution.name}…`}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">TLS SECURE</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="h-2.5 bg-white/[0.08] rounded-full animate-pulse w-full" />
                      <div className="h-2.5 bg-white/[0.05] rounded-full animate-pulse w-4/5" />
                      <div className="h-2.5 bg-white/[0.06] rounded-full animate-pulse w-2/3" />
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      Sync running in secure sandbox — typically 5–15 seconds depending on portal response time.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  {/* Primary Action */}
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white py-3.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Syncing {chosenInstitution.shortName} Academic Records…</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Connect &amp; Sync Academic Records</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Action */}
                  <button
                    type="button"
                    onClick={handleSkipPortalSync}
                    disabled={isSyncing}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer disabled:opacity-30 flex items-center justify-center gap-1.5"
                  >
                    Skip for now, go to dashboard
                  </button>
                </div>
              </form>

              {/* Back */}
              <div className="pt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change institution
                </button>
              </div>
            </div>
          );
        })()}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-zinc-500 pb-2">
        <span>CourseMate • Multi-University Academic Platform</span>
        <span className="mx-2">·</span>
        <span>Secure Local-First Architecture</span>
      </footer>

      {/* Success overlay */}
      {isFinishing && (
        <div className="fixed inset-0 z-50 bg-[#090A0E]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#12131F] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">All Set!</h2>
              <p className="text-xs text-emerald-300 font-bold mt-1">Your Academic Workspace is Ready.</p>
              <p className="text-[11px] text-zinc-400 mt-2 font-medium">
                Launching your personalised dashboard for {studentFullName || 'Student'}…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
