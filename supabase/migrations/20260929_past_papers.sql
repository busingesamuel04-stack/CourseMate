-- =============================================================
-- CourseMate - Past Papers and Syllabus Bank
-- Migration: 20260929_past_papers.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS public.past_papers (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  university        TEXT         NOT NULL CHECK (university IN (
                                   'ISBAT University',
                                   'Makerere University',
                                   'Kyambogo University',
                                   'MUBS'
                                 )),
  course_code       VARCHAR(20)  NOT NULL,
  course_title      VARCHAR(200) NOT NULL,
  academic_year     VARCHAR(20)  NOT NULL DEFAULT '2023/2024',
  semester          VARCHAR(30)  NOT NULL DEFAULT 'Semester 1',
  paper_type        TEXT         NOT NULL CHECK (paper_type IN (
                                   'Final Exam',
                                   'Midterm Test',
                                   'Coursework',
                                   'Syllabus'
                                 )),
  file_url          TEXT         NOT NULL,
  file_name         TEXT         NOT NULL DEFAULT 'paper.pdf',
  file_size_bytes   INTEGER      NOT NULL DEFAULT 0,
  uploaded_by       UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploader_name     TEXT,
  downloads_count   INTEGER      NOT NULL DEFAULT 0,
  is_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_past_papers_university
  ON public.past_papers (university, academic_year DESC, downloads_count DESC);

CREATE INDEX IF NOT EXISTS idx_past_papers_course_code
  ON public.past_papers (university, course_code, paper_type);

CREATE INDEX IF NOT EXISTS idx_past_papers_fts
  ON public.past_papers USING gin (to_tsvector('english', course_code || ' ' || course_title));

ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read past papers"
  ON public.past_papers FOR SELECT USING (true);

CREATE POLICY "Authenticated students can upload papers"
  ON public.past_papers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = uploaded_by);

CREATE POLICY "Uploaders can update own submissions"
  ON public.past_papers FOR UPDATE
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

CREATE OR REPLACE FUNCTION update_past_papers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_past_papers_updated_at
  BEFORE UPDATE ON public.past_papers
  FOR EACH ROW EXECUTE FUNCTION update_past_papers_updated_at();

-- Storage bucket: past-papers
-- Run via Supabase Dashboard > Storage > New Bucket
-- Name: past-papers | Public: false | Max: 20MB | MIME: application/pdf
-- SELECT policy: bucket_id = 'past-papers'
-- INSERT policy: bucket_id = 'past-papers' AND auth.uid() IS NOT NULL

INSERT INTO public.past_papers
  (university, course_code, course_title, academic_year, semester, paper_type,
   file_url, file_name, file_size_bytes, uploader_name, downloads_count, is_verified)
VALUES
  ('ISBAT University','HEC1207','Hotel Front Office Operations','2023/2024','Semester 2','Final Exam',
   '#','HEC1207_FinalExam_2023-24_S2.pdf',852000,'Namukasa Grace',127,TRUE),
  ('ISBAT University','HEC1207','Hotel Front Office Operations','2022/2023','Semester 2','Midterm Test',
   '#','HEC1207_Midterm_2022-23_S2.pdf',421000,'Mugisha Robert',89,TRUE),
  ('ISBAT University','HEC1208','Housekeeping & Accommodation Operations','2023/2024','Semester 2','Final Exam',
   '#','HEC1208_FinalExam_2023-24_S2.pdf',734000,'Atim Judith',94,TRUE),
  ('ISBAT University','HEC1201','Food & Beverage Service','2023/2024','Semester 1','Coursework',
   '#','HEC1201_CW_2023-24_S1.pdf',256000,'Ssali Daniel',62,FALSE),
  ('ISBAT University','BIT2101','Database Management Systems','2023/2024','Semester 1','Final Exam',
   '#','BIT2101_FinalExam_2023-24_S1.pdf',615000,'Kato Emmanuel',78,TRUE),
  ('ISBAT University','BIT2101','Database Management Systems','2023/2024','Semester 1','Syllabus',
   '#','BIT2101_Syllabus_2023-24.pdf',180000,'Kato Emmanuel',201,TRUE),
  ('Makerere University','CSC2100','Data Structures & Algorithms','2023/2024','Semester 1','Final Exam',
   '#','CSC2100_FinalExam_2023-24_S1.pdf',921000,'Ochieng Brian',315,TRUE),
  ('Makerere University','BIT2103','Systems Analysis & Design','2023/2024','Semester 1','Midterm Test',
   '#','BIT2103_Midterm_2023-24_S1.pdf',487000,'Akello Mary',182,TRUE),
  ('Kyambogo University','BUS3201','Strategic Management','2023/2024','Semester 2','Final Exam',
   '#','BUS3201_FinalExam_2023-24_S2.pdf',654000,'Waiswa Peter',143,TRUE),
  ('MUBS','ACC2102','Financial Accounting II','2023/2024','Semester 1','Final Exam',
   '#','ACC2102_FinalExam_2023-24_S1.pdf',743000,'Nakagave Agnes',228,TRUE)
ON CONFLICT DO NOTHING;
