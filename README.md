# CourseMate — Smart Campus Companion & ISMIS Engine

An elite, high-trust campus companion application for **ISBAT University**, integrating a reverse-engineered **Playwright extraction engine (Sprint 1)** with a **Stitch-designed mobile app shell (Sprint 2)**.

---

## 🚀 Quick Start (Sprint 2 Mobile App Shell)

1. Start the zero-dependency local HTTP server:
   ```bash
   npm run serve
   ```
   Open your browser to: **`http://localhost:3000`**

2. Run the automated Playwright UI test suite:
   ```bash
   node test/frontend.test.js
   ```

---

## 📱 Mobile App Shell Specifications & Features

### 1. Design Directive & Aesthetic Archetype
Built according to Google Stitch design principles ([`DESIGN.md`](./DESIGN.md)):
- **Typography**: `Outfit` (Headings), `Plus Jakarta Sans` (Body), and `JetBrains Mono` (Course codes, timetable slots, financial amounts, countdown timer).
- **Themes**:
  - **Obsidian Dark** (Default): Deep `#0B0F14` base with Emerald Cyan (`#00D285`) accents and frosted glass borders.
  - **Alabaster Light**: Clean `#F4F6F9` slate with deep emerald contrast.
  - Seamless toggle via the header button with persistence in `localStorage`.
- **Chassis Simulation**: Centered responsive mobile frame with simulated status bar, dynamic island, and notch. Adapts to full-bleed on mobile viewports.

### 2. Four Core Tabs & Capabilities
1. **`[Schedule / Home]`**:
   - **Live Exam Countdown**: Real-time ticking clock down to the next university exam (`HEC1207 - Fundamentals of Business & Management`).
   - **Today's Timeline**: Chronological lecture blocks with status badges (*"Completed"*, *"Happening Now"*, *"Upcoming"*), lecture room numbers, and instructor details.
2. **`[Modules]`**:
   - **Enrolled Course Breakdown**: 6 course units extracted from ISMIS (`HEC1207`, `HEC1208`, `HEC1209`, `HEC12101`, `HEC12102`, `HEC12103`).
   - Credit units tally (18.0 Total Credits), coursework submission status (*"CW Submitted"* vs *"Pending"*), and attendance rates with warning flags (< 75%).
3. **`[Financials]`**:
   - **High-Trust Ledger**: Itemized ledger for **NCHE Statutory Fees** and **GUILD Activities Fees**.
   - Clear KPI cards: Total Billed, Total Paid, and Outstanding Balance (`UGX 700,000`).
   - **Exam Clearance Status**: Real-time clearance badge (*"Conditional Clearance"*).
4. **`[Campus Feed]`**:
   - Live notices extracted directly from ISMIS: Semester re-registration deadline (`21/Sep/2026`), CW & CBT exam qualification requirements, and attendance advisory warnings.

### 3. Progressive Onboarding Flow (Zero Friction)
- **Step 1**: Campus Selection (Defaults to ISBAT University Main Campus).
- **Step 2**: Cohort Selection (Higher Education Certificate, Year 1 Sem 2 `HECS26DA`, BCS, BBA).
- **Step 3**: Instant transition into the Schedule view pre-populated with timetable data. **No mandatory login barrier upfront!**

### 4. High-Trust Portal Sync Bottom Sheet
- Accessible via the **Sync Status Pill** in the header or the Financials tab.
- **Hardware-Encrypted Keystore Guarantee**: Clear local-first privacy statement:
  > *"Your credentials never leave this phone. They are stored in your device's hardware-encrypted keystore to sync grades and exam clearances directly."*
- Form with Username/Reg Number and Password inputs.
- Includes a **"Pre-fill Samuel Businge Demo"** button for instant evaluation.
- Seamless toggle between Public Cohort view and Personal Synced view.

---

## 📂 Project Architecture

```
CourseMate/
├── DESIGN.md                 # Stitch semantic design system specification
├── index.html                # App shell HTML & component templates
├── css/
│   └── app.css               # Complete Stitch CSS design system & micro-interactions
├── js/
│   ├── data.js               # Grounded data store (Sprint 1 reverse-engineered schema)
│   └── app.js                # App state, countdown engine, tab router, sync logic
├── server.js                 # Zero-dependency local development HTTP server
├── src/
│   ├── scraper.js            # Playwright live ISMIS portal scraping engine
│   └── parsers/
│       └── portalParser.js   # Resilient Cheerio parser for student, fees, and courses
├── test/
│   ├── frontend.test.js      # Playwright test validating all 8 UI interactions
│   ├── parser.test.js        # Parser assertion tests
│   └── mock_dashboard.html   # Realistic WebForms test fixture
├── portal.html               # Raw ISMIS student home snapshot
├── test-parser.js            # Standalone extraction runner
└── package.json
```

---

## 🧪 Sprint 1: ISBAT ISMIS Scraping Engine

### Run Extraction against Local Snapshot
```bash
node test-parser.js
```

### Run Live Scraper CLI
```bash
# Pass credentials via CLI arguments
node src/scraper.js "YOUR_REG_NO" "YOUR_PASSWORD"

# Or run offline mock extraction
npm run mock
```

---

## 🌉 Sprint 3: The Bridge (Live Portal Sync)

### Backend Sync Endpoint
- **Method**: `POST`
- **Route**: `/api/sync-portal`
- **Payload**:
  ```json
  {
    "username": "HECS26DA",
    "password": "YOUR_PASSWORD",
    "useMock": false
  }
  ```
- **Security**: Transient in-memory execution only — credentials are never logged or stored to disk.
- **Fast Demo Mode**: When `useMock: true`, instantly hydrates verified snapshot data for zero-latency presentation testing.

### Run Verification Test Suites
```bash
# Verify Sprint 3 Bridge API & Frontend Sync flow
node test/sync_bridge.test.js

# Verify Sprint 2 Frontend UI interactions & responsive shell
node test/frontend.test.js

# Verify Problem-Solving Retention Features (Radar, .ics, GPA, Offline, Feed)
node test/features.test.js
```

---

## ⚡ Problem-Solving Retention Features (Google Stitch Powered)

1. **Attendance Safety Radar & Predictive Calculator (Modules Tab)**:
   - Evaluates the official ISMIS 75% exam clearance requirement per module.
   - Dynamic safety badges: `Safe (80%+)`, `At Risk (70-79%)`, `Critical (<70%)`.
   - Visual 75% threshold marker line with predictive what-if simulator (`+1 Attend`, `+1 Miss`) calculating how many classes must be attended or can safely be missed.

2. **1-Tap Calendar Sync (.ics Export) (Schedule Tab)**:
   - Native RFC 5545 `.ics` iCalendar generator.
   - Exports all weekly lectures and final exam timetables directly into Apple Calendar, Google Calendar, or Microsoft Outlook.

3. **GPA & Target Grade Simulator (Modules Tab)**:
   - Interactive bottom modal allowing students to test hypothetical course grades (A=5.0, B+=4.5, B=4.0, C+=3.5, C=3.0, D=2.0, F=0.0).
   - Real-time recalculation of projected semester GPA and Honours classification (`First Class Honours`, `Upper Second`, `Lower Second`, `Pass`).
   - Quick goal presets (`First Class Goal`, `Upper Second`, `Pass`) and target persistence.

4. **Offline-First Caching & Live Indicator**:
   - Persists all student profile records, timetables, fee summaries, and action items in `localStorage`.
   - Dynamic Island connection monitoring reflects `ISMIS Live` or `Offline (Cached)`.

5. **Interactive Campus Feed & Actionable Tasks**:
   - Category tag filters: `[All]`, `[Deadlines]`, `[Guild Activities]`, `[Academics]`.
   - Interactive "Add to Tasks" flow storing deadlines in an actionable checklist with completion toggles and card dismissal.
