import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Calendar as CalendarIcon, Syringe, User, Award, Printer, ChevronLeft, ChevronRight,
  Clock, AlertCircle, CheckCircle2, ShieldCheck, Heart, Info, ArrowRight, Trash2, Download
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ScheduledVaccine {
  id: string;
  patientName: string;
  dob: string;
  age: number;
  vaccineName: string;
  vaccineType: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  referenceId: string;
  remarks?: string;
}

export default function VaccinationScheduler({ currentUser }: { currentUser: any }) {
  const { language, t } = useLanguage();

  const currentPrintedReportDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // Patient Info & Defaults
  const defaultName = currentUser?.name || "Subhransu Mohapatra";
  const defaultEmail = currentUser?.email || "patient@veramedica.in";
  const defaultGender = currentUser?.gender || "Male";

  // Form Fields State
  const [patientName, setPatientName] = useState(defaultName);
  const [dob, setDob] = useState("1998-03-12");
  const [selectedVaccine, setSelectedVaccine] = useState("COVID-19 Booster");
  const [scheduledDate, setScheduledDate] = useState("2026-06-20");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [location, setLocation] = useState("Arogyam Apex Triage, Bhubaneswar");
  const [remarks, setRemarks] = useState("");

  // UI Toast State
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed, so 5 is June 2026

  // Print Dialog States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTargetTicket, setPrintTargetTicket] = useState<ScheduledVaccine | null>(null);

  // Hardcoded Already Booked / Fully Scheduled Dates (Red list) for June/July 2026
  const bookedDatesRegistry = useMemo(() => {
    return new Set([
      "2026-06-15", "2026-06-16", "2026-06-18", "2026-06-22", "2026-06-25", "2026-06-29",
      "2026-07-02", "2026-07-05", "2026-07-10", "2026-07-11", "2026-07-15", "2026-07-20"
    ]);
  }, []);

  // Registry of current user scheduled vaccinations
  const [myScheduledVaccines, setMyScheduledVaccines] = useState<ScheduledVaccine[]>([
    {
      id: "vac-1",
      patientName: defaultName,
      dob: "1998-03-12",
      age: 28,
      vaccineName: "Hepatitis B Booster",
      vaccineType: "Subunit Recombinant",
      scheduledDate: "2026-06-18",
      scheduledTime: "11:30 AM",
      location: "Arogyam Apex Triage, Bhubaneswar",
      referenceId: "VAC-2026-00481",
      remarks: "Annual occupational booster"
    }
  ]);

  // Dynamic automatic calculation of Age based on DOB input
  const calculatedAge = useMemo(() => {
    if (!dob) return 0;
    const dobYear = new Date(dob).getFullYear();
    const currentYearNum = new Date().getFullYear();
    const ageDiff = currentYearNum - dobYear;
    return isNaN(ageDiff) || ageDiff < 0 ? 0 : ageDiff;
  }, [dob]);

  // Clinically Mapped Vaccine Options based on calculated age thresholds
  const vaccineOptions = useMemo(() => {
    if (calculatedAge < 2) {
      return [
        { name: "BCG (Tuberculosis)", type: "Live Attenuated", dosage: "Single dose", code: "BCG" },
        { name: "Hepatitis B (Infant)", type: "Recombinant", dosage: "3-Dose Series", code: "HEPB" },
        { name: "Rotavirus Oral Vaccine", type: "Live Attenuated", dosage: "2-Dose Series", code: "ROTA" },
        { name: "DTaP (Diphtheria, Tetanus, Pertussis)", type: "Inactivated Toxoid", dosage: "Prime Dose", code: "DTAP" },
        { name: "MMR (Measles, Mumps, Rubella)", type: "Live Attenuated", dosage: "Dose 1", code: "MMR" }
      ];
    } else if (calculatedAge < 18) {
      return [
        { name: "HPV (Human Papillomavirus)", type: "Subunit Virus-Like Particle", dosage: "2-Dose Cycle", code: "HPV" },
        { name: "Meningococcal Conjugate", type: "Conjugate", dosage: "Single booster", code: "MEN" },
        { name: "Tdap Booster", type: "Inactivated Toxoid", dosage: "Decennial booster", code: "TDAP" },
        { name: "Influenza Seasonal", type: "Inactivated Quadrivalent", dosage: "Annual Shot", code: "FLUKIDS" },
        { name: "Varicella (Chickenpox) Catch-up", type: "Live Attenuated", dosage: "2-Dose Course", code: "VARI" }
      ];
    } else if (calculatedAge >= 60) {
      return [
        { name: "Shingrix (Shingles Vaccine)", type: "Recombinant Glycoprotein", dosage: "2-Dose Course", code: "SHING" },
        { name: "Pneumococcal Polysaccharide (PPSV23)", type: "Inactivated Valents", dosage: "Single Protection", code: "PNEUM23" },
        { name: "Influenza High-Dose (Senior)", type: "High-Antigen Adjuvanted", dosage: "Annual Immunization", code: "FLUHIGH" },
        { name: "RSV Vaccine (Arexvy)", type: "Recombinant Protein", dosage: "Single Dose Protection", code: "RSV" },
        { name: "COVID-19 mRNA Bivalent Vaccine", type: "mRNA", dosage: "Periodic Booster", code: "COVIDMRNA" }
      ];
    } else {
      // General Adults
      return [
        { name: "COVID-19 mRNA Booster", type: "mRNA Tech", dosage: "Intermittent reinforcement", code: "COVIDMRNA" },
        { name: "Hepatitis B (Adult)", type: "Subunit Recombinant", dosage: "3-Dose cycle", code: "HEPBADULT" },
        { name: "HPV 9-Valent Catch-up", type: "Virus-Like Particle", dosage: "3-Dose custom", code: "HPV9" },
        { name: "Influenza Standard Quadrivalent", type: "Inactivated split-virion", dosage: "Annual Immunization", code: "FLUSTANDARD" },
        { name: "Tdap (Tetanus, Diphtheria, Pertussis)", type: "Inactivated booster", dosage: "Every 10 years", code: "TDAPADULT" }
      ];
    }
  }, [calculatedAge]);

  // Set first vaccine as default whenever age category shifts
  useMemo(() => {
    if (vaccineOptions.length > 0) {
      setSelectedVaccine(vaccineOptions[0].name);
    }
  }, [vaccineOptions]);

  // Months labels list helper
  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper date generators for Interactive Calendar Grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    
    // Fill leading empty days from previous month to align weeks grid columns
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Fill current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const fullDateString = `${currentYear}-${monthStr}-${dayStr}`;
      
      const isBooked = bookedDatesRegistry.has(fullDateString);
      
      days.push({
        dayNumber: day,
        dateString: fullDateString,
        isBooked // If booked -> Red, Else -> Green (Available)
      });
    }
    
    return days;
  }, [currentYear, currentMonth, bookedDatesRegistry]);

  const handleMonthNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleMonthPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Submit appointment schedule
  const handleVerifyAndBook = (e: React.FormEvent) => {
    e.preventDefault();

    if (bookedDatesRegistry.has(scheduledDate)) {
      alert("Error: The selected date is already fully scheduled / not free. Please choose a green date on the calendar.");
      return;
    }

    const matchingVacInfo = vaccineOptions.find(v => v.name === selectedVaccine);

    const newBooking: ScheduledVaccine = {
      id: `vac-${Date.now()}`,
      patientName,
      dob,
      age: calculatedAge,
      vaccineName: selectedVaccine,
      vaccineType: matchingVacInfo?.type || "Standard Immunization",
      scheduledDate,
      scheduledTime,
      location,
      referenceId: `VAC-2026-00${Math.floor(100 + Math.random() * 900)}`,
      remarks: remarks.trim() || undefined
    };

    setMyScheduledVaccines(prev => [newBooking, ...prev]);
    showToast(`Vaccination scheduled successfully for ${patientName}!`);
    
    // Pop up printable dialog automatically with the new voucher
    setPrintTargetTicket(newBooking);
    setShowPrintModal(true);

    // Reset notes input
    setRemarks("");
  };

  const cancelAppointment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMyScheduledVaccines(prev => prev.filter(item => item.id !== id));
    showToast("Vaccination slot appointment dissolved.");
  };

  const triggerModalPrint = () => {
    if (!printTargetTicket) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors matching the luxurious visual layout: Teal secondary, dark slate, slate grays
      const primaryTeal = [13, 148, 136]; // Teal #0d9488
      const secondaryTeal = [20, 184, 166]; // Teal #14b8a6
      const darkSlate = [15, 23, 42]; // Slate 900
      const borderGrey = [226, 232, 240]; // Slate 200
      const slate500 = [100, 116, 139]; // Slate 500

      // 1. Draw elegant page double-borders
      doc.setDrawColor(13, 148, 136); // Teal
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 190, 277);

      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.3);
      doc.rect(11.5, 11.5, 187, 274);

      // 2. Clinical Header Logo Block
      doc.setFillColor(13, 148, 136); // Primary Teal
      doc.roundedRect(16, 18, 12, 12, 3, 3, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.2);
      // White plus icon on logo block
      doc.line(22, 21, 22, 27);
      doc.line(19, 24, 25, 24);

      // Clinician / Brand details
      doc.setTextColor(15, 23, 42); // slate 900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('VERAMEDICA HEALTHCARE', 32, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate 500
      doc.text('State Certified Clinical Vaccine Registry Hub', 32, 29);

      // Regional Hospital Center Info on right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Arogyam Apex Triage', 194, 22, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Janpath, Unit IV, Bhubaneswar', 194, 26, { align: 'right' });
      doc.text('OD-751001, Odisha, India', 194, 29, { align: 'right' });

      // Solid splitter
      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.6);
      doc.line(16, 36, 194, 36);

      // 3. Official Voucher Document Title Banner
      doc.setFillColor(15, 23, 42); // Dark slate
      doc.rect(16, 42, 178, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('IMMUNIZATION APPOINTMENT & CERTIFIED VOUCHER', 105, 48.5, { align: 'center' });

      // 4. Patient Demographics profile section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(13, 148, 136); // Teal primary
      doc.text('PATIENT PROFILE DEMOGRAPHICS', 18, 62);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(printTargetTicket.patientName, 18, 68);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`DOB: ${printTargetTicket.dob} (${printTargetTicket.age} Years)`, 18, 73);
      
      const ageCategory = printTargetTicket.age < 2 ? "Infant Pediatrics" : printTargetTicket.age < 18 ? "Youth Health" : printTargetTicket.age >= 60 ? "Senior Gerontology" : "Adult Immunization";
      doc.text(`Triage Hub Category: ${ageCategory}`, 18, 78);

      // Voucher authentication profile section on right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(13, 148, 136);
      doc.text('VOUCHER CERTIFICATE REGISTER', 192, 62, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(13, 148, 136);
      doc.text(printTargetTicket.referenceId, 192, 68, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${currentPrintedReportDate}`, 192, 73, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text('Status: Scheduled & Cleared', 192, 78, { align: 'right' });

      // Demographics horizontal line divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(16, 85, 194, 85);

      // 5. Vaccination diagnostics parameters grid panel
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('VACCINATION DIAGNOSTICS & SLOT PARAMETERS', 18, 93);

      doc.setFillColor(248, 250, 252); // soft backdrop fill
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(16, 97, 178, 48, 3, 3, 'FD');

      // Grid content rendering columns
      // Col 1 parameters
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Vaccine Target:', 22, 107);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(printTargetTicket.vaccineName, 63, 107);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Subtype Formula:', 22, 118);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(printTargetTicket.vaccineType, 63, 118);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Scheduled Date:', 22, 129);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 148, 136); // Primary Teal Highlight
      doc.setFontSize(10.5);
      doc.text(printTargetTicket.scheduledDate, 63, 129);

      // Col 2 parameters
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Allotted Hour:', 110, 107);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(printTargetTicket.scheduledTime, 148, 107);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Clinical Center:', 110, 118);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8); // smaller font size in case of long registry center string
      doc.text(printTargetTicket.location, 148, 118);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Registry Clearance:', 110, 129);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // static emerald green
      doc.text('AVAI CLEAR (PASSED)', 148, 129);

      // Split lines divider
      let activeYCoord = 153;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(16, activeYCoord, 194, activeYCoord);
      activeYCoord += 8;

      // 6. Contraindicative client notes (if present)
      if (printTargetTicket.remarks) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(153, 27, 27); // deep crimson red
        doc.text('ALLERGY AND ATTENDING CONTRAINDICTIVE NOTES', 18, activeYCoord);
        
        doc.setFillColor(254, 242, 242); // rose background
        doc.setDrawColor(254, 226, 226);
        doc.setLineWidth(0.2);
        doc.roundedRect(16, activeYCoord + 2.5, 178, 16, 2, 2, 'FD');

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(153, 27, 27);
        const splitComments = doc.splitTextToSize(`"${printTargetTicket.remarks}"`, 170);
        doc.text(splitComments, 21, activeYCoord + 8.5);

        activeYCoord += 26;
      }

      // 7. Official declarations and notes
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(16, activeYCoord, 194, activeYCoord);
      activeYCoord += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('OFFICIAL CLINICAL RECORD STATEMENT', 18, activeYCoord);
      activeYCoord += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const declarationLine1 = 'This digital vaccination voucher corresponds to an authenticated database schedule entry. Present this QR/Voucher code on your mobile device or physical printout upon arrival at the designated clinical center. Please arrive 10 minutes prior to your allotted block with a valid photo identity proof.';
      const declarationLine2 = 'For support or scheduling adjustments, contact the Arogyam Helpdesk toll-free at 1800-AROGYAM or write to coordinator@veramedica.in. Your immunological record is preserved in secondary cloud repositories in compliance with healthcare data protection standards.';

      const parsedLines1 = doc.splitTextToSize(declarationLine1, 178);
      doc.text(parsedLines1, 18, activeYCoord);
      activeYCoord += 14;

      const parsedLines2 = doc.splitTextToSize(declarationLine2, 178);
      doc.text(parsedLines2, 18, activeYCoord);
      activeYCoord += 15;

      // 8. Artificial barcode security seal
      doc.setFillColor(15, 23, 42);
      const barcodeStartX = 18;
      for (let i = 0; i < 48; i++) {
        const thickness = (i % 3 === 0) ? 0.35 : (i % 4 === 0) ? 0.95 : 0.6;
        const spacingGap = i * 1.5;
        if (barcodeStartX + spacingGap < 110) {
          doc.rect(barcodeStartX + spacingGap, activeYCoord + 1, thickness, 11, 'F');
        }
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`*SECURE-ID-${printTargetTicket.referenceId}*`, 18, activeYCoord + 16.5);

      // Doctor signature & registrar area on right
      doc.setDrawColor(148, 163, 184); // slate 400
      doc.setLineWidth(0.4);
      doc.line(134, activeYCoord + 11.5, 192, activeYCoord + 11.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Authorized Registrar', 163, activeYCoord + 15.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('VeraMedica Digital Signature System', 163, activeYCoord + 18.5, { align: 'center' });

      // Encrypted secure disclaimer header line
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(132, activeYCoord - 4, 60, 5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(13, 148, 136);
      doc.text('SECURE & ENCRYPTED ELECTRONIC RECORD', 162, activeYCoord - 0.5, { align: 'center' });

      // Clean footer watermarks
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Copyright © 2026 VeraMedica Diagnostic Corporation. Generated digital record.', 105, 281, { align: 'center' });

      // Save PDF output file triggering standard browser downloader
      const filename = `Vaccination_Voucher_${printTargetTicket.referenceId}.pdf`;
      doc.save(filename);
      showToast(`Voucher downloaded successfully as PDF: ${filename}`);

    } catch (error) {
      console.error("PDF generation failure:", error);
      showToast("Error generating PDF document. Please try again.");
    }
  };

  return (
    <div className="space-y-10" id="smart-vaccination-scheduling-microtool">
      
      {/* Toast Overlay */}
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

      {/* Header Area banner */}
      <div className="bg-gradient-to-r from-teal-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20"></div>
        
        <div className="space-y-3 z-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-[10px] uppercase font-extrabold tracking-widest text-teal-100">
            <Syringe className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            VeraMedica Immunization Platform
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Integrated Vaccination Scheduling Suite
          </h2>
          <p className="text-teal-50/95 text-xs md:text-sm max-w-xl font-medium leading-relaxed">
            Specify age / date of birth to reveal clinically tailored vaccine options. Select a slots coordinate using our real-time <span className="text-emerald-300 font-extrabold">Green (Available)</span> & <span className="text-rose-405 font-extrabold text-rose-300">Red (Scheduled/Booked)</span> calendar engine. Download or print medical vouchers directly.
          </p>
        </div>
        
        <div className="z-10 shrink-0 w-full md:w-auto">
          {myScheduledVaccines.length > 0 && (
            <button
              onClick={() => {
                setPrintTargetTicket(myScheduledVaccines[0]);
                setShowPrintModal(true);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-teal-700 font-extrabold text-xs rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-teal-600/10 hover:scale-[1.02] active:scale-95 select-none"
            >
              <Printer className="w-4 h-4 text-teal-600" />
              <span>PRINT CURRENT VOUCHER</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Registration & Calendar Selector Grid (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs text-left">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/60 mb-5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <User className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Patient & Vaccine Eligibility</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demographic Matrix verification</p>
              </div>
            </div>

            <form onSubmit={handleVerifyAndBook} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm uppercase font-black text-slate-500 dark:text-slate-300 tracking-wider">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Subhransu Mohapatra"
                    className="w-full text-sm sm:text-base font-semibold bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-200 transition-all"
                  />
                </div>

                {/* DOB & Age Automatic Display */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm uppercase font-black text-slate-500 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-teal-500" />
                    Date of Birth (Select Virtual Calendar)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full text-sm sm:text-base font-semibold bg-slate-50 dark:bg-slate-950/40 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-32 py-3.5 focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-200 font-mono transition-all [color-scheme:light] dark:[color-scheme:dark]"
                    />
                    <div className="absolute left-4 top-4 text-teal-600 dark:text-teal-400">
                      <CalendarIcon className="w-5 h-5 pointer-events-none" />
                    </div>
                    <div className="absolute right-3 top-3 bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400 text-xs font-mono font-black px-3 py-1.5 rounded-xl">
                      Age: {calculatedAge} Years
                    </div>
                  </div>
                </div>

              </div>

              {/* Vaccine Option Picker, Based on calculated age! */}
              <div className="space-y-2 p-4 rounded-2xl bg-teal-50/20 dark:bg-teal-950/10 border border-teal-500/10 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black text-teal-850 dark:text-teal-400 tracking-widest flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5 text-teal-500" />
                    Recommended Vaccine Options for {calculatedAge < 2 ? "Infants" : calculatedAge < 18 ? "Youth/Teens" : calculatedAge >= 60 ? "Seniors (60+)" : "Adults"}
                  </label>
                  <span className="text-[9px] bg-teal-100 dark:bg-teal-900 border border-teal-200 dark:border-teal-850 text-teal-700 dark:text-teal-300 font-extrabold px-2 py-0.5 rounded">
                    Clinical Match
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {vaccineOptions.map((vaccine) => {
                    const isSelected = selectedVaccine === vaccine.name;
                    return (
                      <div
                        key={vaccine.code}
                        onClick={() => setSelectedVaccine(vaccine.name)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left select-none relative overflow-hidden ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500 dark:border-teal-400 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100 pr-4 leading-normal">{vaccine.name}</h4>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5 absolute right-2.5 top-2.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          <span className="bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded leading-none">{vaccine.type}</span>
                          <span className="leading-none">•</span>
                          <span className="leading-none">{vaccine.dosage}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Location & Time parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Facility picker */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-450 dark:text-slate-400 tracking-wider">Vaccination Facility Hub</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-300"
                  >
                    <option value="Arogyam Apex Triage, Bhubaneswar">Arogyam Apex Triage, Bhubaneswar</option>
                    <option value="VeraMedica Satellite Clinic, Cuttack">VeraMedica Satellite Clinic, Cuttack</option>
                    <option value="Arogyam Child Care Annex, Puri Road">Arogyam Child Care Annex, Puri Road</option>
                    <option value="VeraMedica Outreach Camp, Khordha">VeraMedica Outreach Camp, Khordha</option>
                  </select>
                </div>

                {/* Appointment time slot picker */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-450 dark:text-slate-400 tracking-wider">Scheduled Time slot</label>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 focus:outline-none focus:border-teal-500 text-slate-800 dark:text-slate-350"
                  >
                    <option value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM (Early Slot)</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="1:30 PM - 2:30 PM">1:30 PM - 2:30 PM (Post-Lunch)</option>
                    <option value="2:30 PM - 3:30 PM">2:30 PM - 3:30 PM</option>
                    <option value="3:30 PM - 4:30 PM">3:30 PM - 4:30 PM (Late-Evening)</option>
                  </select>
                </div>

              </div>

              {/* Remarks Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-450 dark:text-slate-400 tracking-wider">Special Health Requests / Allergies</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Allergy to egg protein, history of mild vasovagal syncope (fainting)..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3.5 focus:outline-none focus:border-teal-500 text-slate-850 dark:text-slate-305 placeholder-slate-400"
                />
              </div>

              {/* REAL SUBMIT TRIGGER */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-6">
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">CURRENTLY SELECTED</p>
                  <p className="text-[#0d9488] dark:text-[#2dd4bf] font-bold text-xs mt-1.5 leading-none font-mono">
                    Date: {scheduledDate || "Select from Calendar"}
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={!scheduledDate}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Schedule & Get PDF Voucher</span>
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Right Hand: CLINICAL SLOT SCHEDULER CALENDARY SYSTEM (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Custom Interactive Color-Coded Calendar Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs text-left">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/60 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Real-time Slot Planner</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinical Availability Map</p>
                </div>
              </div>

              {/* Month/Year Controllers */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleMonthPrev}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black font-mono tracking-wider w-24 text-center text-slate-800 dark:text-slate-200">
                  {monthsList[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={handleMonthNext}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Micro Instructions & Indicators Map info */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-100/60 dark:border-slate-800/40 p-2.5 rounded-xl text-[10px] mb-4">
              <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Green: Free / Available</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Red: Fully Scheduled</span>
              </div>
            </div>

            {/* Calendar Table */}
            <div className="space-y-1 select-none">
              
              {/* Day of week labels header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase text-slate-400 tracking-wider">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar cells grid */}
              <div className="grid grid-cols-7 gap-1 pt-1">
                {calendarDays.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="aspect-square bg-slate-50/50 dark:bg-slate-950/5 rounded-lg opacity-30"></div>;
                  }

                  const isSelected = scheduledDate === cell.dateString;
                  const isToday = cell.dateString === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={`day-${cell.dayNumber}`}
                      onClick={() => {
                        if (cell.isBooked) {
                          alert("This clinic day is fully scheduled or not available. Please choose a green clinical slot date instead.");
                        } else {
                          setScheduledDate(cell.dateString);
                        }
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all border relative ${
                        isSelected
                          ? 'border-indigo-650 bg-indigo-500 text-white font-black scale-105 shadow-md z-10'
                          : cell.isBooked
                          ? 'border-rose-100 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/10 text-rose-500 hover:bg-rose-100/50'
                          : 'border-emerald-100 dark:border-emerald-950/40 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 hover:border-emerald-400'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">{cell.dayNumber}</span>
                      
                      {/* Interactive Bottom Color Indicator Ticks */}
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected 
                          ? 'bg-white' 
                          : cell.isBooked 
                          ? 'bg-rose-500 animate-pulse' 
                          : 'bg-emerald-500'
                      }`} />

                      {/* Small Today text hint overlay */}
                      {isToday && (
                        <span className="absolute top-0.5 right-1 text-[7px] font-extrabold uppercase scaling-75 text-slate-450 leading-none">
                          TD
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              💡 <strong>Instruction:</strong> Double click on any <span className="text-emerald-500 font-extrabold">Green date tile</span> on the calendar above to lock it as your targeted appointment scheduled date.
            </p>
          </div>

          {/* Registry list with already booked items of the current patient */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs text-left">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 mb-4 select-none flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              My Registered Vaccinations
            </h4>

            {myScheduledVaccines.length > 0 ? (
              <div className="space-y-3">
                {myScheduledVaccines.map((booking) => (
                  <div 
                    key={booking.id}
                    onClick={() => {
                      setPrintTargetTicket(booking);
                      setShowPrintModal(true);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 hover:border-teal-500/50 cursor-pointer group transition-all flex items-start justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-none group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {booking.vaccineName}
                        </span>
                        <span className="text-[9px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold leading-none">
                          {booking.referenceId}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
                        Scheduled: <span className="text-indigo-650 dark:text-indigo-400 font-mono font-bold">{booking.scheduledDate}</span> • Time: <span className="font-mono">{booking.scheduledTime}</span>
                      </p>

                      <p className="text-[10px] text-slate-400 font-medium font-mono">
                        Facility: {booking.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        title="Print Voucher"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintTargetTicket(booking);
                          setShowPrintModal(true);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 rounded-lg cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Cancel Slot"
                        onClick={(e) => cancelAppointment(booking.id, e)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-500 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Syringe className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No vaccinations scheduled yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Specify DOB and pick an available date above to book.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* PRINTABLE TICKET / CERTIFICATE DIALOG PRINT MODAL */}
      <AnimatePresence>
        {showPrintModal && printTargetTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col"
            >
              
              {/* Modal controls bar */}
              <div className="bg-slate-950 p-4 text-white flex justify-between items-center print:hidden">
                <div className="flex items-center gap-1.5">
                  <Printer className="w-4.5 h-4.5 text-teal-400" />
                  <span className="text-xs font-black uppercase tracking-wider">Arogyam Medical Print Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerModalPrint}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10.5px] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all duration-300 hover:shadow-teal-500/20 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF Voucher
                  </button>
                  <button
                    onClick={() => {
                      setShowPrintModal(false);
                      setPrintTargetTicket(null);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold text-[10.5px] rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* SCROLLABLE MEDICAL FILE PRINT CONTENT */}
              <div className="p-8 md:p-12 bg-white flex-1 overflow-y-auto max-h-[80vh] text-left">
                
                {/* Print area wrapper */}
                <div className="border-[3px] border-double border-teal-850 p-6 md:p-8 bg-slate-50/10 rounded-2xl relative select-text" id="medical-print-area">
                  
                  {/* Decorative Medical Badge Watermark */}
                  <div className="absolute right-6 top-6 opacity-35">
                    <ShieldCheck className="w-20 h-20 text-teal-600/20 stroke-1" />
                  </div>

                  {/* Top clinical details */}
                  <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b-2 border-teal-900/40 gap-4">
                    <div className="text-center md:text-left">
                      <h1 className="text-xl font-black text-teal-950 tracking-tight leading-none uppercase">VERAMEDICA HEALTHCARE</h1>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">State Certified Clinical Vaccine Registry Hub</p>
                      <p className="text-[9px] font-mono font-medium text-slate-450 mt-1">Reference ID: {printTargetTicket.referenceId} | Certified Record</p>
                    </div>
                    
                    <div className="text-center md:text-right font-mono text-[9px] leading-relaxed text-slate-500">
                      <strong>Arogyam Apex Triage</strong><br />
                      Janpath, Unit IV, Bhubaneswar<br />
                      OD-751001, India
                    </div>
                  </div>

                  {/* Document Title banner */}
                  <div className="my-6 bg-teal-950 text-white p-3 rounded-xl text-center">
                    <h2 className="text-xs font-black tracking-widest uppercase">IMMUNIZATION APPOINTMENT & CERTIFIED VOUCHER</h2>
                  </div>

                  {/* Patient Demographic Profile Section */}
                  <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-200">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-teal-800 block leading-none">PATIENT PROFILE DEMOGRAPHICS</span>
                      <p className="text-sm font-black text-slate-900 leading-none">{printTargetTicket.patientName}</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-none">DOB: <span className="font-mono">{printTargetTicket.dob}</span> ({printTargetTicket.age} Years)</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">Triage Hub Category: {printTargetTicket.age < 2 ? "Infant Pediatrics" : printTargetTicket.age < 18 ? "Youth Health" : printTargetTicket.age >= 60 ? "Senior Gerontology" : "Adult Immunization"}</p>
                    </div>

                    <div className="space-y-2 text-right">
                      <span className="text-[9px] uppercase font-bold text-teal-800 block leading-none">VOUCHER CERTIFICATE REGISTER</span>
                      <p className="text-sm font-mono font-black text-teal-800 leading-none">{printTargetTicket.referenceId}</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-none">Generated: <span className="font-mono">{currentPrintedReportDate}</span></p>
                      <p className="text-[10px] text-emerald-600 font-bold leading-none">Status: Scheduled & Cleared</p>
                    </div>
                  </div>

                  {/* Immunization Technical Parameter Details */}
                  <div className="py-6 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-950 leading-none">VACCINATION DIAGNOSTICS</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-100/60 p-4 rounded-xl border border-slate-200 text-xs">
                      
                      {/* Left Block */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                          <span className="text-slate-500 font-semibold">Vaccine Target</span>
                          <strong className="text-slate-850 font-bold">{printTargetTicket.vaccineName}</strong>
                        </div>

                        <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                          <span className="text-slate-500 font-semibold">Subtype Formula</span>
                          <span className="text-slate-850 font-mono font-bold text-[11px]">{printTargetTicket.vaccineType}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-semibold">Scheduled Date</span>
                          <strong className="text-indigo-850 font-mono font-black text-sm">{printTargetTicket.scheduledDate}</strong>
                        </div>
                      </div>

                      {/* Right Block */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                          <span className="text-slate-500 font-semibold">Allotted Hour Block</span>
                          <strong className="text-slate-850 font-bold">{printTargetTicket.scheduledTime}</strong>
                        </div>

                        <div className="flex justify-between items-center pb-1 border-b border-slate-200/50">
                          <span className="text-slate-500 font-semibold">Clinical Site Center</span>
                          <span className="text-slate-850 font-bold tracking-tight text-[11px]">{printTargetTicket.location}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-semibold">Registry Clearance</span>
                          <span className="bg-emerald-100 text-emerald-800 font-black text-[9.5px] px-2 py-0.5 rounded uppercase">AVAI CLEAR</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Remarks details */}
                  {printTargetTicket.remarks && (
                    <div className="pb-6 text-xs border-b border-slate-200">
                      <span className="text-[9px] uppercase font-bold text-rose-800 block mb-1">ALLERGY AND ATTENDING CONTRAINDICTIVE NOTES</span>
                      <p className="text-slate-700 bg-rose-50/50 border border-rose-100/60 p-3 rounded-lg italic select-text">
                        "{printTargetTicket.remarks}"
                      </p>
                    </div>
                  )}

                  {/* CONFIRMED BOOKING RECEIPT & ALL REGISTERED VACCINATIONS SCHEDULE */}
                  <div className="py-5 border-t border-b border-slate-200 my-5 text-xs text-left">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-teal-950">
                        OFFICIAL BOOKING CONFIRMATION & REGISTERED LINEUP
                      </h4>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl mb-4 text-slate-800">
                      <div className="flex gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-900 font-extrabold text-[11.5px] block">Status: Fully Registered & Confirmed</strong>
                          <p className="text-slate-600 text-[10.5px] mt-0.5 leading-relaxed">
                            Medical clearance validated. This voucher guarantees immunization inventory reservation at the specified facility on the scheduled date.
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[9px] uppercase font-extrabold text-slate-450 block leading-none mb-2">
                      PATIENT'S IMMUNIZATION SCHEDULE LEDGER
                    </p>

                    <div className="overflow-hidden border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left text-[10.5px] border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-650 text-[9px] uppercase">
                            <th className="p-2.5">Vaccine Model</th>
                            <th className="p-2.5 text-center">Scheduled Date</th>
                            <th className="p-2.5">Time Slot</th>
                            <th className="p-2.5">Reference ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myScheduledVaccines.map((booking) => (
                            <tr key={booking.id} className="border-b last:border-none border-slate-150">
                              <td className="p-2.5 font-bold text-slate-900">
                                {booking.vaccineName}
                                <span className="block text-[8.5px] font-semibold text-slate-400 font-mono">{booking.vaccineType}</span>
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-teal-700">{booking.scheduledDate}</td>
                              <td className="p-2.5 text-slate-600 font-medium">{booking.scheduledTime}</td>
                              <td className="p-2.5 font-mono text-slate-500 font-bold">{booking.referenceId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Attendance Checklist */}
                  <div className="py-6 space-y-2.5 text-xs">
                    <span className="text-[9px] uppercase font-bold text-teal-800 block leading-none">PRE-IMMUNIZATION COMPLIANCE INSTRUCTIONS</span>
                    
                    <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc pl-4 select-text">
                      <li>Kindly arrive 10-15 minutes prior to the scheduled time coordinate for vital registers check-up.</li>
                      <li>Carry a valid demographic credential matching the patient name ({printTargetTicket.patientName}) specified on this voucher.</li>
                      <li>Wear light, easily adjustable sleeve wear to ease shoulder anatomical access during administration.</li>
                      <li>Do not receive this immunization on an empty stomach. Make sure to feed adequate hydration cycles beforehand.</li>
                    </ul>
                  </div>

                  {/* Signatures Footer */}
                  <div className="border-t-2 border-dashed border-slate-350 pt-8 mt-4 grid grid-cols-2 items-end">
                    <div className="space-y-1 text-xs">
                      <p className="text-[9px] uppercase font-bold text-slate-450 leading-none">VERIFICATION SYSTEM BARCODE</p>
                      <div className="w-36 h-8 bg-slate-950 flex items-center justify-center text-white font-mono text-[9px] select-none rounded tracking-[6px] pl-2">
                        ||| || | | |||| ||
                      </div>
                    </div>

                    <div className="text-right space-y-1.5">
                      <div className="inline-block border-b border-slate-400 w-44 text-center pb-1">
                        <span className="font-serif italic text-sm text-teal-850">A. K. Mohapatra</span>
                      </div>
                      <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mr-6">Medical Triage Attending Signature</p>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
