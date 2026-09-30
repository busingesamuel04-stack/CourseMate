import fs from 'fs';

function generatePdfBuffer(paper) {
  const sanitize = (str) => String(str || '').replace(/[()\\]/g, '\\$&');

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
(FACULTY OF COMPUTING & ACADEMIC STUDIES - OFFICIAL PAST PAPER) Tj
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
(Q3. A regional institution seeks to modernize its existing legacy systems for ${code}:) Tj
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

  const streamLen = Buffer.byteLength(streamContent, 'utf8');

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

  return Buffer.from(pdf, 'utf8');
}

const samplePaper = {
  course_code: 'HEC1207',
  course_title: 'Hotel Front Office Operations',
  university: 'ISBAT University',
  paper_type: 'Final Exam',
  academic_year: '2023/2024',
  semester: 'Semester 2',
};

const buf = generatePdfBuffer(samplePaper);
fs.writeFileSync('test/sample_output.pdf', buf);
console.log('Generated test/sample_output.pdf - size:', buf.length, 'bytes');
