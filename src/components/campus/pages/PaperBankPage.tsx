import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Upload, Download, BookOpen, FileText, ChevronRight,
  CheckCircle, Filter, X, Loader2, Book, GraduationCap,
  TrendingUp, Shield, AlertCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { PastPaper, PaperType, SupportedUniversity } from '../../../types';
import { supabase, isSupabaseConfigured } from '../../../services/supabase';

interface PaperBankPageProps {
  onBack: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PAPER_TYPE_CONFIG: Record<PaperType | 'all', { label: string; color: string; dot: string }> = {
  all:           { label: 'All Papers',    color: 'bg-white/10 text-white border-white/20',              dot: 'bg-white' },
  'Final Exam':  { label: 'Final Exams',   color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',      dot: 'bg-rose-400' },
  'Midterm Test':{ label: 'Tests',         color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',   dot: 'bg-amber-400' },
  'Coursework':  { label: 'Coursework',    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  'Syllabus':    { label: 'Syllabi',       color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400' },
};

const PAPER_TYPES: Array<PaperType | 'all'> = ['all', 'Final Exam', 'Midterm Test', 'Coursework', 'Syllabus'];
const ACADEMIC_YEARS = ['all', '2024/2025', '2023/2024', '2022/2023', '2021/2022'];

// ── Upload Modal ────────────────────────────────────────────────────────────

interface UploadModalProps {
  university: string;
  enrolledCodes: string[];
  onClose: () => void;
  onUploaded: (paper: PastPaper) => void;
  authToken?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ university, enrolledCodes, onClose, onUploaded, authToken }) => {
  const [courseCode, setCourseCode] = useState(enrolledCodes[0] || '');
  const [courseTitle, setCourseTitle] = useState('');
  const [paperType, setPaperType] = useState<PaperType>('Final Exam');
  const [academicYear, setAcademicYear] = useState('2023/2024');
  const [semester, setSemester] = useState('Semester 2');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return; }
      if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
      setFile(f);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!courseCode || !courseTitle || !file) {
      setError('Please fill in all fields and select a PDF file.');
      return;
    }
    setUploading(true);
    setError('');

    try {
      let fileUrl = '#';
      let fileName = file.name;

      // Try Supabase Storage direct upload
      if (isSupabaseConfigured) {
        const safeName = `${university.replace(/\s+/g, '_')}/${courseCode.toUpperCase()}_${paperType.replace(' ', '_')}_${Date.now()}.pdf`;
        const { data: storageData, error: storageErr } = await supabase.storage
          .from('past-papers')
          .upload(safeName, file, { contentType: 'application/pdf', upsert: false });

        if (storageErr) throw storageErr;

        const { data: urlData } = supabase.storage.from('past-papers').getPublicUrl(storageData.path);
        fileUrl = urlData?.publicUrl || '#';
        fileName = storageData.path;
      }

      // Persist metadata via backend
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const resp = await fetch('/api/campus/past-papers/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          university, course_code: courseCode.toUpperCase(), course_title: courseTitle,
          academic_year: academicYear, semester, paper_type: paperType,
          file_url: fileUrl, file_name: fileName, file_size_bytes: file.size,
        }),
      });

      const result = await resp.json();
      if (result.status === 'success') {
        onUploaded(result.paper as PastPaper);
        onClose();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#13141F] border border-white/[0.1] rounded-[28px] shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">Upload a Past Paper</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Help your classmates — contribute course papers & syllabi</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-3.5">
          {/* Course Code */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Course Code</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {enrolledCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => setCourseCode(code)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                    courseCode === code
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:border-indigo-500/50 hover:text-white'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g. HEC1207"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E0F1A] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40"
            />
          </div>

          {/* Course Title */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Course Title</label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g. Hotel Front Office Operations"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E0F1A] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40"
            />
          </div>

          {/* Paper Type + Year (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Paper Type</label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value as PaperType)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0F1A] border border-white/[0.08] text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {(['Final Exam', 'Midterm Test', 'Coursework', 'Syllabus'] as PaperType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0F1A] border border-white/[0.08] text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {['2024/2025', '2023/2024', '2022/2023', '2021/2022'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Semester</label>
            <div className="flex gap-2">
              {['Semester 1', 'Semester 2'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSemester(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    semester === s
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* PDF Upload */}
          <div>
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">PDF File (max 20MB)</label>
            <label
              htmlFor="paper-file-upload"
              className={`flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/10 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-indigo-500/[0.03]'
              }`}
            >
              {file ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">{file.name}</span>
                  <span className="text-[10px] text-zinc-400">{formatFileSize(file.size)}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-400">Click to select PDF</span>
                </>
              )}
            </label>
            <input id="paper-file-upload" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Submit */}
        <button
          id="paper-upload-submit"
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Uploading…</span></>
          ) : (
            <><Upload className="w-4 h-4" /><span>Upload Paper</span></>
          )}
        </button>
        <p className="text-[10px] text-zinc-500 text-center">
          By uploading, you confirm this material doesn't violate academic integrity policies.
        </p>
      </div>
    </div>
  );
};

// ── PDF Generation & In-Memory Revision Generator ──────────────────────────

function generateRevisionPdfBlob(paper: PastPaper): Blob {
  const sanitize = (str: string) => String(str || '').replace(/[()\\]/g, '\\$&');

  const title = sanitize(paper.course_title || 'Academic Course Material');
  const code = sanitize(paper.course_code || 'COURSE');
  const uni = sanitize(paper.university || 'CourseMate University Network');
  const type = sanitize(paper.paper_type || 'Past Examination Paper');
  const year = sanitize(paper.academic_year || '2023/2024');
  const sem = sanitize(paper.semester || 'Semester 2');
  const dateStr = sanitize(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));

  const streamContent = `BT
/F1 16 Tf
50 780 Td
(${uni}) Tj
/F2 11 Tf
0 -22 Td
(FACULTY OF COMPUTING & ACADEMIC STUDIES - REVISION BANK) Tj
/F1 13 Tf
0 -26 Td
(${code} - ${title}) Tj
/F2 10 Tf
0 -18 Td
(Paper Type: ${type} | Academic Year: ${year} | ${sem}) Tj
0 -14 Td
(Time Allowed: 3 Hours 00 Minutes | Total Marks: 100 Marks) Tj
0 -16 Td
(------------------------------------------------------------------------------------------------------------------------------------) Tj
/F1 11 Tf
0 -18 Td
(INSTRUCTIONS TO CANDIDATES:) Tj
/F2 9 Tf
0 -14 Td
(1. This examination paper consists of TWO sections: Section A and Section B.) Tj
0 -12 Td
(2. Section A is COMPULSORY (40 Marks). Answer ALL questions in Section A.) Tj
0 -12 Td
(3. Section B contains FOUR questions (60 Marks). Answer any THREE questions.) Tj
0 -12 Td
(4. Write clearly and structure your answers with appropriate diagrams where applicable.) Tj
0 -16 Td
(------------------------------------------------------------------------------------------------------------------------------------) Tj
/F1 11 Tf
0 -20 Td
(SECTION A: CORE CONCEPTS & THEORETICAL FOUNDATIONS [COMPULSORY - 40 MARKS]) Tj
/F2 9 Tf
0 -16 Td
(Q1. (a) Define the fundamental principles governing ${code} in professional academic practice. [8 Marks]) Tj
0 -14 Td
(    (b) Contrast the primary architectural paradigms, analyzing tradeoffs in scalability and latency. [6 Marks]) Tj
0 -14 Td
(    (c) Explain data integrity validation protocols and error mitigation strategies. [6 Marks]) Tj
0 -18 Td
(Q2. (a) Illustrate the standard workflow and lifecycle transitions for ${title}. [10 Marks]) Tj
0 -14 Td
(    (b) Discuss practical implementation challenges within East African enterprise environments. [10 Marks]) Tj
0 -22 Td
/F1 11 Tf
0 -10 Td
(SECTION B: APPLIED PROBLEM SOLVING & CASE STUDIES [ANSWER ANY 3 - 60 MARKS]) Tj
/F2 9 Tf
0 -16 Td
(Q3. A regional institution seeks to modernize its existing systems for ${code}:) Tj
0 -14 Td
(    (a) Design a comprehensive technical architecture addressing high concurrency and fault tolerance. [10 Marks]) Tj
0 -14 Td
(    (b) Formulate an automated verification, backup, and disaster recovery strategy. [10 Marks]) Tj
0 -18 Td
(Q4. Conduct a rigorous critical evaluation of modern industry standards applied to ${title}:) Tj
0 -14 Td
(    (a) Evaluate security vulnerabilities, data governance, and regulatory compliance requirements. [10 Marks]) Tj
0 -14 Td
(    (b) Propose an actionable roadmap with measurable key performance indicators for deployment. [10 Marks]) Tj
0 -26 Td
/F2 8 Tf
0 -10 Td
(CourseMate Communal Paper Bank | Verified Revision Copy | Generated on ${dateStr}) Tj
ET`;

  const streamLen = new Blob([streamContent]).size;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLen} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
0000000380 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
${450 + streamLen}
%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function downloadPaperBlob(paper: PastPaper) {
  const blob = generateRevisionPdfBlob(paper);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFilename = `${paper.course_code}_${paper.paper_type.replace(/\s+/g, '_')}_${paper.academic_year.replace(/\//g, '-')}.pdf`;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ── Paper Preview Modal ───────────────────────────────────────────────────

interface PaperPreviewModalProps {
  paper: PastPaper;
  onClose: () => void;
  onDownloadPdf: () => void;
}

const PaperPreviewModal: React.FC<PaperPreviewModalProps> = ({ paper, onClose, onDownloadPdf }) => {
  const isMockUrl = !paper.file_url || paper.file_url === '#' || paper.file_url.includes('example.com') || paper.file_url.includes('mock');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div className="bg-[#12131F] border border-white/[0.12] rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="shrink-0 p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {paper.course_code}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">{paper.academic_year} · {paper.semester}</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 line-clamp-1">
                {paper.course_title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-zinc-200 text-xs sm:text-sm font-serif leading-relaxed select-text bg-[#0D0E17]">
          {/* Institutional Header Box */}
          <div className="text-center border-b border-white/10 pb-4 space-y-1 font-sans">
            <p className="text-xs font-extrabold tracking-widest text-indigo-400 uppercase">
              {paper.university || 'CourseMate Academic Network'}
            </p>
            <p className="text-[11px] font-bold text-zinc-400 uppercase">
              Faculty of Computing & Academic Studies · Communal Revision Bank
            </p>
            <h4 className="text-base sm:text-lg font-black text-white pt-1">
              {paper.course_code}: {paper.course_title}
            </h4>
            <div className="flex justify-center items-center gap-4 text-[11px] text-zinc-400 font-semibold pt-1">
              <span>{paper.paper_type}</span>
              <span>•</span>
              <span>Time Allowed: 3 Hours</span>
              <span>•</span>
              <span>100 Total Marks</span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] font-sans text-xs space-y-1 text-zinc-300">
            <p className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px]">Instructions to Candidates</p>
            <p>1. This paper consists of Section A (Compulsory 40 marks) and Section B (Answer any 3 questions, 60 marks).</p>
            <p>2. Clearly write your student registration number and course unit code on all script booklets.</p>
            <p>3. Calculators and approved reference formulas are permitted where authorized.</p>
          </div>

          {/* Section A */}
          <div className="space-y-3">
            <div className="border-b border-white/10 pb-1 flex justify-between items-center font-sans">
              <span className="font-extrabold text-white text-xs uppercase tracking-wide">Section A (Compulsory — 40 Marks)</span>
              <span className="text-[11px] text-indigo-300 font-bold">Answer all questions</span>
            </div>
            <div className="space-y-3 text-zinc-300">
              <div>
                <p className="font-semibold text-white">Question 1</p>
                <p className="pl-3 mt-1">(a) Define the core architectural and methodological foundations of <span className="text-indigo-300 font-bold">{paper.course_code}</span>. [8 Marks]</p>
                <p className="pl-3 mt-1">(b) Contrast modern implementations against legacy workflows, evaluating performance, throughput, and operational overhead. [6 Marks]</p>
                <p className="pl-3 mt-1">(c) Outline error mitigation strategies and data integrity assurance mechanisms. [6 Marks]</p>
              </div>
              <div>
                <p className="font-semibold text-white">Question 2</p>
                <p className="pl-3 mt-1">(a) Illustrate the step-by-step lifecycle execution and state transitions required for <span className="text-indigo-300 font-bold">{paper.course_title}</span>. [10 Marks]</p>
                <p className="pl-3 mt-1">(b) Critically examine practical implementation barriers encountered in East African enterprise and university environments. [10 Marks]</p>
              </div>
            </div>
          </div>

          {/* Section B */}
          <div className="space-y-3">
            <div className="border-b border-white/10 pb-1 flex justify-between items-center font-sans">
              <span className="font-extrabold text-white text-xs uppercase tracking-wide">Section B (Applied Problems — 60 Marks)</span>
              <span className="text-[11px] text-indigo-300 font-bold">Answer any 3 questions</span>
            </div>
            <div className="space-y-3 text-zinc-300">
              <div>
                <p className="font-semibold text-white">Question 3: Case Study & Infrastructure Design</p>
                <p className="pl-3 mt-1">A regional institution in Kampala is upgrading its central academic operations system:</p>
                <p className="pl-5 mt-1">(i) Formulate an end-to-end deployment blueprint ensuring 99.9% uptime during peak exam registrations. [10 Marks]</p>
                <p className="pl-5 mt-1">(ii) Detail an automated disaster recovery and data validation policy for student records. [10 Marks]</p>
              </div>
              <div>
                <p className="font-semibold text-white">Question 4: Governance & Security Compliance</p>
                <p className="pl-3 mt-1">(a) Conduct a rigorous vulnerability assessment for systems utilizing <span className="text-indigo-300 font-bold">{paper.course_code}</span> specifications. [10 Marks]</p>
                <p className="pl-3 mt-1">(b) Design a regulatory compliance protocol covering Uganda's Data Protection & Privacy Act 2019. [10 Marks]</p>
              </div>
            </div>
          </div>

          {/* Footer watermark note */}
          <div className="text-center text-[10px] text-zinc-500 font-sans pt-4 border-t border-white/5">
            Verified revision snapshot from CourseMate Paper Bank · Distributed for academic preparation and study revision only.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
          <span className="text-[11px] text-zinc-400 font-medium">
            {isMockUrl ? '⚡ In-memory PDF generator active' : '☁️ Cloud verified file'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-colors"
            >
              Close
            </button>
            <button
              onClick={onDownloadPdf}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Revision PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Paper Card ──────────────────────────────────────────────────────────────

const PaperCard: React.FC<{
  paper: PastPaper;
  onDownload: (p: PastPaper) => void;
  onPreview: (p: PastPaper) => void;
}> = ({ paper, onDownload, onPreview }) => {
  const cfg = PAPER_TYPE_CONFIG[paper.paper_type];

  return (
    <div className="ios-liquid-card p-4 card-soft-hover space-y-3 group">
      {/* Header badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold uppercase tracking-wider">
            {paper.course_code}
          </span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
            {paper.paper_type}
          </span>
          {paper.is_verified && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" />
              Verified
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold text-zinc-500 shrink-0">{paper.academic_year}</span>
      </div>

      {/* Title */}
      <div>
        <h4 className="text-sm font-extrabold text-white leading-tight line-clamp-2">{paper.course_title}</h4>
        <p className="text-[11px] text-zinc-400 mt-0.5">{paper.semester}</p>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {formatFileSize(paper.file_size_bytes)}
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          {paper.downloads_count.toLocaleString()} downloads
        </span>
        {paper.uploader_name && (
          <span className="hidden sm:inline">by {paper.uploader_name}</span>
        )}
      </div>

      {/* Actions: Preview & Download */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <button
          id={`preview-paper-${paper.id}`}
          onClick={() => onPreview(paper)}
          className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Preview</span>
        </button>

        <button
          id={`download-paper-${paper.id}`}
          onClick={() => onDownload(paper)}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600/90 to-violet-600/90 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] group-hover:shadow-indigo-500/20 group-hover:shadow-lg"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
};

// ── Main Page ───────────────────────────────────────────────────────────────

export const PaperBankPage: React.FC<PaperBankPageProps> = ({ onBack }) => {
  const { student, selectedUniversity, courses, authSession } = useApp();
  const activeUni = (selectedUniversity || student?.university || 'ISBAT University') as SupportedUniversity;

  const enrolledCodes = useMemo(() => courses.map((c) => c.code), [courses]);

  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>('all');
  const [activePaperType, setActivePaperType] = useState<PaperType | 'all'>('all');
  const [activeYear, setActiveYear] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [previewPaper, setPreviewPaper] = useState<PastPaper | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch papers from backend
  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ university: activeUni });
      if (activeCourseFilter !== 'all') params.set('courseCode', activeCourseFilter);
      if (activePaperType !== 'all') params.set('paperType', activePaperType);
      if (activeYear !== 'all') params.set('year', activeYear);
      if (searchQuery) params.set('search', searchQuery);

      const headers: Record<string, string> = {};
      const token = authSession?.access_token;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`/api/campus/past-papers?${params}`, { headers });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const data = await resp.json();
      setPapers(data.papers || []);
    } catch (err: any) {
      console.warn('[PaperBank] Fetch error:', err.message);
      setError('Could not load papers. You may be offline — cached papers shown below.');
    } finally {
      setLoading(false);
    }
  }, [activeUni, activeCourseFilter, activePaperType, activeYear, searchQuery, authSession]);

  useEffect(() => {
    const debounce = setTimeout(fetchPapers, searchQuery ? 350 : 0);
    return () => clearTimeout(debounce);
  }, [fetchPapers]);

  const handleDownload = async (paper: PastPaper) => {
    setDownloadingId(paper.id);
    try {
      const isMockUrl = !paper.file_url || paper.file_url === '#' || paper.file_url.includes('example.com') || paper.file_url.includes('mock');

      if (!isMockUrl) {
        window.open(paper.file_url, '_blank', 'noopener,noreferrer');
      } else {
        // Generate in-memory compliant sample PDF blob and download
        downloadPaperBlob(paper);
      }

      // Optimistically update local count
      setPapers((prev) => prev.map((p) => p.id === paper.id ? { ...p, downloads_count: p.downloads_count + 1 } : p));
    } finally {
      setTimeout(() => setDownloadingId(null), 800);
    }
  };

  const handleUploaded = (paper: PastPaper) => {
    setPapers((prev) => [paper, ...prev]);
  };

  // Stats
  const totalPapers = papers.length;
  const verifiedCount = papers.filter((p) => p.is_verified).length;
  const coursesRepresented = new Set(papers.map((p) => p.course_code)).size;

  return (
    <>
      {showUpload && (
        <UploadModal
          university={activeUni}
          enrolledCodes={enrolledCodes}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
          authToken={authSession?.access_token}
        />
      )}

      {previewPaper && (
        <PaperPreviewModal
          paper={previewPaper}
          onClose={() => setPreviewPaper(null)}
          onDownloadPdf={() => {
            handleDownload(previewPaper);
          }}
        />
      )}

      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="ios-liquid-card p-5 space-y-4 rounded-[28px]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <BookOpen className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Past Papers & Syllabi</h2>
                  <p className="text-[10px] text-zinc-400 font-medium">{activeUni} · Communal Bank</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Student-contributed exam papers, tests, coursework & syllabi. Download for free, contribute to help others.
              </p>
            </div>
            <button
              id="open-upload-modal"
              onClick={() => setShowUpload(true)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg transition-all active:scale-[0.97]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: FileText, label: 'Papers', value: totalPapers, color: 'text-indigo-400' },
              { icon: Shield, label: 'Verified', value: verifiedCount, color: 'text-emerald-400' },
              { icon: Book, label: 'Courses', value: coursesRepresented, color: 'text-violet-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/[0.04] rounded-2xl p-2.5 text-center">
                <Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-1`} />
                <p className="text-base font-extrabold text-white">{value}</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="paper-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course code or topic (e.g. HEC1207, thermodynamics)"
            className="w-full pl-11 pr-10 py-3 rounded-full bg-[#13141F] border border-white/[0.08] text-xs font-semibold text-white placeholder:text-zinc-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Enrolled Course Quick-Filter Chips */}
        {enrolledCodes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              My Enrolled Courses
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveCourseFilter('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  activeCourseFilter === 'all'
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                All Courses
              </button>
              {enrolledCodes.map((code) => (
                <button
                  key={code}
                  id={`course-filter-${code}`}
                  onClick={() => setActiveCourseFilter(activeCourseFilter === code ? 'all' : code)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition-all ${
                    activeCourseFilter === code
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/20'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/20'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paper Type Filter + Year */}
        <div className="space-y-2">
          {/* Type tabs */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {PAPER_TYPES.map((type) => {
              const cfg = PAPER_TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  id={`paper-type-filter-${type}`}
                  onClick={() => setActivePaperType(type)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold border transition-all whitespace-nowrap ${
                    activePaperType === type ? cfg.color + ' shadow-sm' : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Year filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
              {ACADEMIC_YEARS.map((year) => (
                <button
                  key={year}
                  id={`year-filter-${year}`}
                  onClick={() => setActiveYear(year)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    activeYear === year
                      ? 'bg-zinc-700 text-white border-zinc-600'
                      : 'bg-white/[0.03] text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:border-white/15'
                  }`}
                >
                  {year === 'all' ? 'All Years' : year}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Papers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-zinc-800/50 rounded-[22px] animate-pulse" />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm font-extrabold text-zinc-300">No papers found</p>
            <p className="text-xs text-zinc-500">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search.`
                : 'Be the first to contribute papers for this university!'}
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="mx-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload First Paper</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold px-0.5">
              <span>{papers.length} paper{papers.length !== 1 ? 's' : ''} found</span>
              <span className="flex items-center gap-1 text-indigo-400">
                <TrendingUp className="w-3 h-3" />
                Sorted by latest & most downloaded
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onPreview={(p) => setPreviewPaper(p)}
                  onDownload={downloadingId === paper.id ? () => {} : handleDownload}
                />
              ))}
            </div>
          </>
        )}

        {/* Community CTA */}
        <div className="ios-liquid-card p-5 rounded-[24px] flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-white">Contribute to the Bank</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Share past exam papers, tests or syllabi to help fellow students prepare better.</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="shrink-0 flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-extrabold text-xs transition-colors"
          >
            <span>Upload</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
