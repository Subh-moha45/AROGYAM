/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Calendar, Clock, Star, MapPin, 
  Trash, CheckCircle, AlertCircle, FileText, ChevronRight, RefreshCw, X, HelpCircle,
  CreditCard, Smartphone, QrCode, ShieldCheck, Check, Loader2
} from 'lucide-react';
import { Doctor, Appointment, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { jsPDF } from 'jspdf';

interface AppointmentBookingProps {
  currentUser: UserProfile;
}

export default function AppointmentBooking({ currentUser }: AppointmentBookingProps) {
  const { t, language } = useLanguage();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  
  // Selection States
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [consultReason, setConsultReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastBookedAppointment, setLastBookedAppointment] = useState<Appointment | null>(null);

  const downloadInvoice = (apt: Appointment) => {
    try {
      const doc = new jsPDF();
      
      // Draw brand background accent bar
      doc.setFillColor(49, 151, 149); // #319795 deep teal theme
      doc.rect(0, 0, 210, 38, 'F');
      
      // Brand Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("AROGYAM HEALTHCARE SERVICES", 15, 16);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("COMPREHENSIVE MULTI-SPECIALTY CLINICAL TRIAGE & BOOKING GATEWAY", 15, 23);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL BOOKING INVOICE & MEDICAL RECEIPT", 15, 31);
      
      // Meta section background container
      doc.setFillColor(248, 250, 252); // soft grey
      doc.rect(15, 46, 180, 28, 'F');
      
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Receipt Reference:`, 20, 52);
      doc.setFont("helvetica", "normal");
      const refCode = apt.paymentTxnId ? apt.paymentTxnId.slice(-8).toUpperCase() : `MT-${apt.id.slice(-6).toUpperCase()}`;
      doc.text(refCode, 55, 52);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Booking Timestamp:`, 115, 52);
      doc.setFont("helvetica", "normal");
      const dateString = apt.createdAt ? new Date(apt.createdAt).toLocaleString() : new Date().toLocaleString();
      doc.text(dateString, 150, 52);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Registered Patient:`, 20, 59);
      doc.setFont("helvetica", "normal");
      doc.text(apt.userName || currentUser.name || 'Anonymous Patient', 55, 59);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Patient Contact Email:`, 20, 66);
      doc.setFont("helvetica", "normal");
      doc.text(apt.userEmail || currentUser.email || 'N/A', 55, 66);
      
      // Section title: Patient Consultation Allocation
      doc.setTextColor(15, 118, 110); // teal-700
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("CLINICAL SPECIALIST ALLOCATION & BOOKING", 15, 87);
      
      // Line divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 90, 195, 90);
      
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9.5);
      
      doc.setFont("helvetica", "bold");
      doc.text("Assigned Professional:", 15, 98);
      doc.setFont("helvetica", "normal");
      doc.text(apt.doctorName, 65, 98);
      
      doc.setFont("helvetica", "bold");
      doc.text("Specialty Domain:", 15, 105);
      doc.setFont("helvetica", "normal");
      doc.text(apt.specialty, 65, 105);
      
      doc.setFont("helvetica", "bold");
      doc.text("Confirmed Slot Time:", 15, 112);
      doc.setFont("helvetica", "normal");
      doc.text(`${apt.date} at ${apt.timeSlot}`, 65, 112);
      
      if (apt.notes) {
        doc.setFont("helvetica", "bold");
        doc.text("Presented Symptoms/Notes:", 15, 119);
        doc.setFont("helvetica", "normal");
        doc.text(apt.notes, 65, 119);
      }
      
      // Section title: Payment billing statements
      doc.setTextColor(15, 118, 110);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("BILLING SUMMARY & GATEWAY AUDIT", 15, 134);
      
      doc.line(15, 137, 195, 137);
      
      // Table Header row
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 142, 180, 8, 'F');
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Item / Care Service Description", 20, 147);
      doc.text("Rate Fee (INR)", 160, 147);
      
      // Service Line row
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`Specialist Diagnostic OPD Consultation (${apt.doctorName})`, 20, 158);
      const charge = apt.paymentAmount || 500;
      doc.text(`INR ${charge}.00`, 160, 158);
      
      doc.line(15, 164, 195, 164);
      
      // Payment variables
      doc.text("Transaction Status Stamp:", 20, 172);
      doc.setFont("helvetica", "bold");
      const rawStatus = (apt.paymentStatus || 'pending').toUpperCase();
      doc.text(rawStatus, 70, 172);
      
      doc.setFont("helvetica", "normal");
      doc.text("Payment Mode Channel:", 20, 179);
      doc.setFont("helvetica", "bold");
      let readableWay = "Pay Counter CASH at Clinic";
      if (apt.paymentMethod === 'upi') readableWay = "UPI Mobile Instant Autopay";
      else if (apt.paymentMethod === 'qr_code') readableWay = "BHIM UPI Static QR Scan";
      doc.text(readableWay, 70, 179);
      
      if (apt.paymentTxnId) {
        doc.setFont("helvetica", "normal");
        doc.text("Associated TXN Ref ID:", 20, 186);
        doc.setFont("helvetica", "bold");
        doc.text(apt.paymentTxnId, 70, 186);
      }
      
      // Net block
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.rect(120, 194, 75, 14, 'F');
      doc.setDrawColor(52, 211, 153); // emerald-400 border
      doc.rect(120, 194, 75, 14, 'D');
      
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`TOTAL PAID (INR):`, 125, 203);
      doc.text(`Rs. ${charge}.00`, 162, 203);
      
      // General Disclaimer / Advice
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text("* Bring a digital / printed copy of this receipt upon triage admission for seamless counter check-in.", 15, 225);
      doc.text("* Consultations can be cancelled or rescheduled up to 2 hours prior to slot time. Refund rules apply per lobby standard.", 15, 230);
      
      // Footer signature box
      doc.setDrawColor(241, 245, 249);
      doc.line(15, 245, 195, 245);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("MedTriage SafeCare Network", 15, 252);
      doc.setFont("helvetica", "italic");
      doc.text("Signatures not required on digital computer-generated clinical certifications.", 15, 256);
      
      const fileName = `medtriage-receipt-${refCode.toLowerCase()}.pdf`;
      doc.save(fileName);
      
      // Show automated confirmation success toast
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: {
          type: 'success',
          title: 'Invoice Downloaded',
          message: `Invoice PDF booklet ${fileName} exported successfully.`
        }
      }));
    } catch (err) {
      console.error("PDF generator fail: ", err);
      alert("Failed to build PDF. Please try again.");
    }
  };

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'qr_code' | 'pay_at_clinic'>('upi');
  const [upiVpa, setUpiVpa] = useState('');
  const [qrVerified, setQrVerified] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [qrCountdown, setQrCountdown] = useState(300);

  // Specialties
  const specialties = ['All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Neurologist', 'Psychiatrist'];

  useEffect(() => {
    fetchDoctors();
    fetchUserAppointments();
  }, [currentUser]);

  useEffect(() => {
    const handleSelectDoctor = (e: Event) => {
      const customEvent = e as CustomEvent<Doctor>;
      startBooking(customEvent.detail);
    };
    window.addEventListener('select-appointment-doctor', handleSelectDoctor);
    return () => window.removeEventListener('select-appointment-doctor', handleSelectDoctor);
  }, [doctors]);

  useEffect(() => {
    let interval: any;
    if (showConfirmModal && paymentMethod === 'qr_code' && !qrVerified) {
      interval = setInterval(() => {
        setQrCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showConfirmModal, paymentMethod, qrVerified]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      console.error("Error loading clinical specialists:", e);
    }
  };

  const fetchUserAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveAppointments(data);
      }
    } catch (e) {
      console.error("Error loading user bookings list:", e);
    }
  };

  const startBooking = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setConsultReason('');
    setPaymentMethod('upi');
    setUpiVpa('');
    setQrVerified(false);
    setUpiVerified(false);
    setIsLoadingPayment(false);
    setTxnId('');
    setQrCountdown(300);
    setShowConfirmModal(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) return;

    // Direct block if they chose UPI or QR code but didn't verify it
    if (paymentMethod === 'upi' && !upiVerified) {
      alert("Please authorize and verify your UPI payment first before confirming the slot.");
      return;
    }
    if (paymentMethod === 'qr_code' && !qrVerified) {
      alert("Please simulate the scan & pay confirmation first before confirming the slot.");
      return;
    }

    setIsLoading(true);

    try {
      const generatedTxnId = paymentMethod === 'pay_at_clinic' ? '' : (txnId || `UPI${Math.floor(100000000000 + Math.random() * 899999999999)}`);
      
      const bookingPayload = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: "(555) 019-2834", // mock, or standard input
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        notes: consultReason,
        paymentMethod,
        paymentAmount: selectedDoctor.consultationFee || 500,
        paymentStatus: paymentMethod === 'pay_at_clinic' ? 'pending' : 'paid',
        paymentTxnId: generatedTxnId
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Successfully booked appointment with ${selectedDoctor.name}!`);
        setLastBookedAppointment(data);
        setShowConfirmModal(false);
        fetchUserAppointments();
        
        // Dispatch instant alert toast
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: {
            type: 'info',
            title: 'Booking Submitted',
            message: `Your appointment request with ${selectedDoctor.name} has been processed. Status: PENDING.`
          }
        }));

        // Simulate automatic doctor approval confirmation in 400ms
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: {
              type: 'success',
              title: 'Appointment Confirmed',
              message: `Dr. ${selectedDoctor.name} has accepted and confirmed your session on ${selectedDate} at ${selectedTimeSlot}!`
            }
          }));
        }, 400);

        // Simulate secondary message from doctor in 800ms
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: {
              type: 'message',
              title: `Message from ${selectedDoctor.name}`,
              message: `"Hello! Welcome to our clinic list in Bhubaneswar. Please carry your past blood panels or prescription charts. See you soon!"`
            }
          }));
        }, 800);

        setTimeout(() => setSuccessMsg(''), 1000);
      }
    } catch (error) {
      console.error("Clinical booking submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (aptId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled appointment?")) return;

    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: aptId })
      });

      if (res.ok) {
        fetchUserAppointments();
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesQuery = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    return matchesQuery && matchesSpec;
  });

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'completed':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  // Generate three upcoming dates for appointment selection
  const getUpcomingDates = () => {
    const dates = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 1; i <= 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      // Skip Sundays
      if (d.getDay() === 0) continue;

      dates.push({
        raw: d.toISOString().split('T')[0],
        dayName: weekdays[d.getDay()],
        display: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
    }
    return dates.slice(0, 3);
  };

  const upcomingDates = getUpcomingDates();

  return (
    <div id="appointment-booking-view" className="space-y-6">
      
      {/* Alert Header Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-emerald-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold leading-normal">{successMsg}</span>
          </div>
          {lastBookedAppointment && (
            <button
              onClick={() => downloadInvoice(lastBookedAppointment)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 transition-all font-sans"
            >
              <FileText className="w-3.5 h-3.5" /> Download Invoice (PDF)
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left clinical catalogs */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                {t('scheduleOutpatient')}
              </h3>
              <p className="text-xs text-slate-455 mt-1">
                {t('subSchedule')}
              </p>
            </div>

            {/* Quick refreshing hook */}
            <button
              id="refresh-doctors-btn"
              onClick={fetchDoctors}
              className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Refresh clinicians"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            {/* Search Input */}
            <div className="relative">
              <input
                id="doctor-search-input"
                type="text"
                placeholder="Search clinician name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8.5 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:bg-white text-slate-705"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Specialties scroll filter */}
            <div className="flex gap-1.5 overflow-x-auto pr-1 select-none">
              <select
                id="specialty-filter-select"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 bg-white text-slate-705"
              >
                {specialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinician cards listing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                No specialists matching the selected filters found.
              </div>
            ) : (
              filteredDoctors.map(doc => (
                <div
                  key={doc.id}
                  className="bg-slate-50/40 hover:bg-slate-50/80 border border-slate-200/55 rounded-2xl p-4.5 flex gap-4 transition-all hover:shadow-xs"
                >
                  <img
                    src={doc.image}
                    alt={doc.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-cover shadow-2xs shrink-0 border border-white"
                  />
                  
                  <div className="flex-1 min-w-0 space-y-2 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-teal-650 tracking-wider block">{doc.specialty}</span>
                      <h4 className="font-extrabold text-slate-800 text-sm">{doc.name}</h4>
                    </div>

                    <p className="text-[10px] text-slate-450 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <strong>{doc.rating}</strong> ({doc.experience} Years active)
                    </p>

                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-normal">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {doc.hospital}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 font-mono bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-100 dark:border-teal-900/60 flex items-center">
                        ₹{doc.consultationFee || 500}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Consultation Fee</span>
                    </div>

                    <p className="text-[10px] text-slate-600 line-clamp-2">
                      {doc.bio}
                    </p>

                    <button
                      id={`book-specialist-${doc.id}`}
                      onClick={() => startBooking(doc)}
                      className="w-full mt-2 py-1.5 bg-white hover:bg-teal-600 border border-teal-600/30 text-teal-700 hover:text-white font-semibold text-xs rounded-lg transition-all cursor-pointer text-center"
                    >
                      Book Care Appointment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Active appointments side list */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500 animate-pulse" />
              Scheduled Visits
            </h4>
            <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-550 bg-slate-150 rounded-full">
              {activeAppointments.length} Booked
            </span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {activeAppointments.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-350 mx-auto" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">No appointments scheduled</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose a specialist to arrange your first clinical assessment.</p>
                </div>
              </div>
            ) : (
              activeAppointments.map(index => (
                <div
                  key={index.id}
                  className="p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5 text-left">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase tracking-wider ${getStatusColor(index.status)}`}>
                        {index.status}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-xs leading-normal pt-1.5">
                        {index.doctorName}
                      </h4>
                      <span className="text-[10px] text-teal-650 font-semibold block">{index.specialty}</span>
                    </div>

                    {index.status !== 'cancelled' && (
                      <button
                        id={`cancel-apt-${index.id}`}
                        onClick={() => handleCancel(index.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Cancel reservation"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 text-[10px] text-slate-600 font-medium bg-white/40 p-2 rounded-lg border border-slate-200/35">
                    <span className="flex items-center gap-1 bg-white p-1 rounded">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Date: <strong>{index.date}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-white p-1 rounded">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Slot: <strong>{index.timeSlot}</strong>
                    </span>
                  </div>

                  {index.notes && (
                    <p className="text-[10px] text-slate-500 leading-normal italic line-clamp-1">
                      Reason: "{index.notes}"
                    </p>
                  )}

                  {/* Payment Details */}
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl text-left space-y-1 text-[10px]">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-450 dark:text-slate-400">Consultation Fee:</span>
                      <span className="text-teal-650 dark:text-teal-400">₹{index.paymentAmount || 500}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-400 dark:text-slate-500">Mode:</span>
                      <span className="text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[130px]">
                        {index.paymentMethod === 'upi' ? 'UPI Transfer' : index.paymentMethod === 'qr_code' ? 'Scan & Pay QR' : 'Pay at Lobby Counter'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-400 dark:text-slate-500">Payment Status:</span>
                      <span className={`px-1.5 py-0.2 rounded-sm text-[8px] font-black uppercase ${
                        index.paymentStatus === 'paid' 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                          : 'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}>
                        {index.paymentStatus || 'pending'}
                      </span>
                    </div>
                    {index.paymentTxnId && (
                      <div className="text-[8px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-800/55 pt-1 mt-1 flex justify-between">
                        <span>Txn ID:</span>
                        <span>{index.paymentTxnId}</span>
                      </div>
                    )}
                    <button
                      onClick={() => downloadInvoice(index)}
                      className="mt-2 w-full py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900 border border-teal-100 dark:border-teal-900/60 rounded-md text-[9px] text-teal-700 dark:text-teal-400 font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Download Receipt (PDF)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Confirmation schedule Modal */}
      {showConfirmModal && selectedDoctor && (
        <div id="booking-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white" />
                Schedule Consultation
              </h3>
              <button 
                id="booking-modal-close"
                onClick={() => setShowConfirmModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
              
              {/* Doctor Quick info card */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex gap-3 text-left">
                <img
                  src={selectedDoctor.image}
                  alt={selectedDoctor.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-white shadow-2xs shrink-0"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{selectedDoctor.name}</h4>
                  <span className="text-xs text-teal-650 font-semibold">{selectedDoctor.specialty}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedDoctor.hospital}</p>
                </div>
              </div>

              {/* Day selection */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">Available Calendar Date</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {upcomingDates.map(dayItem => (
                    <button
                      id={`day-select-${dayItem.raw}`}
                      type="button"
                      key={dayItem.raw}
                      onClick={() => setSelectedDate(dayItem.display)}
                      className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${selectedDate === dayItem.display ? 'bg-teal-600 border-teal-600 text-white font-semibold' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-650'}`}
                    >
                      <span className="text-[9px] uppercase tracking-wider block opacity-90">{dayItem.dayName.substring(0, 3)}</span>
                      <span className="text-sm font-bold block mt-0.5">{dayItem.display}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots selection */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider">Clinical Availability Slots</label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDoctor.timeSlots.map(slot => (
                    <button
                      id={`slot-select-${slot.replace(/[: ]/g, '')}`}
                      type="button"
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-1.5 px-2 border text-xs rounded-lg transition-all cursor-pointer ${selectedTimeSlot === slot ? 'bg-teal-600 border-teal-600 text-white font-semibold' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consultation Details */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider" htmlFor="booking-reason">Symptoms or Consultation Reason</label>
                <textarea
                  id="booking-reason"
                  rows={2}
                  value={consultReason}
                  onChange={(e) => setConsultReason(e.target.value)}
                  placeholder="What is the primary reason for consulting? e.g. seasonal allergy review, chronic migraine monitoring..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 resize-none bg-slate-50"
                  required
                ></textarea>
              </div>

              {/* Payment Methods Section */}
              <div className="space-y-3 text-left border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-teal-650" />
                    Gateway Secure Payment Methods (INR / ₹)
                  </label>
                  <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono border border-teal-100">
                    Total: ₹{selectedDoctor.consultationFee || 500}
                  </span>
                </div>

                {/* Tab select buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('upi');
                      setTxnId('');
                    }}
                    className={`py-2 px-1 text-center border rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-teal-50 border-teal-500 text-teal-700 font-extrabold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[10px] tracking-tight">Instant UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('qr_code');
                      setTxnId('');
                    }}
                    className={`py-2 px-1 text-center border rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'qr_code'
                        ? 'bg-teal-50 border-teal-500 text-teal-700 font-extrabold shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[10px] tracking-tight">Scan & Pay QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('pay_at_clinic');
                      setTxnId('');
                    }}
                    className={`py-2 px-1 text-center border rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'pay_at_clinic'
                        ? 'bg-slate-100 border-slate-300 text-slate-700 font-extrabold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] tracking-tight">Counter Pay</span>
                  </button>
                </div>

                {/* Sub Options panels based on tab selected */}
                <div className="bg-slate-50/80 border border-slate-200/60 p-3 rounded-xl min-h-[140px] flex flex-col justify-center">
                  
                  {/* UPI Form option */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Enter UPI Address / Phone Number</span>
                          {upiVpa && (
                            <button
                              type="button"
                              onClick={() => {
                                setUpiVpa('');
                                setUpiVerified(false);
                                setTxnId('');
                              }}
                              className="text-[10px] text-rose-500 hover:text-rose-700 font-extrabold focus:outline-hidden cursor-pointer flex items-center gap-0.5"
                            >
                              <X className="w-3 h-3" /> Clear
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. mobile@okaxis or 9876543210@ybl"
                            value={upiVpa}
                            onChange={(e) => {
                              setUpiVpa(e.target.value);
                              setUpiVerified(false);
                            }}
                            className="flex-1 bg-white border border-slate-200 px-2.5 py-1.5 text-xs rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-700 placeholder:text-slate-400"
                            disabled={upiVerified || isLoadingPayment}
                          />
                          {!upiVerified ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!upiVpa.trim()) {
                                  alert("Please enter a valid UPI ID (VPA)");
                                  return;
                                }
                                setIsLoadingPayment(true);
                                setTimeout(() => {
                                  setIsLoadingPayment(false);
                                  setUpiVerified(true);
                                  setTxnId(`TXN-UPI${Math.floor(1000000000 + Math.random() * 8999999999)}`);
                                }, 150);
                              }}
                              disabled={isLoadingPayment}
                              className="bg-teal-600 hover:bg-teal-750 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center min-w-[70px] disabled:opacity-50"
                            >
                              {isLoadingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pay Now'}
                            </button>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 border border-emerald-200 text-[10px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Approved
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {upiVerified ? (
                        <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-[10.5px] text-emerald-800 space-y-0.5">
                          <p className="font-extrabold flex items-center gap-1">
                            <Check className="w-4 h-4 text-emerald-600" />
                            Payment Authorized Successfully!
                          </p>
                          <p className="font-mono text-[9px] text-emerald-600">Ref: {txnId}</p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                          *Authorize payment using any UPI app (Google Pay, PhonePe, Paytm, BHIM). Slot confirms instantly post-approval.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Scan & Pay QR Option */}
                  {paymentMethod === 'qr_code' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
                      
                      {/* Interactive Visual QR code mock SVG */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center">
                        <div className="w-24 h-24 bg-slate-100 rounded border border-slate-200 relative flex items-center justify-center p-1 overflow-hidden">
                          {/* Inner scanner visual background */}
                          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                            {/* QR Outer corners */}
                            <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                            <rect x="10" y="10" width="15" height="15" fill="currentColor" />
                            
                            <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                            <rect x="75" y="10" width="15" height="15" fill="currentColor" />
                            
                            <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                            <rect x="10" y="75" width="15" height="15" fill="currentColor" />
                            
                            {/* QR Data Noise Matrix Lines */}
                            <path d="M 35 10 L 65 10 M 35 20 L 50 20 M 40 30 L 60 30 M 70 35 L 70 65 M 80 40 L 95 40 M 10 35 L 30 35 M 15 45 L 60 45 L 85 45 M 25 55 L 75 55 M 35 65 L 55 65 L 90 65 M 35 75 L 60 75 M 45 85 L 85 85" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
                            
                            {/* Center NPCI / BHIM Logo placeholder */}
                            <rect x="38" y="38" width="24" height="24" rx="4" fill="white" stroke="#319795" strokeWidth="1.5" />
                            <path d="M 44 50 L 56 50 M 50 44 L 50 56" stroke="#319795" strokeWidth="2.5" />
                          </svg>
                          
                          {/* Scan status banner overlay */}
                          {qrVerified && (
                            <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-3xs flex flex-col items-center justify-center text-white p-1 text-[10px] text-center">
                              <ShieldCheck className="w-7 h-7 text-white animate-bounce" />
                              <span className="font-extrabold leading-tight">PAID EN-ROUTE</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[7.5px] font-mono tracking-widest uppercase font-extrabold text-slate-400 mt-1">BHIM UPI QR</span>
                      </div>

                      <div className="flex-1 text-left space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Clinical Merchant ID</span>
                          <span className="font-bold text-slate-755 text-xs truncate block max-w-[190px]">MEDTRIAGE.CLINIC@okindianbank</span>
                          <span className="block text-[9px] text-slate-500">Scan via BHIM, PayTM, PhonePe or GPay</span>
                        </div>

                        {!qrVerified ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsLoadingPayment(true);
                                setTimeout(() => {
                                  setIsLoadingPayment(false);
                                  setQrVerified(true);
                                  setTxnId(`TXN-QR${Math.floor(1000000000 + Math.random() * 8999999999)}`);
                                }, 200);
                              }}
                              disabled={isLoadingPayment || qrCountdown === 0}
                              className="bg-teal-600 hover:bg-teal-750 text-white font-bold text-[10.5px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            >
                              {isLoadingPayment ? 'Verifying Scan...' : 'Simulate QR Scan Pay'}
                            </button>
                            
                            <span className="text-[10px] text-slate-500 font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200">
                              Expiry: {Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-[10.5px] text-emerald-800 space-y-0.5">
                            <p className="font-extrabold flex items-center gap-1">
                              <Check className="w-4 h-4 text-emerald-600" />
                              Scan Payment Verified!
                            </p>
                            <p className="font-mono text-[9px] text-emerald-600">Ref ID: {txnId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pay at Lobby Counter Option */}
                  {paymentMethod === 'pay_at_clinic' && (
                    <div className="text-left space-y-1.5 p-1 text-slate-600">
                      <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-slate-500" />
                        Pay at Clinical Lobby Desk
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        Secure your consulting slot online right now for free. Upon arrival, check-in at the lobby reception kiosk and pay your ₹{selectedDoctor.consultationFee || 500} consultation fee via Cash, Debit Card, or any UPI App.
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Form trigger buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-150">
                <button
                  id="booking-confirm-cancel"
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 text-xs border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="booking-confirm-submit"
                  type="submit"
                  disabled={isLoading || !selectedDate || !selectedTimeSlot || (paymentMethod === 'upi' && !upiVerified) || (paymentMethod === 'qr_code' && !qrVerified)}
                  className="flex-1 py-2 text-xs bg-teal-600 hover:bg-teal-750 text-white font-bold rounded-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  {isLoading ? 'Booking...' : paymentMethod === 'pay_at_clinic' ? 'Confirm & Book (Pay Later)' : 'Confirm & Book (Paid ₹' + (selectedDoctor.consultationFee || 500) + ')'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
