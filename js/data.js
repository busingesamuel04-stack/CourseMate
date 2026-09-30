/**
 * CourseMate Core Data Store
 * Grounded directly in Sprint 1 ISBAT ISMIS reverse-engineered schema
 */

const COURSEMATE_DATA = {
  university: {
    name: "ISBAT University",
    campus: "Lugogo Bypass Main Campus, Kampala",
    portalUrl: "https://erp.isbatuniversity.ac.ug",
    systemName: "ISMIS Student Portal"
  },

  // Available cohorts for progressive friction-free onboarding
  cohorts: [
    {
      id: "hec-y1s2",
      name: "Higher Education Certificate",
      code: "HEC",
      year: 1,
      semester: 2,
      batch: "HECS26DA",
      totalCredits: 18
    },
    {
      id: "bcs-y1s2",
      name: "Bachelor of Science in Computer Science",
      code: "BCS",
      year: 1,
      semester: 2,
      batch: "BCSS26DA",
      totalCredits: 21
    },
    {
      id: "bba-y1s2",
      name: "Bachelor of Business Administration",
      code: "BBA",
      year: 1,
      semester: 2,
      batch: "BBAS26DA",
      totalCredits: 18
    }
  ],

  // Unsynced public cohort schedule (available before portal login)
  publicSchedule: {
    today: "Monday, September 28, 2026",
    lectures: [
      {
        id: "lec-1",
        time: "08:30 AM - 10:30 AM",
        code: "HEC1207",
        title: "Fundamentals of Business & Management",
        room: "Lab 3B, Tech Wing",
        lecturer: "Dr. K. Mugisha",
        status: "Completed",
        type: "Lecture"
      },
      {
        id: "lec-2",
        time: "11:00 AM - 01:00 PM",
        code: "HEC1208",
        title: "Foundational Statistics",
        room: "Hall 2, Block A",
        lecturer: "Prof. S. Ocen",
        status: "Happening Now",
        type: "Lecture & Tutorial"
      },
      {
        id: "lec-3",
        time: "02:30 PM - 04:30 PM",
        code: "HEC12101",
        title: "Logic Building & Elementary Programming",
        room: "Computer Lab 4",
        lecturer: "Eng. R. Katende",
        status: "Upcoming",
        type: "Practical Lab"
      }
    ]
  },

  // Verified synced student record from Sprint 1 ISMIS extraction
  syncedStudent: {
    status: "success",
    student: {
      name: "BUSINGE SAMUEL",
      regNumber: "HECS26DA",
      program: "Higher Education Certificate",
      semester: "Year One - Semester Two (HECS26DA)",
      batchCode: "HECS26DA",
      academicStatus: "Inactive (Re-registration Required)",
      academicNotice: "You are required to complete CW and CBT components to qualify for semester end examination.",
      attendanceWarning: "Tips : Did not meet Expectation (Attendance < 75%)"
    },

    feeSummary: {
      totalBilled: "UGX 4,200,000",
      totalPaid: "UGX 3,500,000",
      outstandingBalance: "UGX 700,000",
      isClearForExams: false,
      clearanceBadge: "Conditional Clearance",
      paymentsBreakdown: [
        {
          category: "NCHE Statutory Fee",
          item: "Year One - Semester One (1)",
          status: "Paid",
          amount: "UGX 20,000",
          receiptNo: "REC-91823"
        },
        {
          category: "NCHE Statutory Fee",
          item: "Year One - Semester Two (2)",
          status: "Paid",
          amount: "UGX 20,000",
          receiptNo: "REC-94021"
        },
        {
          category: "GUILD Activities Fee",
          item: "Year One - Semester One (1)",
          status: "Paid",
          amount: "UGX 50,000",
          receiptNo: "REC-88412"
        },
        {
          category: "GUILD Activities Fee",
          item: "Year One - Semester Two (2)",
          status: "Due",
          amount: "UGX 50,000",
          receiptNo: "Pending Payment"
        },
        {
          category: "Tuition & Examination Fees",
          item: "Year One - Semester Two (2)",
          status: "Partially Paid",
          amount: "UGX 650,000 Due",
          receiptNo: "TX-492019"
        }
      ]
    },

    courses: [
      {
        code: "HEC1207",
        title: "Fundamentals of Business & Management",
        creditUnits: 3.0,
        grade: "In Progress",
        attendancePercent: 78,
        timetable: {
          examDate: "28 Sep 2026",
          examTime: "2:30PM - 1:30PM",
          venue: "Main Exam Hall C"
        },
        assessments: {
          coursework: "Closed",
          classTest: "Closed",
          cwScore: "34 / 40",
          cbtScore: "18 / 20"
        }
      },
      {
        code: "HEC1208",
        title: "Foundational Statistics",
        creditUnits: 3.0,
        grade: "In Progress",
        attendancePercent: 72,
        timetable: {
          examDate: "29 Sep 2026",
          examTime: "2:30PM - 5:30PM",
          venue: "Block B, Room 102"
        },
        assessments: {
          coursework: "Closed",
          classTest: "Closed",
          cwScore: "29 / 40",
          cbtScore: "15 / 20"
        }
      },
      {
        code: "HEC1209",
        title: "Life Skills Education",
        creditUnits: 3.0,
        grade: "In Progress",
        attendancePercent: 88,
        timetable: {
          examDate: "30 Sep 2026",
          examTime: "2:30PM - 5:30PM",
          venue: "Auditorium East"
        },
        assessments: {
          coursework: "Closed",
          classTest: "Closed",
          cwScore: "36 / 40",
          cbtScore: "19 / 20"
        }
      },
      {
        code: "HEC12101",
        title: "Logic Building & Elementary Programming",
        creditUnits: 3.0,
        grade: "In Progress",
        attendancePercent: 64,
        timetable: {
          examDate: "Not Yet Scheduled",
          examTime: "N/A",
          venue: "TBA"
        },
        assessments: {
          coursework: "Not Yet Scheduled",
          classTest: "Not Yet Scheduled",
          cwScore: "Pending",
          cbtScore: "Pending"
        }
      },
      {
        code: "HEC12102",
        title: "SQL Fundamentals in RDBMS",
        creditUnits: 3.0,
        grade: "In Progress",
        attendancePercent: 82,
        timetable: {
          examDate: "Not Yet Scheduled",
          examTime: "N/A",
          venue: "TBA"
        },
        assessments: {
          coursework: "Not Yet Scheduled",
          classTest: "Not Yet Scheduled",
          cwScore: "Pending",
          cbtScore: "Pending"
        }
      },
      {
        code: "HEC12103",
        title: "Field Study - ICT Literacy",
        creditUnits: 3.0,
        grade: "In Progress",
        attendancePercent: 90,
        timetable: {
          examDate: "Not Yet Scheduled",
          examTime: "N/A",
          venue: "TBA"
        },
        assessments: {
          coursework: "Pending",
          classTest: "Pending",
          cwScore: "Pending",
          cbtScore: "Pending"
        }
      }
    ],

    campusFeed: [
      {
        id: "feed-1",
        tag: "URGENT DEADLINE",
        category: "Deadlines",
        title: "Last Date for Semester Re-Registration",
        source: "Academic Registrar",
        date: "21 Sep 2026",
        content: "All students enrolled in Year One Semester Two must complete course registration on ISMIS to maintain active academic status.",
        priority: "high",
        deadlineDate: "2026-09-28"
      },
      {
        id: "feed-2",
        tag: "EXAM CLEARANCE",
        category: "Academics",
        title: "CW & CBT Exam Qualification Thresholds",
        source: "Faculty of ICT & Management",
        date: "Today, 10:15 AM",
        content: "Students are required to have submitted all Course Work (CW) and attended Computer-Based Tests (CBT) to be cleared for the end-of-semester examinations.",
        priority: "medium"
      },
      {
        id: "feed-3",
        tag: "ATTENDANCE NOTICE",
        category: "Academics",
        title: "Class Attendance Below 75% Advisory",
        source: "Dean of Students",
        date: "Yesterday",
        content: "Tips : Did not meet Expectation. Minimum 75% required for exam hall clearance. Remedial classes schedule posted.",
        priority: "warning"
      },
      {
        id: "feed-4",
        tag: "GUILD ELECTIONS",
        category: "Guild Activities",
        title: "2026/2027 Student Guild Council Nominations",
        source: "Guild Electoral Commission",
        date: "25 Sep 2026",
        content: "Nominations for Guild President and Faculty Representatives are now open. Submit completed nomination forms by Oct 05.",
        priority: "medium",
        deadlineDate: "2026-10-05"
      },
      {
        id: "feed-5",
        tag: "SPORTS GALA",
        category: "Guild Activities",
        title: "Inter-Faculty Sports Gala & Cultural Festival",
        source: "Games & Sports Union",
        date: "24 Sep 2026",
        content: "Team registrations for Football, Basketball, and Chess tournaments at Lugogo Indoor Arena close this Friday.",
        priority: "low",
        deadlineDate: "2026-10-02"
      },
      {
        id: "feed-6",
        tag: "FEE DEADLINE",
        category: "Deadlines",
        title: "Final Exam Fee Clearance Deadline",
        source: "Finance Department",
        date: "22 Sep 2026",
        content: "All outstanding tuition and GUILD activity balances must be settled at least 48 hours prior to exam commencement.",
        priority: "high",
        deadlineDate: "2026-09-30"
      }
    ]
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COURSEMATE_DATA };
}
