import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Heart, Activity, TrendingUp, Droplet, Moon, Flame, Printer, PlusCircle, 
  Trash2, AlertTriangle, CheckCircle2, FileText, Info, Sparkles, User, Undo2, Download
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HealthLogEntry {
  id: string;
  date: string;
  systolic: number;     // mmHg
  diastolic: number;    // mmHg
  heartRate: number;    // bpm
  bloodSugar: number;   // mg/dL
  sleepHours: number;   // hrs
  activeMinutes: number;// mins
  waterLiters: number;  // Liters
  score: number;        // Auto-computed
  notes?: string;
}

export default function HealthTracker({ currentUser }: { currentUser: any }) {
  const { t, language } = useLanguage();

  // Primary Patient Metadata
  const patientName = currentUser?.name || "Subhransu Mohapatra";
  const patientEmail = currentUser?.email || "patient@veramedica.in";
  const registrationId = currentUser?.id || "VM-2026-8947";
  const patientAge = currentUser?.age || 28;
  const patientGender = currentUser?.gender || "Male";

  // Timeline History Seed (Last 6 days + lets user append/modify)
  const [history, setHistory] = useState<HealthLogEntry[]>([
    {
      id: "log-1",
      date: "2026-06-11",
      systolic: 128,
      diastolic: 84,
      heartRate: 78,
      bloodSugar: 108,
      sleepHours: 5.5,
      activeMinutes: 15,
      waterLiters: 1.2,
      score: 68,
      notes: "Slight headache after high sodium dinner"
    },
    {
      id: "log-2",
      date: "2026-06-12",
      systolic: 122,
      diastolic: 80,
      heartRate: 74,
      bloodSugar: 98,
      sleepHours: 6.8,
      activeMinutes: 20,
      waterLiters: 1.8,
      score: 82,
      notes: "Walked post lunch, felt more energetic"
    },
    {
      id: "log-3",
      date: "2026-06-13",
      systolic: 135,
      diastolic: 88,
      heartRate: 82,
      bloodSugar: 124,
      sleepHours: 5.0,
      activeMinutes: 0,
      waterLiters: 1.0,
      score: 55,
      notes: "Highly stressed due to project deadlines"
    },
    {
      id: "log-4",
      date: "2026-06-14",
      systolic: 118,
      diastolic: 76,
      heartRate: 68,
      bloodSugar: 88,
      sleepHours: 7.5,
      activeMinutes: 45,
      waterLiters: 2.2,
      score: 92,
      notes: "Excellent hydration today, morning jog done"
    },
    {
      id: "log-5",
      date: "2026-06-15",
      systolic: 119,
      diastolic: 78,
      heartRate: 67,
      bloodSugar: 92,
      sleepHours: 8.0,
      activeMinutes: 40,
      waterLiters: 2.5,
      score: 95,
      notes: "Rested well, metabolic levels normalized"
    },
    {
      id: "log-6",
      date: "2026-06-16",
      systolic: 125,
      diastolic: 82,
      heartRate: 71,
      bloodSugar: 102,
      sleepHours: 6.2,
      activeMinutes: 30,
      waterLiters: 2.0,
      score: 84,
      notes: "Regular diet. Slept slightly late."
    }
  ]);

  // Current inputs (bound to the new log form / default values)
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [heartRate, setHeartRate] = useState<number>(72);
  const [bloodSugar, setBloodSugar] = useState<number>(95);
  const [sleepHours, setSleepHours] = useState<number>(7.0);
  const [activeMinutes, setActiveMinutes] = useState<number>(30);
  const [waterLiters, setWaterLiters] = useState<number>(2.0);
  const [notes, setNotes] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // UI States
  const [graphTab, setGraphTab] = useState<'bp' | 'heart' | 'sugar' | 'sleep'>('bp');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-calculation logic for a holistic health score
  const calculateDynamicScore = (
    sys: number,
    dia: number,
    hr: number,
    sugar: number,
    sleep: number,
    act: number,
    water: number
  ) => {
    let bpScore = 100;
    // Systolic ideal: 110-120
    if (sys >= 180) bpScore = 10;
    else if (sys >= 140) bpScore = 40;
    else if (sys >= 130) bpScore = 70;
    else if (sys >= 120) bpScore = 85;
    else if (sys < 90) bpScore = 50;

    // Diastolic ideal: 70-80
    let diaScore = 100;
    if (dia >= 120) diaScore = 10;
    else if (dia >= 90) diaScore = 40;
    else if (dia >= 80) diaScore = 75;
    else if (dia < 60) diaScore = 50;

    const bpCombined = (bpScore + diaScore) / 2;

    // Heart rate ideal: 60 - 80 bpm
    let hrScore = 100;
    if (hr > 120 || hr < 40) hrScore = 20;
    else if (hr > 100) hrScore = 50;
    else if (hr > 80) hrScore = 85;
    else if (hr < 55) hrScore = 75;

    // Blood Sugar (Fasting baseline evaluation)
    let sugarScore = 100;
    if (sugar >= 200) sugarScore = 20;
    else if (sugar >= 126) sugarScore = 55;
    else if (sugar >= 100) sugarScore = 80;
    else if (sugar < 70) sugarScore = 40; // Hypoglycemic stress

    // Sleep Ideal: 7 - 9 hours
    let sleepScore = 100;
    if (sleep < 5) sleepScore = 30;
    else if (sleep < 6) sleepScore = 60;
    else if (sleep < 7) sleepScore = 85;
    else if (sleep > 10) sleepScore = 70;

    // Physical Activity (30+ minutes daily)
    let actScore = 100;
    if (act === 0) actScore = 20;
    else if (act < 15) actScore = 50;
    else if (act < 30) actScore = 80;

    // Hydration (2.0+ Liters daily)
    let waterScore = 100;
    if (water < 1.0) waterScore = 30;
    else if (water < 1.5) waterScore = 60;
    else if (water < 2.0) waterScore = 85;

    // Weighted average
    const finalScore = Math.round(
      bpCombined * 0.25 +
      hrScore * 0.15 +
      sugarScore * 0.20 +
      sleepScore * 0.15 +
      actScore * 0.15 +
      waterScore * 0.10
    );

    return Math.min(100, Math.max(0, finalScore));
  };

  // Live Calculated Current Health Score
  const currentCalculatedScore = calculateDynamicScore(
    systolic,
    diastolic,
    heartRate,
    bloodSugar,
    sleepHours,
    activeMinutes,
    waterLiters
  );

  // Warnings list generator
  const getWarnings = (sys: number, dia: number, hr: number, sugar: number, sleep: number, act: number) => {
    const alerts: { title: string; desc: string; severity: 'critical' | 'warning' | 'info'; field: string }[] = [];

    // Blood Pressure Warnings
    if (sys >= 180 || dia >= 120) {
      alerts.push({
        title: "Hypertensive Crisis Alert",
        desc: `Very high blood pressure detected (${sys}/${dia} mmHg). Consult a clinician immediately at Bhubaneswar triage center.`,
        severity: "critical",
        field: "bloodPressure"
      });
    } else if (sys >= 140 || dia >= 90) {
      alerts.push({
        title: "Hypertension (Stage 2)",
        desc: `High blood pressure state is active (${sys}/${dia} mmHg). Monitor daily and limit sodium intake.`,
        severity: "critical",
        field: "bloodPressure"
      });
    } else if (sys >= 130 || dia >= 80) {
      alerts.push({
        title: "Hypertension (Stage 1 / Impaired)",
        desc: `Physiological strain identified in cardiovascular corridors (${sys}/${dia} mmHg). Cardiovascular fitness suggested.`,
        severity: "warning",
        field: "bloodPressure"
      });
    } else if (sys < 90 || dia < 60) {
      alerts.push({
        title: "Hypotension Risk",
        desc: `Low blood pressure range (${sys}/${dia} mmHg). Ensure adequate mineral and hydration supplementation.`,
        severity: "warning",
        field: "bloodPressure"
      });
    }

    // Heart Rate Alerts
    if (hr > 100) {
      alerts.push({
        title: "Tachycardia Spike",
        desc: `Elevated resting pulse (${hr} bpm) is taxing cardiovascular reserve. Practice conscious deep breathing.`,
        severity: "warning",
        field: "pulse"
      });
    } else if (hr < 50) {
      alerts.push({
        title: "Bradycardia Range",
        desc: `Resting pulse is low (${hr} bpm). Acceptable if you are high-endure athlete; otherwise raises cardiovascular alert.`,
        severity: "warning",
        field: "pulse"
      });
    }

    // Blood Sugar Alerts
    if (sugar >= 200) {
      alerts.push({
        title: "Hyperglycemia Crisis",
        desc: `Severe glycemic spike (${sugar} mg/dL) registered. Restrict all simple carbohydrates and remain active.`,
        severity: "critical",
        field: "glucose"
      });
    } else if (sugar >= 126) {
      alerts.push({
        title: "Type 2 Diabetic Baseline Indicator",
        desc: `Fasting glucose (${sugar} mg/dL) exceeds pre-diabetic standard bounds. Contact specialists in clinical calendars tab.`,
        severity: "critical",
        field: "glucose"
      });
    } else if (sugar >= 100) {
      alerts.push({
        title: "Impaired Fasting Glucose (Pre-Diabetic)",
        desc: `Mild metabolic insulin resistance suggested (${sugar} mg/dL). Refer to the Glucose Predictor tool.`,
        severity: "warning",
        field: "glucose"
      });
    } else if (sugar < 70) {
      alerts.push({
        title: "Hypoglycemia Low glucose",
        desc: `Glycemic pressure levels are low (${sugar} mg/dL). Consume balanced complex carbohydrate fuel source.`,
        severity: "critical",
        field: "glucose"
      });
    }

    // Sleep Alerts
    if (sleep < 6) {
      alerts.push({
        title: "Sleep Deprivation Risk",
        desc: `Short sleep cycle (${sleep}h) hinders brain cell cleansing, systemic healing and metabolic reset.`,
        severity: "warning",
        field: "sleep"
      });
    }

    // Activity Alerts
    if (act < 15) {
      alerts.push({
        title: "Sedentary Metabolism Warning",
        desc: "Low physical movement limits oxygenation, insulin sensitizing and muscular micro-regeneration.",
        severity: "info",
        field: "activity"
      });
    }

    return alerts;
  };

  const currentWarnings = getWarnings(systolic, diastolic, heartRate, bloodSugar, sleepHours, activeMinutes);

  // Areas of Improvement based on calculations
  const getImprovements = () => {
    const list: string[] = [];
    if (systolic >= 130 || diastolic >= 80) {
      list.push("Implement a low-sodium, high-potassium 'DASH' nutritional regime, adding 500mg elemental magnesium taurate.");
      list.push("Begin regular cardiorespiratory zone-2 training for at least 150 minutes per week to lower arterial resistance.");
    }
    if (heartRate > 80) {
      list.push("Adopt a 5-minute circadian box-breathing exercise sequence twice daily to recruit active vagal down-regulation.");
    }
    if (bloodSugar >= 100) {
      list.push("Sequence meals: eat fiber/vegetables and clean protein blocks first, leaving starches and complex carbohydrates for last.");
      list.push("Take a brief 10 to 15-minute leisure walk immediately after lunch and dinner to absorb bio-nutrients safely.");
    }
    if (sleepHours < 7.0) {
      list.push("Shut down smart display exposure 90 minutes before your target sleeping hour, utilizing low soft light bulbs.");
      list.push("Keep deep clinical temperature low (around 18-20°C) to promote slow-wave delta neurological healing cycles.");
    }
    if (waterLiters < 2.0) {
      list.push("Hydrate with a glass of natural electrolyte mineral water instantly upon waking up keying cell hydration levels.");
    }
    if (activeMinutes < 30) {
      list.push("Break continuous sitting durations with 3 minutes of body squats or calf raises every hour to optimize venous drainage.");
    }

    // Fallbacks
    if (list.length === 0) {
      list.push("Fabulous. All biomarker quadrants are running within the optimal clinical baseline bounds. Continue your current routine!");
      list.push("Monitor daily steps and continue targeting an average resting heart rate of 60-70 bpm.");
    }

    return list;
  };

  const improvementsList = getImprovements();

  // Add current log to history list
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if entry of duplicate date exists to prevent clutter, and overwrite it or alert
    const duplicateIndex = history.findIndex(entry => entry.date === logDate);
    
    const newEntry: HealthLogEntry = {
      id: duplicateIndex !== -1 ? history[duplicateIndex].id : `log-${Date.now()}`,
      date: logDate,
      systolic,
      diastolic,
      heartRate,
      bloodSugar,
      sleepHours,
      activeMinutes,
      waterLiters,
      score: currentCalculatedScore,
      notes: notes.trim() || undefined
    };

    if (duplicateIndex !== -1) {
      const updatedHistory = [...history];
      updatedHistory[duplicateIndex] = newEntry;
      // Sort history by date
      updatedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHistory(updatedHistory);
      showToast("Metadata analysis updated successfully for " + logDate);
    } else {
      const updated = [...history, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHistory(updated);
      showToast("Successfully logged health biomarkers for " + logDate);
    }

    setNotes('');
  };

  const removeHistoryEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    showToast("Selected health journal entry deleted.");
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const generateHealthReportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // 1. Page Frame Decoration
      doc.setDrawColor(220, 225, 230);
      doc.setFont("Helvetica", "normal");
      doc.rect(5, 5, 200, 287); // Page Frame Outer border
      doc.setDrawColor(49, 151, 149); // #319795 deep teal theme color
      doc.setLineWidth(1.2);
      doc.line(5, 5, 205, 5); // top header banner bar line

      // 2. Headings & Logo Frame
      doc.setFillColor(49, 151, 149); // Deep teal background block for emblem
      doc.rect(12, 12, 14, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("+", 17, 21.5); // Clinician cross logo icon

      doc.setTextColor(7, 19, 48); // Midnight dark blue
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("VERAMEDICA DIAGNOSTIC CORP", 30, 18);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(110, 120, 135);
      doc.text("BHUBANESWAR OUTPATIENT REGISTRY & ENDOCRINOLOGY LAB", 30, 22.5);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(150, 160, 175);
      doc.text("Registered Licensure Code: VM-OD-751001-A | Tech Enabled Clinical Registry", 30, 26);

      // Report Header Stamp Right-aligned
      doc.setFillColor(7, 19, 48); // Deep Slate
      doc.rect(142, 11, 54, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("OFFICIAL OUTPATIENT REPORT", 145, 15.2);

      doc.setTextColor(90, 100, 115);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("CASE FILE ID: VM-CASE-2026-904", 142, 23);

      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 210, 220);
      doc.line(12, 30, 196, 30); // Horizontal separating divider

      // 3. Patient Information Sheet Grid Block
      doc.setFillColor(245, 247, 250); // Muted slate background container
      doc.rect(12, 34, 184, 18, "F");
      doc.setDrawColor(220, 225, 235);
      doc.rect(12, 34, 184, 18, "S");

      // Row elements inside the patient info box
      doc.setFontSize(7.5);
      doc.setTextColor(120, 130, 145);
      doc.setFont("Helvetica", "bold");
      doc.text("PATIENT NAME", 16, 40);
      doc.setTextColor(7, 19, 48);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text(patientName, 16, 45);

      doc.setFontSize(7.5);
      doc.setTextColor(120, 130, 145);
      doc.setFont("Helvetica", "bold");
      doc.text("PORTAL MAIL ADDRESS", 65, 40);
      doc.setTextColor(40, 50, 65);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(patientEmail, 65, 45);

      doc.setFontSize(7.5);
      doc.setTextColor(120, 130, 145);
      doc.setFont("Helvetica", "bold");
      doc.text("AGE / GENDER", 124, 40);
      doc.setTextColor(40, 50, 65);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(`${patientAge} Years / ${patientGender}`, 124, 45);

      // Simple relative format if timestamp is complex
      let simpleDateStr = currentPrintedReportDate;
      if (simpleDateStr.length > 25) {
        simpleDateStr = simpleDateStr.split(',').slice(0, 2).join(',');
      }

      doc.setFontSize(7.5);
      doc.setTextColor(120, 130, 145);
      doc.setFont("Helvetica", "bold");
      doc.text("EVALUATION DATE", 158, 40);
      doc.setTextColor(7, 19, 48);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text(simpleDateStr, 158, 45);

      // 4. Section 1 Heading
      doc.setTextColor(7, 19, 48);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("1. CURRENT METRIC ASSESSMENT QUADRANTS", 12, 60);
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 210, 220);
      doc.line(12, 62, 196, 62);

      // Display metrics in blocks: 4 blocks side-by-side
      const metrics = [
        {
          title: "BLOOD PRESSURE",
          value: `${systolic} / ${diastolic} mmHg`,
          status: systolic >= 140 || diastolic >= 90 ? "HYPERTENSION" : systolic >= 130 || diastolic >= 80 ? "ELEVATED" : "OPTIMAL",
          color: systolic >= 130 || diastolic >= 85 ? [185, 28, 28] : [16, 185, 129] // Red vs Green
        },
        {
          title: "HEART RATE PULSE",
          value: `${heartRate} bpm`,
          status: heartRate > 100 ? "TACHYCARDIA" : heartRate < 55 ? "ATHLETIC" : "REGULAR RESTING",
          color: heartRate > 100 || heartRate < 55 ? [217, 119, 6] : [16, 185, 129]
        },
        {
          title: "FASTING GLUCOSE",
          value: `${bloodSugar} mg/dL`,
          status: bloodSugar >= 126 ? "HYPERGLYCEMIC" : bloodSugar >= 100 ? "IMPAIRED BASE" : "HEALTHY SYST",
          color: bloodSugar >= 100 ? [185, 28, 28] : [16, 185, 129]
        },
        {
          title: "WELLNESS SCORE",
          value: `${currentCalculatedScore} / 100`,
          status: currentCalculatedScore >= 90 ? "EXCELLENT STATUS" : currentCalculatedScore >= 80 ? "GOOD STATUS" : "OUT OF BAND",
          color: currentCalculatedScore >= 80 ? [16, 185, 129] : [185, 28, 28]
        }
      ];

      // Draw the 4 quadrants
      const blockWidth = 43;
      const blockHeight = 22;
      const blockY = 66;

      metrics.forEach((m, idx) => {
        const blockX = 12 + idx * (blockWidth + 4);
        // Draw card frame
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 225, 235);
        doc.rect(blockX, blockY, blockWidth, blockHeight, "FD");

        // Heading title
        doc.setFontSize(7);
        doc.setTextColor(120, 130, 145);
        doc.setFont("Helvetica", "bold");
        doc.text(m.title, blockX + 3.5, blockY + 5);

        // Big absolute metric value
        doc.setFontSize(11);
        doc.setTextColor(7, 19, 48);
        doc.setFont("Helvetica", "bold");
        doc.text(m.value, blockX + 3.5, blockY + 11.5);

        // Colored status indicator under values
        doc.setFontSize(6.5);
        const [r, g, b] = m.color;
        doc.setTextColor(r, g, b);
        doc.setFont("Helvetica", "bold");
        doc.text(m.status.toUpperCase(), blockX + 3.5, blockY + 17.5);
      });

      // 5. Patient daily cycles info row (under assessments)
      const detailsY = 93;
      doc.setFillColor(248, 250, 252);
      doc.rect(12, detailsY, 184, 10, "F");
      
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 125);
      doc.setFont("Helvetica", "bold");
      
      doc.text("LOGGED SLEEP CYCLE:", 16, detailsY + 6.2);
      doc.setTextColor(7, 19, 48);
      doc.text(`${sleepHours} Hours / Day`, 52, detailsY + 6.2);

      doc.setTextColor(100, 110, 125);
      doc.text("PHYSICAL MOVEMENT:", 88, detailsY + 6.2);
      doc.setTextColor(7, 19, 48);
      doc.text(`${activeMinutes} Active Min`, 124, detailsY + 6.2);

      doc.setTextColor(100, 110, 125);
      doc.text("DAILY HYDRATION:", 152, detailsY + 6.2);
      doc.setTextColor(7, 19, 48);
      doc.text(`${waterLiters} Liters Water`, 176, detailsY + 6.2);

      // 6. Section 2 Heading: Pathological Risks
      const section2Y = 111;
      doc.setTextColor(7, 19, 48);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("2. ACTIVE PATHOLOGICAL RISKS & PATHWAY FLAGS", 12, section2Y);
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 210, 220);
      doc.line(12, section2Y + 2, 196, section2Y + 2);

      let currentCursorY = section2Y + 8;
      if (currentWarnings.length > 0) {
        currentWarnings.forEach((alert) => {
          doc.setFillColor(254, 242, 242); // very light soft red block
          doc.rect(12, currentCursorY - 3, 184, 10, "F");
          doc.setDrawColor(254, 226, 226);
          doc.rect(12, currentCursorY - 3, 184, 10, "S");

          doc.setTextColor(185, 28, 28); // high contrast red text
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.text("[!] " + alert.title.toUpperCase(), 16, currentCursorY + 3);

          doc.setTextColor(75, 85, 99);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(7.5);
          doc.text(alert.desc, 70, currentCursorY + 3);

          currentCursorY += 12;
        });
      } else {
        doc.setFillColor(240, 253, 244); // light green block
        doc.rect(12, currentCursorY - 3, 184, 12, "F");
        doc.setDrawColor(220, 252, 231);
        doc.rect(12, currentCursorY - 3, 184, 12, "S");

        doc.setTextColor(21, 128, 61); // deep emerald text
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text("✓ OPTIMAL ASSESSMENT STATUS VERIFIED", 16, currentCursorY + 2.5);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text("Patient exhibits standard arterial tension parameters, healthy metabolic hormone base responses,", 16, currentCursorY + 6.2);
        doc.text("optimal cellular hydration balance and active oxygenation coefficients.", 16, currentCursorY + 9);

        currentCursorY += 18;
      }

      // 7. Section 3 Heading: Recommendations & Directives
      const section3Y = currentCursorY + 3;
      doc.setTextColor(7, 19, 48);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("3. OUTPATIENT REHABILITATION STEPS & DIRECTIVES", 12, section3Y);
      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 210, 220);
      doc.line(12, section3Y + 2, 196, section3Y + 2);

      let recCursorY = section3Y + 8;
      improvementsList.forEach((imp, idx) => {
        doc.setFillColor(49, 151, 149); // teal dot
        doc.circle(16, recCursorY + 1.5, 0.8, "F");

        doc.setFontSize(8.5);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        
        // Wrap long recommendations cleanly
        const wrappedImp = doc.splitTextToSize(imp, 172);
        doc.text(wrappedImp, 21, recCursorY + 2.3);

        const linesOfText = Array.isArray(wrappedImp) ? wrappedImp.length : 1;
        recCursorY += 5 * linesOfText + 2.5;
      });

      // 8. Sign-off and visual stamp
      const signY = 244;
      doc.setLineWidth(0.3);
      doc.setDrawColor(210, 220, 230);
      doc.line(12, signY - 2, 196, signY - 2);

      doc.setFontSize(7.5);
      doc.setTextColor(130, 140, 155);
      doc.setFont("Helvetica", "bold");
      doc.text("REPORT CERTIFIED BY", 12, signY + 4);

      doc.setFontSize(10.5);
      doc.setTextColor(7, 19, 48);
      doc.setFont("Helvetica", "bold");
      doc.text("Bhubaneswar Endocrinology Joint Board", 12, signY + 10);

      doc.setFontSize(8);
      doc.setTextColor(110, 120, 135);
      doc.setFont("Helvetica", "normal");
      doc.text("VeraMedica Diagnostic Systems Authorized Registry", 12, signY + 14);

      // Draw a stamp circle/label on the bottom right
      doc.setDrawColor(49, 151, 149);
      doc.setLineWidth(1.2);
      doc.setFillColor(255, 255, 255);
      doc.circle(172, signY + 12, 13, "S"); // Stamp circle

      doc.setTextColor(49, 151, 149);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(6);
      doc.text("VERIFIED", 164.5, signY + 9);
      doc.setFontSize(8.5);
      doc.text("STAMP", 163.5, signY + 12.5);
      doc.setFontSize(5);
      doc.text("REGISTRY DEPT", 162.5, signY + 15.5);

      doc.setTextColor(180, 190, 200);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text("VERAMEDICA ONLINE LAB RECORD SYSTEM | CRYPTO SIGNATURE SECURED", 12, 280);

      // Save PDF output
      doc.save(`VeraMedica-Health-Report-${patientName.replace(/\s+/g, '-')}.pdf`);

      showToast("Diagnostic report downloaded successfully in PDF format!");
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      showToast("Error generating PDF. Please trigger the print action as fallback.");
    }
  };

  const loadPastEntry = (entry: HealthLogEntry) => {
    setSystolic(entry.systolic);
    setDiastolic(entry.diastolic);
    setHeartRate(entry.heartRate);
    setBloodSugar(entry.bloodSugar);
    setSleepHours(entry.sleepHours);
    setActiveMinutes(entry.activeMinutes);
    setWaterLiters(entry.waterLiters);
    setNotes(entry.notes || '');
    setLogDate(entry.date);
    showToast(`Loaded details from: ${entry.date}`);
  };

  // Helper score coloring
  const getScoreColor = (num: number) => {
    if (num >= 90) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", color: "#10b981" };
    if (num >= 80) return { text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/20", border: "border-teal-200 dark:border-teal-800", color: "#14b8a6" };
    if (num >= 70) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800", color: "#f59e0b" };
    return { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-200 dark:border-rose-800", color: "#f43f5e" };
  };

  const activeColor = getScoreColor(currentCalculatedScore);

  // Custom SVG scale mapping functions for dynamic graphs
  const drawGraph = () => {
    const width = 640;
    const height = 180;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 25;

    const availableWidth = width - paddingLeft - paddingRight;
    const availableHeight = height - paddingTop - paddingBottom;

    if (history.length < 2) {
      return (
        <div className="h-[180px] flex items-center justify-center text-xs text-slate-400 font-medium">
          Insufficient data. Log at least 2 entries to trace linear clinical developments.
        </div>
      );
    }

    // Determine min/max values based on graph tab
    let values: number[] = [];
    let secondaryValues: number[] = []; // For Systolic/Diastolic BP
    let label = '';

    if (graphTab === 'bp') {
      values = history.map(h => h.systolic);
      secondaryValues = history.map(h => h.diastolic);
      label = "Blood Pressure (mmHg)";
    } else if (graphTab === 'heart') {
      values = history.map(h => h.heartRate);
      label = "Heart Rate (bpm)";
    } else if (graphTab === 'sugar') {
      values = history.map(h => h.bloodSugar);
      label = "Fasting Glucose (mg/dL)";
    } else {
      values = history.map(h => h.sleepHours);
      label = "Sleep Duration (hours)";
    }

    const allYValues = [...values, ...(secondaryValues.length > 0 ? secondaryValues : [])];
    const rawMinY = Math.min(...allYValues);
    const rawMaxY = Math.max(...allYValues);
    
    // Nice rounded scale range
    const minY = Math.max(0, Math.floor(rawMinY * 0.9 / 5) * 5);
    const maxY = Math.ceil(rawMaxY * 1.1 / 5) * 5;
    const rangeY = maxY - minY || 10;

    // Date/Index tracking
    const count = history.length;
    
    const getX = (index: number) => {
      if (count <= 1) return paddingLeft;
      return paddingLeft + (index / (count - 1)) * availableWidth;
    };

    const getY = (val: number) => {
      // Invert for SVG grid coordinate
      return height - paddingBottom - ((val - minY) / rangeY) * availableHeight;
    };

    // Build the SVG lines path d string
    let pathD = "";
    let secondaryPathD = "";
    let areaD = "";
    let secondaryAreaD = "";

    history.forEach((entry, i) => {
      const x = getX(i);
      const y = getY(values[i]);
      
      if (i === 0) {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${height - paddingBottom} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
      
      if (i === count - 1) {
        areaD += ` L ${x} ${height - paddingBottom} Z`;
      }
    });

    if (secondaryValues.length > 0) {
      history.forEach((entry, i) => {
        const x = getX(i);
        const y = getY(secondaryValues[i]);
        if (i === 0) {
          secondaryPathD = `M ${x} ${y}`;
          secondaryAreaD = `M ${x} ${height - paddingBottom} L ${x} ${y}`;
        } else {
          secondaryPathD += ` L ${x} ${y}`;
          secondaryAreaD += ` L ${x} ${y}`;
        }
        if (i === count - 1) {
          secondaryAreaD += ` L ${x} ${height - paddingBottom} Z`;
        }
      });
    }

    // Horizontal helper grid lines
    const gridRows = 4;
    const rows = [];
    for (let i = 0; i <= gridRows; i++) {
      const labelVal = Math.round(minY + (i / gridRows) * rangeY);
      const yOffset = getY(labelVal);
      rows.push({ y: yOffset, val: labelVal });
    }

    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="secondaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="pointDropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Guidelines Grid */}
          {rows.map((row, index) => (
            <g key={`grid-${index}`} className="opacity-45 dark:opacity-20 animate-fade-in">
              <line 
                x1={paddingLeft} 
                y1={row.y} 
                x2={width - paddingRight} 
                y2={row.y} 
                stroke="#cbd5e1" 
                strokeWidth="1" 
                strokeDasharray="4 6" 
              />
              <text 
                x={paddingLeft - 8} 
                y={row.y + 4} 
                textAnchor="end" 
                className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px] font-semibold"
              >
                {row.val}
              </text>
            </g>
          ))}

          {/* Area Gradients */}
          {secondaryAreaD && (
            <path d={secondaryAreaD} fill="url(#secondaryAreaGrad)" className="animate-fade-in" />
          )}
          <path d={areaD} fill="url(#primaryAreaGrad)" className="animate-fade-in" />

          {/* Trend Lines */}
          {secondaryPathD && (
            <path 
              d={secondaryPathD} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="animate-fade-in"
            />
          )}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#14b8a6" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-fade-in"
          />

          {/* Vertical Grid Dates Bottom ticks */}
          {history.map((entry, index) => {
            const x = getX(index);
            // Format "MM-DD" from "YYYY-MM-DD"
            const shortDate = entry.date.split("-").slice(1).join("/");
            return (
              <g key={`date-${index}`} className="opacity-100">
                <line 
                  x1={x} 
                  y1={height - paddingBottom} 
                  x2={x} 
                  y2={height - paddingBottom + 5} 
                  stroke="#cbd5e1" 
                  strokeWidth="1.5" 
                />
                <text 
                  x={x} 
                  y={height - 8} 
                  textAnchor="middle" 
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-bold font-mono tracking-tight"
                >
                  {shortDate}
                </text>
              </g>
            );
          })}

          {/* Secondary data point dots */}
          {secondaryValues.length > 0 && history.map((entry, index) => {
            const x = getX(index);
            const y = getY(secondaryValues[index]);
            const isHovered = hoveredPointIndex === index;
            return (
              <circle
                key={`sec-dot-${index}`}
                cx={x}
                cy={y}
                r={isHovered ? 7 : 4}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={isHovered ? 3.5 : 2.5}
                className="cursor-pointer transition-all duration-150"
                filter="url(#pointDropShadow)"
                onMouseEnter={() => setHoveredPointIndex(index)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              />
            );
          })}

          {/* Primary data point dots */}
          {history.map((entry, index) => {
            const x = getX(index);
            const y = getY(values[index]);
            const isHovered = hoveredPointIndex === index;
            return (
              <circle
                key={`dot-${index}`}
                cx={x}
                cy={y}
                r={isHovered ? 8 : 4.5}
                fill="#ffffff"
                stroke="#14b8a6"
                strokeWidth={isHovered ? 4 : 3}
                className="cursor-pointer transition-all duration-150"
                filter="url(#pointDropShadow)"
                onMouseEnter={() => setHoveredPointIndex(index)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              />
            );
          })}

          {/* Dynamic Value Tooltip Overlay Text Indicator */}
          {hoveredPointIndex !== null && (
            <g className="animate-fade-in transition-all z-40 pointer-events-none">
              <rect
                x={Math.max(paddingLeft + 5, Math.min(getX(hoveredPointIndex) - 60, width - paddingRight - 125))}
                y={1}
                width="120"
                height="32"
                rx="6"
                fill="#0f172a"
                opacity="0.92"
              />
              <text
                x={Math.max(paddingLeft + 5, Math.min(getX(hoveredPointIndex) - 60, width - paddingRight - 125)) + 60}
                y={15}
                textAnchor="middle"
                className="fill-white font-sans text-[9px] font-black tracking-wide uppercase"
              >
                {history[hoveredPointIndex].date}
              </text>
              <text
                x={Math.max(paddingLeft + 5, Math.min(getX(hoveredPointIndex) - 60, width - paddingRight - 125)) + 60}
                y={26}
                textAnchor="middle"
                className="fill-teal-300 font-mono text-[10px] font-black"
              >
                {graphTab === 'bp' 
                  ? `BP: ${history[hoveredPointIndex].systolic}/${history[hoveredPointIndex].diastolic}` 
                  : graphTab === 'heart'
                  ? `${history[hoveredPointIndex].heartRate} bpm`
                  : graphTab === 'sugar'
                  ? `${history[hoveredPointIndex].bloodSugar} mg/dL`
                  : `${history[hoveredPointIndex].sleepHours} hours`
                }
              </text>
            </g>
          )}

        </svg>
      </div>
    );
  };

  const currentPrintedReportDate = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-10" id="comprehensive-health-tracker-tool">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-teal-650 text-white font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/30 z-[999] flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4.5 h-4.5 text-teal-300 shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Introduction Card */}
      <div className="bg-gradient-to-r from-[#0369a1] to-[#0d9488] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20"></div>
        <div className="space-y-3 z-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-[10px] uppercase font-extrabold tracking-widest text-teal-100">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            VeraMedica Smart Triage Suite
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Integrated Health Biomarker Tracker
          </h2>
          <p className="text-teal-50/95 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
            Record cardiovascular profiles, sleep architectures, active lifestyle quotients & glycemic levels. Our clinically mapped calculation system provides alerts, customized wellness plans, and professional-grade printable diagnostical records.
          </p>
        </div>
        
        {/* Rapid Print Action Button */}
        <div className="z-10 shrink-0 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={generateHealthReportPDF}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-teal-500/10 hover:scale-[1.02] active:scale-95 select-none"
            title="Saves clinical assessment directly in high-fidelity PDF format"
          >
            <Download className="w-4 h-4 text-white animate-bounce" />
            <span>DOWNLOAD REPORT (PDF)</span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-white/20 hover:scale-[1.02] active:scale-95 select-none"
            title="Inspect full medical letterhead and print option"
          >
            <Printer className="w-4 h-4 text-teal-300" />
            <span>PREVIEW & PRINT CASE FILE</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Input and Live Scoring | Right dynamic trend charts & Logs History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Inputs Panel & Live Scoring Dial (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Diagnostic Calculator Controls Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Heart className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Log Biomarkers</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinical Verification Panel</p>
                </div>
              </div>
              <input 
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-700 dark:text-slate-350 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-teal-500"
              />
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              
              {/* BP SLIDERS */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/50 dark:border-slate-800/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    Blood Pressure
                  </span>
                  <span className="font-mono font-bold text-[#0c4a6e] dark:text-[#a5f3fc]">
                    {systolic} / {diastolic} <span className="text-[10px] text-slate-400 font-sans font-medium">mmHg</span>
                  </span>
                </div>
                {/* Systolic block */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Systolic (Max Pressure)</span>
                    <span className="font-mono">{systolic}</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="200"
                    value={systolic}
                    onChange={(e) => setSystolic(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                {/* Diastolic block */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Diastolic (Min Pressure)</span>
                    <span className="font-mono">{diastolic}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="130"
                    value={diastolic}
                    onChange={(e) => setDiastolic(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* HEART RATE SLIDER */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/50 dark:border-slate-800/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    Heart Rate (Pulse)
                  </span>
                  <span className="font-mono font-bold text-rose-650 dark:text-rose-400">
                    {heartRate} <span className="text-[10px] text-slate-400 font-sans font-medium">bpm</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={heartRate}
                  onChange={(e) => setHeartRate(parseInt(e.target.value))}
                  className="w-full accent-rose-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* BLOOD SUGAR SLIDER */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/50 dark:border-slate-800/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    Fasting Blood Sugar
                  </span>
                  <span className="font-mono font-bold text-teal-650 dark:text-teal-400">
                    {bloodSugar} <span className="text-[10px] text-slate-400 font-sans font-medium">mg/dL</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="280"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(parseInt(e.target.value))}
                  className="w-full accent-teal-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* SLEEP AND ACTIVITY DUAL GRID */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Sleep Control */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/50 dark:border-slate-800/30">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                      <Moon className="w-3 h-3 text-indigo-500" />
                      Sleep
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {sleepHours}h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full accent-indigo-505 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Active Minutes Control */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/50 dark:border-slate-800/30">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      Active
                    </span>
                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                      {activeMinutes}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="5"
                    value={activeMinutes}
                    onChange={(e) => setActiveMinutes(parseInt(e.target.value))}
                    className="w-full accent-orange-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

              </div>

              {/* WATER INTAKE & NOTES ROW */}
              <div className="space-y-3.5">
                <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/50 dark:border-slate-800/30 flex items-center justify-between text-xs">
                  <span className="font-black text-slate-850 dark:text-slate-300 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-cyan-500" />
                    Water Intake (L)
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setWaterLiters(prev => Math.max(0, parseFloat((prev - 0.25).toFixed(2))))}
                      className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-extrabold flex items-center justify-center text-slate-750 dark:text-slate-350 select-none cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-cyan-650 dark:text-cyan-400 w-12 text-center text-sm">{waterLiters} L</span>
                    <button 
                      type="button"
                      onClick={() => setWaterLiters(prev => Math.min(10, parseFloat((prev + 0.25).toFixed(2))))}
                      className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-extrabold flex items-center justify-center text-slate-750 dark:text-slate-350 select-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes / Medical Remarks</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Felt nervous, walk pre-coffee..."
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-300 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* SAVE ACTION BUTTON */}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-650 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs tracking-wider uppercase rounded-2xl shadow-md cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save Assessment Log</span>
              </button>

            </form>
          </div>

          {/* Current Dynamic Health Score Dial */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs flex flex-col items-center justify-center relative text-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 select-none">
              DYNAMIC WELLNESS SCORE
            </h4>
            
            {/* Custom SVG Radial Indicator */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#e2e8f0"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                />
                {/* Colored Dynamic Fill Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={activeColor.color}
                  strokeWidth="8.5"
                  strokeDasharray={314.16}
                  strokeDashoffset={314.16 - (314.16 * currentCalculatedScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              
              {/* Inner score reading text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-extrabold font-mono tracking-tighter leading-none ${activeColor.text}`}>
                  {currentCalculatedScore}
                </span>
                <span className="text-[9px] uppercase font-black tracking-wide text-slate-450 mt-1">
                  {currentCalculatedScore >= 90 ? "Excellent" : currentCalculatedScore >= 80 ? "Good" : currentCalculatedScore >= 70 ? "Fair" : "Critical"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-normal font-medium max-w-xs">
              Meticulously formulated using WHO clinical cardiovascular markers and glucose thresholds.
            </p>
          </div>

        </div>

        {/* Right Side: Graphing panels & history list (7 cols) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          {/* Trend Charts Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Biomarker Trend Graphs</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interactive Timeline Monitor</p>
                </div>
              </div>
              
              {/* Small Category SelectorTabs */}
              <div className="flex bg-slate-50 dark:bg-slate-950/45 border border-slate-150 dark:border-slate-800/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGraphTab('bp')}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    graphTab === 'bp' 
                    ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  BP
                </button>
                <button
                  type="button"
                  onClick={() => setGraphTab('heart')}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    graphTab === 'heart' 
                    ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Heart
                </button>
                <button
                  type="button"
                  onClick={() => setGraphTab('sugar')}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    graphTab === 'sugar' 
                    ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Sugar
                </button>
                <button
                  type="button"
                  onClick={() => setGraphTab('sleep')}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    graphTab === 'sleep' 
                    ? 'bg-white dark:bg-slate-800 text-teal-650 dark:text-teal-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Sleep
                </button>
              </div>
            </div>

            {/* Custom SVG Chart render */}
            <div className="bg-slate-50/40 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850 p-4 relative">
              {drawGraph()}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 mt-1 font-sans">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                  <span>Primary Index (Systolic BP / Sugar / Sleep)</span>
                </span>
                {graphTab === 'bp' && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                    <span>Secondary (Diastolic BP)</span>
                  </span>
                )}
                <span>Hover values to review</span>
              </div>
            </div>
          </div>

          {/* Dynamic Warnings, Clinical Flag Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 select-none">
              ACTIVE RISKS & ADVISORY WATCH
            </h4>
            
            {currentWarnings.length > 0 ? (
              <div className="space-y-3">
                {currentWarnings.map((alert, i) => (
                  <div 
                    key={`alert-${i}`} 
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border ${
                      alert.severity === 'critical'
                      ? 'bg-rose-50/50 dark:bg-rose-950/15 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-350'
                      : alert.severity === 'warning'
                      ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-150 dark:border-amber-900/40 text-amber-800 dark:text-amber-350'
                      : 'bg-blue-50/50 dark:bg-blue-950/15 border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-350'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-rose-500' : alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                    }`} />
                    <div>
                      <strong className="text-xs font-black block leading-none mb-1">{alert.title}</strong>
                      <span className="text-[11px] leading-relaxed font-normal block">{alert.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-450 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <strong className="block font-black mb-0.5">Biomarker Balance Intact</strong>
                  <span className="font-normal text-[11px] leading-relaxed block text-emerald-700/90 dark:text-emerald-450/90">
                    No critical pathological indicators flagged. All variables are positioned smoothly.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actionable Clinical Directives (Improvements) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 select-none">
              TAILORED OUTPATIENT STEPS TO RECOVER
            </h4>
            <div className="space-y-3.5">
              {improvementsList.map((imp, idx) => (
                <div key={`imp-${idx}`} className="flex items-start gap-3 text-xs text-slate-655 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-150 dark:border-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 text-[10px] font-black mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed font-medium">{imp}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* History List - full width dashboard block */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950/45 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Health Assessment Journal</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Logged Patient Records</p>
            </div>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Click individual row cards to import logged variables into active modeling inputs above.
          </div>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-655 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 font-black uppercase text-[10px] tracking-wider text-left">
                  <th className="py-3 px-4">Log Date</th>
                  <th className="py-3 px-4">Pulse (HR)</th>
                  <th className="py-3 px-4">Blood Pressure</th>
                  <th className="py-3 px-4">Blood Glucose</th>
                  <th className="py-3 px-4">Sleep Cycle</th>
                  <th className="py-3 px-4 pt-4 pb-2.5">Score</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Clear</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {history.slice().reverse().map((entry) => {
                  const entryColor = getScoreColor(entry.score);
                  return (
                    <tr 
                      key={entry.id} 
                      onClick={() => loadPastEntry(entry)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100">{entry.date}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black">{entry.heartRate}</span> <span className="text-[10px] text-slate-400">bpm</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black">{entry.systolic}/{entry.diastolic}</span> <span className="text-[10px] text-slate-400">mmHg</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black">{entry.bloodSugar}</span> <span className="text-[10px] text-slate-400">mg/dL</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black">{entry.sleepHours}</span> <span className="text-[10.5px] text-slate-400">hrs</span> / <span className="font-mono font-black">{entry.activeMinutes}</span> <span className="text-[10.5px] text-slate-400">mins</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block font-mono font-black px-2.1 py-0.5 rounded text-[10px] border ${entryColor.bg} ${entryColor.text} ${entryColor.border}`}>
                          {entry.score}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 truncate max-w-[150px] font-medium text-slate-400 dark:text-slate-500">
                        {entry.notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => removeHistoryEntry(entry.id, e)}
                          className="p-1 text-slate-350 hover:text-red-500 transition-colors cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-450 uppercase font-black tracking-widest text-[11px]">
            No health logs stored inside patient history index. Log variables above.
          </div>
        )}
      </div>

      {/* PRINT REPORT DIALOG MODAL / CUSTOM PREVIEW OVERLAY */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] overflow-y-auto flex items-center justify-center p-4">
            
            {/* Modal Body Container with a high-fidelity Clinical Sheet Letterhead layout */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              id="printable-evaluation-case-file"
              className="bg-white text-slate-900 rounded-3xl shadow-2xl p-6 md:p-10 max-w-4xl w-full border border-slate-200 relative text-left"
            >
              
              {/* Header Action Row (Hidden on System Printer View natively) */}
              <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-100 mb-6 gap-4 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <span className="text-xs font-black tracking-wider uppercase text-slate-600">Official Outpatient Report Statement</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={generateHealthReportPDF}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer select-none border-2 border-teal-500/25"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>DOWNLOAD PDF NOW</span>
                  </button>
                  <button
                    onClick={() => {
                      // Trigger native window print
                      window.print();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 font-black text-xs uppercase tracking-wide rounded-xl transition-all cursor-pointer select-none"
                  >
                    <Printer className="w-4 h-4 text-slate-605" />
                    <span>PRINT / SAVE STATE</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-red-50 hover:text-red-650 text-slate-700 font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer select-none"
                  >
                    <span>CLOSE PREVIEW</span>
                  </button>
                </div>
              </div>

              {/* Official Clinician Letterhead Content Sheet */}
              <div className="space-y-6 print:p-0">
                
                {/* Clinic Header Emblem */}
                <div className="flex justify-between items-center pb-5 border-b-2 border-slate-900">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-widest text-[#071330] font-sans">
                        VERAMEDICA DIAGNOSTIC CORP
                      </span>
                    </div>
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Bhubaneswar Outpatient Registry & Endocrinology Lab
                    </span>
                    <span className="block text-[9px] text-slate-400 font-medium leading-none">
                      Registered Licensure Code: VM-OD-751001-A | Tech Enabled Clinical Registry
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-white bg-slate-950 px-3 py-1 rounded block w-fit ml-auto">
                      ANALYSIS REPORT
                    </span>
                    <span className="block text-[11px] font-mono font-bold text-slate-600 mt-2">
                      ID: VM-CASE-2026-904
                    </span>
                  </div>
                </div>

                {/* Patient Information Sheet Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-sans">
                  <div>
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Patient Name</span>
                    <strong className="text-slate-900 font-bold block mt-0.5">{patientName}</strong>
                  </div>
                  <div>
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Portal Mail Address</span>
                    <span className="text-slate-700 font-medium block mt-0.5">{patientEmail}</span>
                  </div>
                  <div>
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Age / Gender</span>
                    <span className="text-slate-700 font-bold block mt-0.5">{patientAge} Years / {patientGender}</span>
                  </div>
                  <div>
                    <span className="block text-[9.5px] font-bold uppercase text-slate-400 tracking-wider">Evaluation Date</span>
                    <span className="text-slate-700 font-mono font-bold block mt-0.5">{currentPrintedReportDate}</span>
                  </div>
                </div>

                {/* Biomarker Core Variable Summary Panels */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5">
                    1. CURRENT METRIC ASSESSMENT QUADRANTS
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="p-3 border border-slate-200 rounded-xl bg-white text-xs">
                      <span className="font-bold text-slate-500 block text-[9.5px] uppercase tracking-wider">Blood Pressure</span>
                      <strong className="text-[15px] font-extrabold font-mono text-slate-900 block mt-1">{systolic} / {diastolic} mmHg</strong>
                      <span className={`block text-[9.5px] font-black uppercase tracking-wide mt-1.5 ${
                        systolic >= 140 || diastolic >= 90 ? 'text-red-655' : systolic >= 130 || diastolic >= 80 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {systolic >= 140 || diastolic >= 90 ? '🚨 HYPERTENSION' : systolic >= 130 || diastolic >= 80 ? '⚠️ ELEVATED' : '✓ OPTIMAL'}
                      </span>
                    </div>

                    <div className="p-3 border border-slate-200 rounded-xl bg-white text-xs">
                      <span className="font-bold text-slate-500 block text-[9.5px] uppercase tracking-wider">Heart Rate Pulse</span>
                      <strong className="text-[15px] font-extrabold font-mono text-slate-900 block mt-1">{heartRate} bpm</strong>
                      <span className={`block text-[9.5px] font-black uppercase tracking-wide mt-1.5 ${
                        heartRate > 100 || heartRate < 50 ? 'text-red-655' : 'text-emerald-600'
                      }`}>
                        {heartRate > 100 ? '⚠️ TACHYCARDIA' : heartRate < 55 ? '🧘 ATHLETICS' : '✓ REGULAR RESTING'}
                      </span>
                    </div>

                    <div className="p-3 border border-slate-200 rounded-xl bg-white text-xs">
                      <span className="font-bold text-slate-500 block text-[9.5px] uppercase tracking-wider">Fasting Glucose</span>
                      <strong className="text-[15px] font-extrabold font-mono text-slate-900 block mt-1">{bloodSugar} mg/dL</strong>
                      <span className={`block text-[9.5px] font-black uppercase tracking-wide mt-1.5 ${
                        bloodSugar >= 126 ? 'text-red-751' : bloodSugar >= 100 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {bloodSugar >= 126 ? '🚨 hyperglycemic' : bloodSugar >= 100 ? '⚠️ IMPAIRED BASE' : '✓ HEALTHY SYST'}
                      </span>
                    </div>

                    <div className="p-3 border border-slate-200 rounded-xl bg-white text-xs">
                      <span className="font-bold text-slate-500 block text-[9.5px] uppercase tracking-wider">Wellness Score</span>
                      <strong className="text-[15px] font-extrabold font-mono text-slate-900 block mt-1">{currentCalculatedScore} / 100</strong>
                      <span className={`block text-[9.5px] font-black uppercase tracking-wide mt-1.5 ${
                        currentCalculatedScore >= 80 ? 'text-emerald-600' : currentCalculatedScore >= 70 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {currentCalculatedScore >= 90 ? '★ EXCELLENT MET' : currentCalculatedScore >= 80 ? '✓ GOOD STATUS' : '⚠️ OUT OF BAND'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Patient Sleep, Activity, Hydration logs inside Printable */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                  <div className="text-xs">
                    <span className="font-bold text-slate-450 text-[10px] uppercase">Logged Sleep Cycle</span>
                    <strong className="block text-slate-850 mt-0.5 font-bold">{sleepHours} Hours / Day</strong>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-450 text-[10px] uppercase">Physical Movement</span>
                    <strong className="block text-slate-855 mt-0.5 font-bold">{activeMinutes} Active Minutes</strong>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-450 text-[10px] uppercase">Daily Hydration</span>
                    <strong className="block text-slate-850 mt-0.5 font-bold">{waterLiters} Liters Water</strong>
                  </div>
                </div>

                {/* Warnings / High-Fidelity Alert Index inside report */}
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    2. ACTIVE PATHOLOGICAL RISKS & PATHWAY FLAGS
                  </h3>
                  
                  {currentWarnings.length > 0 ? (
                    <div className="space-y-1.5">
                      {currentWarnings.map((alert, idx) => (
                        <div key={`p-alert-${idx}`} className="text-xs leading-relaxed flex items-start gap-1.5">
                          <span className="text-red-600 font-extrabold shrink-0">[!]</span>
                          <p className="text-slate-700">
                            <strong>{alert.title}</strong>: {alert.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-lg leading-relaxed">
                      ✓ Optimal Assessment Verified: Patient exhibits stable arterial tension, standard metabolic hormone responses, active cellular oxygenation indices and adequate hydration constants.
                    </p>
                  )}
                </div>

                {/* Recommendations checklist (Advisory details) */}
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    3. OUTPATIENT REHABILITATION STEPS & DIRECTIVES
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-705 ml-1">
                    {improvementsList.map((imp, idx) => (
                      <li key={`rec-${idx}`} className="leading-relaxed">
                        <span className="font-medium">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Outro stamping signature section */}
                <div className="pt-8 border-t border-slate-350 flex justify-between items-end gap-6 text-xs text-sans mt-8">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Report Certified By</span>
                    <strong className="text-slate-850 font-bold block mt-1 text-sm">Bhubaneswar Endocrinology Joint Board</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">VeraMedica Diagnostic Systems</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {/* Visual Clinical Stamp Graphic */}
                    <div className="w-20 h-20 rounded-full border-4 border-teal-600/30 flex items-center justify-center relative rotate-12 -mb-2 overflow-hidden select-none opacity-80">
                      <div className="text-center font-extrabold text-[8px] text-teal-600/70 select-none uppercase tracking-tight leading-none">
                        VERIFIED<br />
                        <span className="text-[10px] font-black">STAMP</span><br />
                        Registry Dept
                      </div>
                    </div>
                    <span className="block text-[8px] text-slate-400 font-bold font-mono uppercase">VERAMEDICA ONLINE LAB QR DEPLOYED</span>
                  </div>
                </div>

                {/* Bottom Action Row for easy scrolling download (Hidden on print) */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3 print:hidden mt-8">
                  <span className="text-xs text-slate-500 mr-auto font-medium">Ready to save? You can export directly as PDF.</span>
                  <button
                    onClick={generateHealthReportPDF}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer select-none border-2 border-teal-500/25"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>DOWNLOAD PDF NOW</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 font-black text-xs uppercase tracking-wide rounded-xl transition-all cursor-pointer select-none"
                  >
                    <Printer className="w-4 h-4 text-slate-605" />
                    <span>PRINT / SAVE STATE</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-red-50 hover:text-red-650 text-slate-705 font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer select-none"
                  >
                    <span>CLOSE PREVIEW</span>
                  </button>
                </div>

              </div>
              
              {/* Printing Overlay Specific styling to omit rest of page body */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-evaluation-case-file, #printable-evaluation-case-file * {
                    visibility: visible;
                  }
                  #printable-evaluation-case-file {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    max-width: 100%;
                    border: none;
                    box-shadow: none;
                    padding: 0;
                    margin: 0;
                    background: white;
                    color: black;
                  }
                  .print\\:hidden {
                    display: none !important;
                  }
                }
              `}</style>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
