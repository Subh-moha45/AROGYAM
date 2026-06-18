/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, Heart, ShieldAlert, Check, X, CheckSquare, 
  Search, ArrowDown, Activity, AlertTriangle, Play, RefreshCw, BarChart3, TrendingUp 
} from 'lucide-react';
import { Appointment, SymptomLog, UserProfile } from '../types';

interface AdminDashboardProps {
  currentUser: UserProfile;
}

interface AdminStats {
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  symptomChecksCount: number;
  symptomUrgency: {
    Routine: number;
    Urgent: number;
    Emergency: number;
  };
  specialtyPopularity: Record<string, number>;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  
  const [searchParam, setSearchParam] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  useEffect(() => {
    fetchAdminData();
    // Fetch all logs
    fetchSymptomLogs();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch ALL appointments
      const appRes = await fetch('/api/appointments');
      if (appRes.ok) {
        const appData = await appRes.json();
        setAppointments(appData);
      }
    } catch (err) {
      console.error("Error loaded administrative telemetry:", err);
    }
  };

  const fetchSymptomLogs = async () => {
    try {
      const res = await fetch('/api/symptom-logs');
      if (res.ok) {
        const logs = await res.json();
        setSymptomLogs(logs);
      }
    } catch (e) {
      console.error("Error fetching clinical logs list:", e);
    }
  };

  const updateStatus = async (aptId: string, nextStatus: Appointment['status']) => {
    setIsUpdating(aptId);
    try {
      const res = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: aptId, status: nextStatus })
      });

      if (res.ok) {
        await fetchAdminData();
      }
    } catch (err) {
      console.error("Error updating consult state:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergency':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'Urgent':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-[10px]';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold text-[10px]';
      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold text-[10px]';
      default:
        return 'bg-amber-50 text-amber-750 border-amber-200 font-semibold text-[10px] animate-pulse';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.userName.toLowerCase().includes(searchParam.toLowerCase()) || 
                          apt.doctorName.toLowerCase().includes(searchParam.toLowerCase()) || 
                          apt.specialty.toLowerCase().includes(searchParam.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="admin-dashboard-root" className="space-y-6">
      
      {/* Administrator greetings card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-750">
        <div className="text-left space-y-1">
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">ADMINISTRATIVE PORTAL CONTROL</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 mt-1">Hello, {currentUser.name}</h2>
          <p className="text-xs text-slate-300 leading-normal font-normal">
            Welcome back to the clinical director deck. Monitor active medical bookings, manage triage, and coordinate hospital response metrics.
          </p>
        </div>

        <button 
          id="admin-refresh-all-btn"
          onClick={() => { fetchAdminData(); fetchSymptomLogs(); }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Live Datasets
        </button>
      </div>

      {stats ? (
        <>
          {/* Stats quick card grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Stat 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
                <strong className="text-2xl font-black text-slate-800 tracking-tight block mt-0.5">{stats.bookings.total}</strong>
                <span className="text-[9px] text-teal-600 font-semibold">{stats.bookings.confirmed} Active Confirmed</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Symptom Checks</span>
                <strong className="text-2xl font-black text-slate-800 tracking-tight block mt-0.5">{stats.symptomChecksCount}</strong>
                <span className="text-[9px] text-rose-600 font-semibold">{stats.symptomUrgency.Emergency + stats.symptomUrgency.Urgent} High Priority</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Triage Emergency</span>
                <strong className="text-2xl font-black text-slate-800 tracking-tight block mt-0.5">{stats.symptomUrgency.Emergency}</strong>
                <span className="text-[9px] text-slate-450 font-semibold">Immediate attention needed</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
                <strong className="text-2xl font-black text-slate-800 tracking-tight block mt-0.5">{stats.bookings.pending}</strong>
                <span className="text-[9px] text-cyan-600 font-semibold">Awaiting consultation click</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Box: Active Booking rows and actions */}
            <div className="lg:col-span-8 bg-white border border-slate-150 rounded-2xl shadow-2xs p-5 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="text-left">
                  <h4 className="font-extrabold text-slate-800 text-sm">Consultation Backlog Registry</h4>
                  <p className="text-[11px] text-slate-400 font-normal">Review and coordinate appointment requests, confirm timeslots or conclude patient visits.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    id="admin-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-205 rounded-lg bg-slate-50 text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">All (All statuses)</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <input
                    id="admin-search-input"
                    type="text"
                    placeholder="Search doctor or patient..."
                    value={searchParam}
                    onChange={(e) => setSearchParam(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-slate-205 rounded-lg bg-slate-50 text-slate-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Table / Cards list of appointments */}
              <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No matching appointments in backlog registry.
                  </div>
                ) : (
                  filteredAppointments.map(apt => (
                    <div
                      key={apt.id}
                      className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`px-2 py-0.5 border rounded-sm ${getStatusBadge(apt.status)}`}>
                            {apt.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">ID: {apt.id}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PATIENT DETAIL</span>
                            <span className="text-xs font-bold text-slate-800 block">{apt.userName}</span>
                            <span className="text-[10px] text-slate-500 font-medium block">{apt.userEmail}</span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">CLINICIAN PROFILE</span>
                            <span className="text-xs font-bold text-slate-800 block">{apt.doctorName}</span>
                            <span className="text-[10px] text-teal-600 font-semibold block">{apt.specialty}</span>
                          </div>
                        </div>

                        {/* Date and details row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/50 w-fit">
                            <span className="font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {apt.date}
                            </span>
                            <span>&bull;</span>
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {apt.timeSlot}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] bg-slate-100/50 px-2 py-1.5 rounded-lg border border-slate-200/40">
                            <span className="font-extrabold text-teal-700">₹{apt.paymentAmount || 500}</span>
                            <span className="text-slate-400 font-normal">via</span>
                            <span className="font-bold text-slate-600 uppercase text-[9px]">
                              {apt.paymentMethod === 'upi' ? 'UPI Flow' : apt.paymentMethod === 'qr_code' ? 'QR Code Scan' : 'Counter Cash'}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                              apt.paymentStatus === 'paid' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {apt.paymentStatus || 'pending'}
                            </span>
                          </div>
                        </div>

                        {apt.notes && (
                          <p className="text-[10px] text-slate-450 leading-relaxed max-w-lg italic">
                            Patient consultation reason: "{apt.notes}"
                          </p>
                        )}
                      </div>

                      {/* State modifications panel action loops */}
                      <div className="flex flex-row md:flex-col gap-2 shrink-0 md:justify-center justify-end">
                        {apt.status === 'pending' && (
                          <>
                            <button
                              id={`admin-confirm-${apt.id}`}
                              onClick={() => updateStatus(apt.id, 'confirmed')}
                              disabled={isUpdating === apt.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xs text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Confirm Slot
                            </button>
                            <button
                              id={`admin-cancel-pnd-${apt.id}`}
                              onClick={() => updateStatus(apt.id, 'cancelled')}
                              disabled={isUpdating === apt.id}
                              className="px-3 py-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                              Reject Consultation
                            </button>
                          </>
                        )}

                        {apt.status === 'confirmed' && (
                          <>
                            <button
                              id={`admin-complete-${apt.id}`}
                              onClick={() => updateStatus(apt.id, 'completed')}
                              disabled={isUpdating === apt.id}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-750 text-white hover:shadow-xs text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Complete Visit
                            </button>
                            <button
                              id={`admin-cancel-conf-${apt.id}`}
                              onClick={() => updateStatus(apt.id, 'cancelled')}
                              disabled={isUpdating === apt.id}
                              className="px-3 py-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel Visits
                            </button>
                          </>
                        )}

                        {apt.status === 'completed' && (
                          <div className="text-[10px] text-slate-400 font-bold border border-slate-100 bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Clinical Visit Concluded
                          </div>
                        )}

                        {apt.status === 'cancelled' && (
                          <div className="text-[10px] text-slate-405 font-bold border border-slate-100 bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            Appointment Cancelled
                          </div>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Right Box: Live symptom check summary logs tracking */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Specialities popularity chart (simple visual progress bar metrics) */}
              <div className="bg-white border border-slate-150 rounded-2xl shadow-2xs p-5 space-y-4">
                <div className="text-left flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    Specialty Outflow Statistics
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Bookings</span>
                </div>

                <div className="space-y-3">
                  {Object.entries(stats.specialtyPopularity).length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-[10px]">No booked specialty data computed yet.</p>
                  ) : (
                    Object.entries(stats.specialtyPopularity).map(([spec, count]) => {
                      const max = Math.max(...Object.values(stats.specialtyPopularity), 1);
                      const percent = (count / max) * 100;
                      return (
                        <div key={spec} className="space-y-1 text-left">
                          <div className="flex justify-between items-center text-[10px] text-slate-650 font-bold">
                            <span>{spec}</span>
                            <span className="text-slate-500">{count} booked</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Symptom check stream logs */}
              <div className="bg-white border border-slate-150 rounded-2xl shadow-2xs p-5 space-y-4">
                <div className="text-left flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-600" />
                    Symptom Checked Registry
                  </h4>
                  <span className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 rounded-full">
                    {symptomLogs.length} logged
                  </span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {symptomLogs.length === 0 ? (
                    <p className="text-center py-8 text-[10px] text-slate-400 leading-normal">
                      No automated symptom triage sequences logged so far.
                    </p>
                  ) : (
                    symptomLogs.slice(0, 10).map((log, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/50 border border-slate-200/50 rounded-lg text-left space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-450">
                          <span>Patient: {log.userName}</span>
                          <span className={`px-2 py-0.5 rounded-full border ${getUrgencyColor(log.analysis.urgency)}`}>
                            {log.analysis.urgency}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-semibold leading-tight line-clamp-1">
                          "{log.symptoms}"
                        </p>

                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/35 text-[9px] text-slate-500 font-medium">
                          <span>Suggested SPECIALTY: <strong>{log.analysis.recommendedSpecialty}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </>
      ) : (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-150 shadow-2xs flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin"></div>
          <p className="text-xs text-slate-500">Retrieving operational telemetry data...</p>
        </div>
      )}

    </div>
  );
}
