/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Activity, Calendar, MapPin, BookOpen, ShieldAlert, 
  User, LogIn, LogOut, CheckCircle, Smartphone, AlertCircle, Compass,
  Sun, Moon, Phone, X, Navigation, Bell, MessageSquare, Trash2, Info, Globe,
  HeartPulse, Clipboard, Search, ChevronRight, ChevronLeft, Play, Pause, ArrowLeft,
  Volume2, VolumeX, Home, Stethoscope, Mail, Syringe
} from 'lucide-react';
import { UserProfile, Appointment, Doctor, BlogPost } from './types';
import { useLanguage } from './context/LanguageContext';

// Importing Custom Built Components
import AuthModal from './components/AuthModal';
import BmiCalculator from './components/BmiCalculator';
import SymptomChecker from './components/SymptomChecker';
import FindCare from './components/FindCare';
import AppointmentBooking from './components/AppointmentBooking';
import HealthBlog from './components/HealthBlog';
import AdminDashboard from './components/AdminDashboard';
import AIAssistant from './components/AIAssistant';
import GlucosePredictor from './components/GlucosePredictor';
import HealthTracker from './components/HealthTracker';
import VaccinationScheduler from './components/VaccinationScheduler';
// @ts-ignore
import arogyamLogo from './assets/images/arogyam_hospital_logo_1781523240933.jpg';

type TabType = 'home' | 'symptoms' | 'bmi' | 'appointments' | 'care' | 'blog' | 'admin' | 'glucose' | 'tracker' | 'vaccines';

interface AppToast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'message' | 'appointment';
}



export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Sliding hero carousel state & dynamic cyclic auto-play effect
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 1. Set scrolled state for translucent backdrop style
      if (currentScrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // 2. Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || activeTab !== 'home') return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 7);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeTab]);



  // Global search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState(false);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [allArticles, setAllArticles] = useState<BlogPost[]>([]);

  useEffect(() => {
    const loadSearchMetadata = async () => {
      try {
        const docRes = await fetch('/api/doctors');
        if (docRes.ok) {
          const docData = await docRes.json();
          setAllDoctors(docData);
        }
        const artRes = await fetch('/api/blog');
        if (artRes.ok) {
          const artData = await artRes.json();
          setAllArticles(artData);
        }
      } catch (err) {
        console.error("Error warming up search indexes:", err);
      }
    };
    loadSearchMetadata();
  }, []);

  // Toast notifications state
  const [toasts, setToasts] = useState<AppToast[]>([]);
  
  // Notification center state
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Dr. Sarah Jenkins',
      message: 'Greetings! Thanks for using our triage portal. Looking forward to your health updates.',
      timestamp: '03:45 AM',
      read: false,
      type: 'message'
    },
    {
      id: 'notif-2',
      title: 'VeraMedica System',
      message: 'Welcome to Arogyam Portal Bhubaneswar! You can schedule diagnostic, clinical consults now.',
      timestamp: '03:30 AM',
      read: true,
      type: 'appointment'
    }
  ]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Reference to track previous appointments list to detect status updates
  const prevAppointmentsRef = useRef<Record<string, string>>({});

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('veramedica-theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  // Pre-configured portal tools for easy lookup
  const portalTools = [
    { id: 'symptoms', name: 'Symptom Checker & Triage', tab: 'symptoms', desc: 'Check active health symptoms, triage conditions to specialists, get immediate advice.' },
    { id: 'bmi', name: 'BMI Risk & Weight Calculator', tab: 'bmi', desc: 'Calculate clinical Body Mass Index and identify associated risk indexes.' },
    { id: 'glucose', name: 'Metabolic Glucose Spike Predictor & Nutrition Calculator', tab: 'glucose', desc: 'Predict clinical glycemic spikes, view simulated response curves, adjust carbs and protein metrics.' },
    { id: 'appointments', name: 'Specialist Clinical Calendars', tab: 'appointments', desc: 'Secure appointments with verified board-certified practitioners.' },
    { id: 'care', name: 'Care Finder Map & Regional Facilities', tab: 'care', desc: 'Locate local hospitals, ER zones, diagnostic spaces, and pharmacies.' },
    { id: 'blog', name: 'Clinical Health Research Blog', tab: 'blog', desc: 'Verified peer-reviewed healthcare publications and guides.' }
  ];

  const matchedDoctors = globalSearchQuery.trim() === '' ? [] : allDoctors.filter(doc => 
    doc.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    doc.hospital.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    doc.bio.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const matchedArticles = globalSearchQuery.trim() === '' ? [] : allArticles.filter(art => 
    art.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    art.category.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    art.excerpt.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    art.author.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const matchedTools = globalSearchQuery.trim() === '' ? [] : portalTools.filter(tool => 
    tool.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    tool.desc.toLowerCase().includes(globalSearchQuery.toLowerCase())
  );

  const hasSearchResults = matchedDoctors.length > 0 || matchedArticles.length > 0 || matchedTools.length > 0;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('veramedica-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('veramedica-theme', 'light');
    }
  }, [theme]);

  // Toast listener effect
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: 'info' | 'success' | 'warning' | 'error';
        title: string;
        message: string;
      }>;
      const { type, title, message } = customEvent.detail;
      const newToast: AppToast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        type,
        title,
        message
      };
      
      // Append to visible active toasts list
      setToasts(prev => [...prev, newToast]);
      
      // Append to Notifications bell dropdown registry
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title,
          message,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          read: false,
          type: title.toLowerCase().includes('message') ? 'message' : 'appointment'
        },
        ...prev
      ]);

      // Remove toast after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener('app-toast', handleToastEvent);
    return () => window.removeEventListener('app-toast', handleToastEvent);
  }, []);

  // Sync background polling to check if appointment status changes from DB
  useEffect(() => {
    if (!currentUser) {
      prevAppointmentsRef.current = {};
      return;
    }

    const checkAppointments = async () => {
      try {
        const res = await fetch(`/api/appointments?email=${encodeURIComponent(currentUser.email)}`);
        if (res.ok) {
          const data: Appointment[] = await res.json();
          const prev = prevAppointmentsRef.current;
          
          data.forEach(apt => {
            const lastStatus = prev[apt.id];
            if (lastStatus && lastStatus !== apt.status) {
              if (apt.status === 'confirmed') {
                window.dispatchEvent(new CustomEvent('app-toast', {
                  detail: {
                    type: 'success',
                    title: 'Appointment Confirmed',
                    message: `Dr. ${apt.doctorName} confirmed your appointment for ${apt.date} at ${apt.timeSlot}. Venue: Sijua, Bhubaneswar.`
                  }
                }));
              } else if (apt.status === 'cancelled') {
                window.dispatchEvent(new CustomEvent('app-toast', {
                  detail: {
                    type: 'error',
                    title: 'Appointment Cancelled',
                    message: `Your visit with Dr. ${apt.doctorName} for ${apt.date} at ${apt.timeSlot} has been cancelled.`
                  }
                }));
              }
            }
            prev[apt.id] = apt.status;
          });

          // Seed on first loaded state
          if (Object.keys(prev).length === 0) {
            data.forEach(apt => {
              prev[apt.id] = apt.status;
            });
          }
        }
      } catch (err) {
        console.error("Polled appointment registry query error:", err);
      }
    };

    checkAppointments();
    const intervalId = setInterval(checkAppointments, 5000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('symptoms');
    }
  };

  const currentTabRender = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12">
            
            {/* Explore Our Health Tools Bento Grid Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3 pb-4">
              <h3 className="text-3xl font-extrabold text-[#071330] dark:text-white tracking-tight">
                Explore Our Health Tools
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                Quickly navigate to smart diagnostics, risk assessments, clinical calendars & localized care finders
              </p>
            </div>

            {/* Premium Multi-Card Grid covering all pages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Card 1: AI Symptom Checker */}
              <div 
                onClick={() => setActiveTab('symptoms')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {t('symptomChecker')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Briefly input symptoms for precise peer-tested diagnostics insights using artificial intelligence.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Start Checker</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Card 2: BMI Risk Assessment */}
              <div 
                onClick={() => setActiveTab('bmi')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {t('bmiRisk')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Calculate your Body Mass Index and screen yourself for potential chronic cardiovascular risks in seconds.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Start Risk Calculator</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Card 3: Clinical Calendars */}
              <div 
                onClick={() => setActiveTab('appointments')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {t('clinicalCalendars')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Schedule secure virtual video appointments or clinic physical tours with verified regional specialists.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Book Appointment</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Card 4: Care Finder Map */}
              <div 
                onClick={() => setActiveTab('care')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {t('careFinderMap')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Locate certified community health centers, vaccine clinics and emergency trauma units in Odisha.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Find Care Finder</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Card 5: Health Research Blog */}
              <div 
                onClick={() => setActiveTab('blog')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {t('healthResearchBlog')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Search through our catalog of verified medical articles curated specifically for regional demographics.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-405 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read Articles</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Card 6: Glucose Predictor */}
              <div 
                onClick={() => setActiveTab('glucose')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {t('glucoseTab')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Analyze food ingredients to identify potential glucose curves, glycemic spikes, and bio-nutritional tips.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Predict Spikes</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Card 7: Health Tracker */}
              <div 
                onClick={() => setActiveTab('tracker')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between animate-fade-in"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-450 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <HeartPulse className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Health Tracker
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Track blood pressure, heart resting rate, glycemic values, sleep patterns and print outpatient health charts.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Open Tracker</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Card 8: Vaccination Scheduler */}
              <div 
                onClick={() => setActiveTab('vaccines')}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between animate-fade-in"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-450 flex items-center justify-center mb-5 group-hover:scale-105 transition-all shadow-xs">
                    <Syringe className="w-6 h-6 rotate-45 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Vaccination Planner
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal mb-6">
                    Configure DOB metadata to match pediatric, adult, or senior vaccines. Choose green available calendar slots & print tokens.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Open Scheduler</span>
                  <span>&rarr;</span>
                </span>
              </div>

            </div>

            {/* Elegant Preferences & Portal Access Row at bottom of Home Page */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-205/50 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left mt-8">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                  <span>Portal Preferences & Authentication</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  Toggle localized translation interfaces, visual theme layers, or securely authenticate for outpatient medical records.
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* 1. Language Picker Control */}
                <div className="relative">
                  <button
                    id="global-language-switcher"
                    onClick={() => {
                      setShowLangMenu(!showLangMenu);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-slate-705 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer select-none"
                    title="Select Portal Language"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-450" />
                    <span className="uppercase text-[11px] font-black">
                      {language === 'en' ? 'EN' : language === 'hi' ? 'हिं' : 'ଓଡ଼'}
                    </span>
                    <span className="text-[8px] text-slate-400">▼</span>
                  </button>

                  <AnimatePresence>
                    {showLangMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowLangMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-12 right-0 mt-2.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 text-left"
                        >
                          <div className="p-2 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              Language / भाषा / ଭାଷା
                            </span>
                          </div>
                          <div className="p-1 flex flex-col gap-0.5">
                            <button
                              onClick={() => {
                                setLanguage('en');
                                setShowLangMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between ${
                                language === 'en'
                                  ? 'bg-teal-50/50 dark:bg-teal-900/10 text-teal-605 dark:text-teal-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span>English</span>
                              {language === 'en' && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />}
                            </button>
                            <button
                              onClick={() => {
                                setLanguage('hi');
                                setShowLangMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between ${
                                language === 'hi'
                                  ? 'bg-teal-50/50 dark:bg-teal-900/10 text-teal-605 dark:text-teal-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span>हिंदी</span>
                              {language === 'hi' && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />}
                            </button>
                            <button
                              onClick={() => {
                                setLanguage('or');
                                setShowLangMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between ${
                                language === 'or'
                                  ? 'bg-teal-50/50 dark:bg-teal-900/10 text-teal-605 dark:text-teal-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span>ଓଡ଼ିଆ</span>
                              {language === 'or' && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />}
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Theme Toggle Control */}
                <button
                  id="global-theme-toggle"
                  onClick={() => {
                    setTheme(prev => prev === 'light' ? 'dark' : 'light');
                  }}
                  className="p-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer select-none"
                  title="Theme Toggle"
                >
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4 text-slate-550 shrink-0" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </button>

                {/* 3. Secure Portal Access Control Profile */}
                {currentUser ? (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 pl-3.5 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                    <div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase inline-block border ${
                        currentUser.role === 'admin' 
                          ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60' 
                          : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/60'
                      }`}>
                        {currentUser.role}
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight mt-0.5">{currentUser.name}</p>
                    </div>
                    
                    <button
                      id="home-logout-btn"
                      onClick={handleLogout}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    id="home-login-btn"
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl hover:shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Portal Access</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        );
      case 'symptoms':
        return currentUser ? (
          <SymptomChecker currentUser={currentUser} />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-8 md:p-12 shadow-sm max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center text-left">
            {/* Left Content half */}
            <div className="md:col-span-7 space-y-6">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center border border-teal-100 dark:border-teal-900/60 shadow-inner">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-2xl tracking-tight">
                  {t('credentialsRequired')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-md">
                  {t('credentialsText')}
                </p>
              </div>

              <button
                id="triage-auth-btn"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-650 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('signInPortal')}</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Right Illustration half - Styled Premium Medicine Clipboard SVG */}
            <div className="md:col-span-5 flex justify-center relative select-none">
              <div className="absolute inset-0 bg-teal-200/5 dark:bg-teal-900/5 rounded-full blur-2xl transform scale-105" />
              <div className="w-60 h-60 md:w-64 md:h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Floating abstract aura shape */}
                  <path d="M60 140c10-35 80-20 100-30s30 50 15 80-80 15-100-20-25-5-15-30z" fill="#06b6d4" opacity="0.05" />
                  
                  {/* Clipboard Backboard */}
                  <rect x="70" y="50" width="160" height="210" rx="16" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2.5" />
                  
                  {/* Top Clip of Clipboard */}
                  <rect x="120" y="32" width="60" height="24" rx="6" fill="#0d9488" />
                  <circle cx="150" cy="44" r="5" fill="#ffffff" />
                  
                  {/* Profile Avatar Graphics on paper */}
                  <rect x="90" y="80" width="120" height="150" rx="10" fill="#ffffff" filter="url(#paper_shadow)" />
                  <circle cx="150" cy="115" r="16" fill="#2dd4bf" opacity="0.2" />
                  <path d="M136 142c0-8 6-14 14-14s14 6 14 14" stroke="#0f9488" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="150" cy="112" r="6" fill="#0d9488" />
                  
                  {/* Text lines simulating prescription/clinical fields */}
                  <rect x="110" y="160" width="80" height="5" rx="2.5" fill="#cbd5e1" />
                  <rect x="110" y="174" width="70" height="5" rx="2.5" fill="#e2e8f0" />
                  <rect x="110" y="188" width="80" height="5" rx="2.5" fill="#e2e8f0" />
                  
                  {/* Bullet check rows on the side of Paper */}
                  <circle cx="100" cy="162" r="3.5" fill="#38bdf8" />
                  <circle cx="100" cy="176" r="3.5" fill="#38bdf8" />
                  <circle cx="100" cy="190" r="3.5" fill="#38bdf8" />
                  
                  {/* Big Accent Green Checkmark Shield Bubble */}
                  <circle cx="215" cy="225" r="28" fill="#14b8a6" filter="url(#shield_bubble_shadow)" />
                  <path d="M205 225l7 7 14-13" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                  
                  <defs>
                    <filter id="paper_shadow" x="80" y="72" width="140" height="170" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1e3a8a" floodOpacity="0.05" />
                    </filter>
                    <filter id="shield_bubble_shadow" x="180" y="190" width="70" height="70" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0d9488" floodOpacity="0.3" />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        );
      case 'bmi':
        return <BmiCalculator />;
      
      case 'glucose':
        return <GlucosePredictor />;
      
      case 'tracker':
        return <HealthTracker currentUser={currentUser} />;
      
      case 'vaccines':
        return <VaccinationScheduler currentUser={currentUser} />;
      
      case 'appointments':
        return currentUser ? (
          <AppointmentBooking currentUser={currentUser} />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-6 shadow-xs">
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">{t('unlockDoctor')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                {t('unlockDoctorText')}
              </p>
            </div>
            <button
              id="appointment-auth-btn"
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md transition-shadow cursor-pointer block mx-auto"
            >
              {t('accessCareDirs')}
            </button>
          </div>
        );
      
      case 'care':
        return <FindCare theme={theme} />;
      
      case 'blog':
        return <HealthBlog />;
      
      case 'admin':
        if (currentUser && currentUser.role === 'admin') {
          return <AdminDashboard currentUser={currentUser} />;
        }
        return (
          <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-6 shadow-xs">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-900/40 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{t('clearanceRequired')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('clearanceText')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                id="admin-elevated-login-btn"
                onClick={() => {
                  setCurrentUser({
                    id: 'usr-adm-1',
                    name: 'Dr. Olivia Sterling',
                    email: 'admin@healthcare.com',
                    role: 'admin',
                    age: 45,
                    gender: 'Female',
                    bloodGroup: 'A-'
                  });
                }}
                className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                {t('signInAdmin')} &rarr;
              </button>
              
              <button
                id="admin-cancel-lock-btn"
                onClick={() => setActiveTab('symptoms')}
                className="text-xs text-slate-500 dark:text-slate-400 font-semibold hover:underline"
              >
                {t('returnTriage')}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#eaf6f6] via-[#f5fafb] to-[#edf7f7] dark:from-[#05111d] dark:via-[#091b2c] dark:to-[#041221] flex flex-col font-sans tracking-tight text-slate-800 dark:text-slate-200 transition-colors duration-200 relative overflow-x-hidden">
      
      {/* Lavish Premium Background Ambient Layers (Matches Reference Image) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        {/* Soft, giant blurred ambient glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/25 dark:bg-teal-500/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-15%] w-[45%] h-[45%] rounded-full bg-emerald-100/20 dark:bg-emerald-500/3 blur-[100px]" />
        <div className="absolute top-[25%] right-[-15%] w-[60%] h-[60%] rounded-full bg-cyan-100/20 dark:bg-cyan-500/4 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-teal-100/30 dark:bg-teal-500/5 blur-[100px]" />

        {/* Elegant top-left contour waves matching the reference image */}
        <svg className="absolute top-0 left-0 w-[450px] h-[450px] opacity-[0.25] dark:opacity-[0.12] text-teal-600 dark:text-teal-400" viewBox="0 0 400 400" fill="none">
          <path d="M -50,150 C 50,150 150,50 150,-50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.15" />
          <path d="M -50,180 C 70,180 180,70 180,-50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
          <path d="M -50,210 C 90,210 210,90 210,-50" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
          <path d="M -50,240 C 110,240 240,110 240,-50" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
          <path d="M -50,270 C 130,270 270,130 270,-50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
          <path d="M -50,300 C 150,300 300,150 300,-50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          <path d="M -50,330 C 170,330 330,170 330,-50" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <path d="M -50,360 C 190,360 360,190 360,-50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <path d="M -50,390 C 210,390 390,210 390,-50" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.95" />
        </svg>

        {/* Elegant bottom-right contour waves matching the reference image */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-[0.35] dark:opacity-[0.15] text-teal-600 dark:text-teal-400">
          <svg className="w-full h-full" viewBox="0 0 500 500" fill="none">
            <path d="M 150,550 C 150,420 420,150 550,150" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.1" />
            <path d="M 110,550 C 110,390 390,110 550,110" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
            <path d="M 70,550 C 70,360 360,70 550,70" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
            <path d="M 30,550 C 30,330 330,30 550,30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
            <path d="M -10,550 C -10,300 300,-10 550,-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <path d="M -50,550 C -50,270 270,-50 550,-50" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
            <path d="M -90,550 C -90,240 240,-90 550,-90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>

        {/* Subtle decorative dot grid for extra crisp depth */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', 
               backgroundSize: '32px 32px' 
             }} 
        />
      </div>

      {/* Top medical branding bar - Floating Glassmorphism Navbar */}
      <header className={`sticky top-4 z-40 mx-4 lg:mx-auto max-w-7xl w-[calc(100%-2rem)] lg:w-full rounded-2xl text-slate-800 dark:text-slate-105 transition-all duration-500 will-change-transform ${
        navbarVisible 
          ? scrolled 
            ? 'bg-white/45 dark:bg-[#020d22]/45 backdrop-blur-2xl border border-white/30 dark:border-white/5 shadow-2xl shadow-teal-500/10 dark:shadow-[#000000]/50 translate-y-0.5 opacity-100' 
            : 'bg-white/70 dark:bg-[#020d22]/70 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-teal-500/5 dark:shadow-slate-950/40 translate-y-0 opacity-100'
          : '-translate-y-36 opacity-0 pointer-events-none'
      }`}>
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo container & Main branding links */}
          <div className="flex items-center gap-8">
            <div id="arogyam-brand-logo-container" className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shadow-md border border-teal-400/20">
                <img 
                  src={arogyamLogo} 
                  alt="Arogyam Hospital Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-left">
                <h1 className="font-extrabold text-base text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-1.5 leading-none">
                  {t('arogyam')}
                </h1>
                <span className="text-[9px] text-teal-650 dark:text-teal-400 font-bold block uppercase tracking-wider mt-0.5">{t('healthcarePortal')}</span>
              </div>
            </div>

            {/* Middle navigation links directly matching mock image */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
              <button 
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-1 px-1 py-1.5 transition-colors cursor-pointer border-b-2 font-bold ${
                  activeTab === 'home'
                    ? 'text-teal-600 dark:text-teal-400 border-teal-500'
                    : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-950 dark:hover:text-white hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span>Home</span>
              </button>
              
              <div className="relative group">
                <button 
                  onClick={() => setActiveTab('symptoms')}
                  className={`flex items-center gap-1 py-1.5 transition-colors cursor-pointer border-b-2 font-bold ${
                    activeTab === 'symptoms'
                      ? 'text-teal-600 dark:text-teal-400 border-teal-500'
                      : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-950 dark:hover:text-white hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <span>Services</span>
                  <span className="text-[8px] text-slate-400">▼</span>
                </button>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => setActiveTab('bmi')}
                  className={`flex items-center gap-1 py-1.5 transition-colors cursor-pointer border-b-2 font-bold ${
                    activeTab === 'bmi'
                      ? 'text-teal-600 dark:text-teal-400 border-teal-500'
                      : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-950 dark:hover:text-white hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" /></svg>
                  <span>Health Tools</span>
                  <span className="text-[8px] text-slate-400">▼</span>
                </button>
              </div>

              <div className="relative group">
                <button 
                  onClick={() => setActiveTab('blog')}
                  className={`flex items-center gap-1 py-1.5 transition-colors cursor-pointer border-b-2 font-bold ${
                    activeTab === 'blog'
                      ? 'text-teal-600 dark:text-teal-400 border-teal-500'
                      : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-950 dark:hover:text-white hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span>Resources</span>
                  <span className="text-[8px] text-slate-400">▼</span>
                </button>
              </div>

              <button 
                onClick={() => setActiveTab('care')}
                className={`flex items-center gap-1 py-1.5 transition-colors cursor-pointer border-b-2 font-bold ${
                  activeTab === 'care'
                    ? 'text-teal-600 dark:text-teal-400 border-teal-500'
                    : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-950 dark:hover:text-white hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <span>About Us</span>
              </button>
            </nav>
          </div>
 
          {/* User badge login container, bell notifications */}
          <div className="flex items-center gap-3 text-slate-800 dark:text-slate-150">

            {/* Global Search Component */}
            <div className="relative search-header-container hidden md:block">
              <div className="relative flex items-center">
                <input
                  id="global-portal-search-bar"
                  type="text"
                  placeholder="Search services, doctors, articles..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowGlobalSearchResults(true);
                  }}
                  onFocus={() => setShowGlobalSearchResults(true)}
                  className="w-48 md:w-60 text-xs pl-8.5 pr-8 py-2 bg-slate-100 hover:bg-slate-200/50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:bg-white dark:focus:bg-slate-900 focus:w-60 md:focus:w-72 text-slate-800 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-500 shrink-0"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-505 absolute left-3 pointer-events-none" />
                {globalSearchQuery && (
                  <button
                    onClick={() => {
                      setGlobalSearchQuery('');
                      setShowGlobalSearchResults(false);
                    }}
                    className="absolute right-3 p-0.5 hover:bg-slate-205 dark:hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown Panel */}
              <AnimatePresence>
                {showGlobalSearchResults && globalSearchQuery && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowGlobalSearchResults(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                      className="absolute right-0 mt-3 w-[26rem] md:w-[32rem] max-h-[25rem] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-y-auto z-50 text-left divide-y divide-slate-800"
                    >
                      {/* Section heading */}
                      <div className="p-3 bg-slate-900/85 flex justify-between items-center header-search-title">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Portal Autocomplete Insights
                        </span>
                        <span className="text-[9px] text-teal-400 font-bold bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900/60 uppercase">
                          {matchedDoctors.length + matchedArticles.length + matchedTools.length} found
                        </span>
                      </div>

                      {/* Search Results list */}
                      {!hasSearchResults ? (
                        <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                          <AlertCircle className="w-8 h-8 text-slate-700 mx-auto" />
                          <p className="font-bold">No clinic records matching parameter.</p>
                          <p className="text-[10px] text-slate-500 font-normal">Check spellings or try "pressure", "diet", "Jenkins" etc.</p>
                        </div>
                      ) : (
                        <div className="p-1 space-y-4 max-h-[20rem] overflow-y-auto scrollbar-thin">
                          
                          {/* 1. MATCHED TOOLS */}
                          {matchedTools.length > 0 && (
                            <div className="p-2 space-y-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block px-2">Portal Utilities & Actions</span>
                              <div className="flex flex-col gap-1">
                                {matchedTools.map(tool => (
                                  <button
                                    key={tool.id}
                                    onClick={() => {
                                      setActiveTab(tool.tab as TabType);
                                      setGlobalSearchQuery('');
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="w-full text-left p-2 hover:bg-slate-900 rounded-lg transition-colors flex gap-3 items-center group cursor-pointer"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-teal-950/40 text-teal-400 flex items-center justify-center border border-teal-900/40 group-hover:scale-105 transition-transform shrink-0">
                                      {tool.id === 'symptoms' && <Activity className="w-4 h-4" />}
                                      {tool.id === 'bmi' && <Clipboard className="w-4 h-4" />}
                                      {tool.id === 'appointments' && <Calendar className="w-4 h-4" />}
                                      {tool.id === 'care' && <MapPin className="w-4 h-4" />}
                                      {tool.id === 'blog' && <BookOpen className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold text-slate-200 block group-hover:text-teal-400 transition-colors">{tool.name}</span>
                                      <span className="text-[10px] text-slate-400 truncate block font-normal leading-tight">{tool.desc}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 2. MATCHED DOCTORS */}
                          {matchedDoctors.length > 0 && (
                            <div className="p-2 space-y-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block px-2">Clinical Personnel & Specialists</span>
                              <div className="flex flex-col gap-1">
                                {matchedDoctors.map(doc => (
                                  <button
                                    key={doc.id}
                                    onClick={() => {
                                      if (!currentUser) {
                                        // Trigger AuthModal first
                                        setShowAuthModal(true);
                                      } else {
                                        setActiveTab('appointments');
                                        setTimeout(() => {
                                          window.dispatchEvent(new CustomEvent('select-appointment-doctor', { detail: doc }));
                                        }, 100);
                                      }
                                      setGlobalSearchQuery('');
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="w-full text-left p-2 hover:bg-slate-900 rounded-lg transition-colors flex gap-3 items-center group cursor-pointer"
                                  >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-755 shrink-0">
                                      <img src={doc.image} alt={doc.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-200 block group-hover:text-teal-400 transition-colors truncate">{doc.name}</span>
                                        <span className="text-[8px] bg-slate-900 border border-slate-850 text-slate-400 px-1 py-0.2 rounded font-medium">{doc.specialty}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 truncate block font-normal leading-tight">{doc.hospital} &bull; Check Availability</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 3. MATCHED ARTICLES */}
                          {matchedArticles.length > 0 && (
                            <div className="p-2 space-y-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block px-2">Verified Medical Publications</span>
                              <div className="flex flex-col gap-1">
                                {matchedArticles.map(art => (
                                  <button
                                    key={art.id}
                                    onClick={() => {
                                      setActiveTab('blog');
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent('select-blog-post', { detail: art }));
                                      }, 100);
                                      setGlobalSearchQuery('');
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="w-full text-left p-2 hover:bg-slate-900 rounded-lg transition-colors flex gap-3 items-center group cursor-pointer"
                                  >
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-755 shrink-0">
                                      <img src={art.image} alt={art.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold text-slate-200 block group-hover:text-teal-400 transition-colors truncate">{art.title}</span>
                                      <span className="text-[10px] text-slate-400 truncate block font-normal leading-tight">{art.excerpt}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell with Dropdown Menu */}
            <div className="relative">
              <button
                id="global-notifications-bell"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-1.5 rounded-lg border border-slate-705 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 text-left"
                  >
                    <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-teal-400" />
                        Patient Desk Alerts ({notifications.filter(n => !n.read).length} new)
                      </span>
                      <button 
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[10px] text-teal-400 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 grayscale opacity-70">
                          <MessageSquare className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                          No recent messages or alerts.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id}
                            className={`p-3 hover:bg-slate-800/60 transition-colors flex gap-2.5 items-start ${!notif.read ? 'bg-teal-400/5' : ''}`}
                            onClick={() => {
                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            }}
                          >
                            <div className="mt-0.5 shrink-0">
                              {notif.type === 'message' ? (
                                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex justify-between items-center">
                                <p className="text-[11px] font-extrabold text-slate-100 truncate">
                                  {notif.title}
                                </p>
                                <span className="text-[9px] text-slate-500 font-medium">
                                  {notif.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-normal font-normal">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-2 bg-slate-950 border-t border-slate-800 text-center">
                      <button
                        onClick={() => {
                          setNotifications([]);
                        }}
                        className="text-[10px] text-slate-500 hover:text-red-400 font-bold flex items-center gap-1 justify-center mx-auto cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All History
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Extreme right theme switcher inside Glassmorphism Navbar */}
            <button
              id="header-theme-toggle"
              onClick={() => {
                setTheme(prev => prev === 'light' ? 'dark' : 'light');
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer select-none shrink-0"
              title="Theme Toggle"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

          </div>

        </div>
      </header>

      {/* High-Fidelity Design-Aligned Static Hero Section */}
      {activeTab === 'home' && (
        <section className="bg-gradient-to-b from-[#f0f9ff]/50 via-white to-slate-50/50 dark:from-[#030d22]/40 dark:via-slate-950 dark:to-slate-950 py-12 md:py-16 border-b border-slate-100 dark:border-slate-900 overflow-hidden relative">
          {/* Abstract decorative floating cross marks matching photo */}
          <div className="absolute top-1/4 right-[28%] w-4 h-4 text-teal-400 rotate-12 opacity-80 animate-pulse">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/></svg>
          </div>
          <div className="absolute top-12 right-[10%] w-5 h-5 text-teal-350 opacity-60">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/></svg>
          </div>
          <div className="absolute bottom-16 right-[38%] w-3 h-3 text-cyan-450/85">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full"><path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/></svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left Text Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50/80 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                <svg className="w-3 h-3 text-teal-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM5 10a1 1 0 11-2 0 1 1 0 012 0zM8 15a1 1 0 100-2H7a1 1 0 100 2h1zM12.95 14.85a1 1 0 101.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM17 14v1a1 1 0 11-2 0v-1a1 1 0 112 0z" />
                </svg>
                AI Powered Healthcare
              </div>
              
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#071330] dark:text-white leading-tight tracking-tight">
                Smart Healthcare, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500 dark:from-teal-400 dark:to-cyan-400">
                  Better Every Day
                </span>
              </h2>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl font-normal">
                AI-driven tools and clinical insights to help you assess, monitor and take charge of your health.
              </p>
              
              <div className="pt-2">
                {currentUser ? (
                  <button
                    onClick={() => setActiveTab('symptoms')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Go to Symptom Checker</span>
                    <span className="text-sm">&rarr;</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>Sign In to Patient Portal</span>
                    <span className="text-sm">&rarr;</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Right Vector Artwork Column (SVG Drawing matching mockup) */}
            <div className="lg:col-span-6 flex justify-center relative">
              <div className="absolute inset-0 bg-teal-200/5 dark:bg-teal-900/5 rounded-full blur-3xl transform scale-110" />
              
              <div className="relative w-64 h-64 md:w-80 md:h-80 select-none">
                <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <style>{`
                    @keyframes pulseLine {
                      0% { stroke-dashoffset: 240; }
                      100% { stroke-dashoffset: 0; }
                    }
                    @keyframes floatMain {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-10px); }
                    }
                    @keyframes rotateRadar {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes breathPlus {
                      0%, 100% { transform: translateY(0px) scale(0.9); opacity: 0.5; }
                      50% { transform: translateY(-6px) scale(1.1); opacity: 0.9; }
                    }
                    @keyframes floatLeftLeaf {
                      0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
                      50% { transform: translate(-3px, 2px) rotate(-3deg); }
                    }
                    @keyframes floatRightLeaf {
                      0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
                      50% { transform: translate(3px, -2px) rotate(3deg); }
                    }
                    .pulse-line-anim {
                      stroke-dasharray: 120;
                      stroke-dashoffset: 120;
                      animation: pulseLine 4s linear infinite;
                    }
                    .main-float-anim {
                      animation: floatMain 5s ease-in-out infinite;
                      transform-origin: 200px 200px;
                    }
                    .radar-rotate-anim {
                      animation: rotateRadar 25s linear infinite;
                      transform-origin: 200px 200px;
                    }
                    .plus-breath-anim-1 {
                      animation: breathPlus 4s ease-in-out infinite;
                      transform-origin: 346px 180px;
                    }
                    .plus-breath-anim-2 {
                      animation: breathPlus 4.5s ease-in-out infinite;
                      transform-origin: 66px 210px;
                    }
                    .left-leaf-anim {
                      animation: floatLeftLeaf 6s ease-in-out infinite;
                      transform-origin: 120px 280px;
                    }
                    .right-leaf-anim {
                      animation: floatRightLeaf 6s ease-in-out infinite;
                      transform-origin: 280px 290px;
                    }
                    .medical-cross-anim {
                      transition: filter 0.3s;
                    }
                    .medical-cross-anim:hover {
                      filter: drop-shadow(0 0 8px rgba(45, 212, 191, 0.6));
                    }
                  `}</style>

                  {/* Clean soft background shapes - Radar grid style */}
                  <circle cx="200" cy="200" r="140" fill="url(#hero_blob_gradient)" opacity="0.08" />
                  <circle cx="200" cy="200" r="155" stroke="url(#hero_blob_gradient)" strokeWidth="1" strokeDasharray="4, 10" opacity="0.15" className="radar-rotate-anim" />
                  <circle cx="200" cy="200" r="170" stroke="url(#hero_blob_gradient)" strokeWidth="0.5" strokeDasharray="40, 120" opacity="0.1" className="radar-rotate-anim" style={{ animationDirection: 'reverse' }} />
                  
                  {/* Floating cross marks with dynamic breathing */}
                  <g stroke="#2dd4bf" strokeWidth="2.5" opacity="0.7">
                    <path d="M340 180h12M346 174v12" className="plus-breath-anim-1" />
                    <path d="M60 210h12M66 204v12" className="plus-breath-anim-2" />
                  </g>
                  
                  {/* Leaves in minty teal colors with organic sway */}
                  <path d="M120 280c20-10 40 10 30 35-15 0-25-15-30-35z" fill="#0d9488" opacity="0.32" className="left-leaf-anim" />
                  <path d="M280 290c-15-15-40-5-40 20 20 0 35-10 40-20z" fill="#0d9488" opacity="0.25" className="right-leaf-anim" />
                  
                  {/* Entire Shield & Stethoscope group floated organically */}
                  <g className="main-float-anim">
                    {/* Elegant Medical Shield */}
                    <g filter="url(#shield_shadow)">
                      <path d="M200 80c-40 0-70 12-85 22v78c0 48 35 90 85 105 50-15 85-57 85-105v-78c-15-10-45-22-85-22z" fill="url(#shield_bg_grad)" stroke="#2dd4bf" strokeWidth="3" strokeLinejoin="round" />
                    </g>
                    
                    {/* Medical Cross inside shield with premium hover effect */}
                    <g className="medical-cross-anim cursor-pointer">
                      <rect x="188" y="125" width="24" height="60" rx="3" fill="#14b8a6" />
                      <rect x="170" y="143" width="60" height="24" rx="3" fill="#14b8a6" />
                    </g>
                    
                    {/* Stethoscope wrapping around */}
                    <path d="M128 175c0 40 32 72 72 72s72-32 72-72M200 247v55" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="200" cy="312" r="18" fill="#cbd5e1" stroke="#334155" strokeWidth="5" />
                    <circle cx="200" cy="312" r="8" fill="#64748b" />
                    
                    {/* Stethoscope Earbuds */}
                    <path d="M128 175c0-12 8-24 22-24M272 175c0-12-8-24-22-24" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                  </g>
                  
                  {/* Pulse wave line with running pulse dashboard effect */}
                  <g opacity="0.85">
                    {/* Darker background path for contrast */}
                    <path d="M70 230h20l10-15 10 30 10-20 8 5H140" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.2" />
                    {/* Glowing animated line */}
                    <path d="M70 230h20l10-15 10 30 10-20 8 5H140" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pulse-line-anim" />
                  </g>
                  
                  <defs>
                    <linearGradient id="hero_blob_gradient" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#2dd4bf" />
                      <stop offset="1" stopColor="#0d9488" />
                    </linearGradient>
                    <linearGradient id="shield_bg_grad" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#ffffff" />
                      <stop offset="1" stopColor="#f0fdfa" />
                    </linearGradient>
                    <filter id="shield_shadow" x="95" y="70" width="210" height="240" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.08" />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
            
          </div>
        </section>
      )}

      {/* High-Fidelity Design-Aligned Animated Hero Section Carousel */}
      {activeTab === 'home' && (() => {
        const slides = [
          {
            id: 'symptoms',
            tag: 'AI Symptom Checker',
            title: 'Diagnostic AI Symptom Triage',
            subtitle: 'Instant clinical-grade condition matching',
            description: 'Evaluate active medical symptoms in real-time. Our secure AI cross-references clinical indexes to deliver safe first-line guidance & physician recommendations.',
            actionText: 'Check Symptoms Now',
            icon: <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
            badge: 'bg-teal-50 text-teal-650 border-teal-100 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/40',
            visual: (
              <div className="w-full h-full flex flex-col justify-center bg-slate-50/50 dark:bg-slate-900/35 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
                <div className="absolute top-2 right-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                  <span className="text-[9px] font-black tracking-widest text-slate-400">AI AGENT ONLINE</span>
                </div>
                <div className="space-y-3.5 text-left">
                  <div className="flex gap-2 items-start max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">PT</div>
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-2xl rounded-tl-none text-xs font-semibold leading-normal shadow-2xs">
                      "Fever 38.2C, severe dry cough & fatigue for 3 days."
                    </div>
                  </div>
                  <div className="flex gap-2 items-start justify-end max-w-[85%] ml-auto">
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-3 py-2 rounded-2xl rounded-tr-none text-xs font-black shadow-xs relative">
                      Analyzing symptoms...
                    </div>
                  </div>
                  <div className="flex gap-2 items-start max-w-[90%] pt-1">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">AI</div>
                    <div className="bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 px-3 py-2.5 rounded-2xl rounded-tl-none text-xs font-semibold shadow-xs border border-slate-150 dark:border-slate-800 space-y-1.5 flex-1">
                      <p className="font-extrabold text-teal-755 dark:text-teal-400 text-xs flex items-center gap-1">
                        Match: Mild Upper Respiratory Infection
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 text-[9px] font-bold rounded border border-rose-100/50">Pyrexia (38.2°C)</span>
                        <span className="px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-650 dark:text-yellow-400 text-[9px] font-bold rounded border border-yellow-100/50">Coughing</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-normal">Triage advice: Ensure fluid hydration. If chest tightness develops, request a clinical virtual consult.</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'bmi',
            tag: 'BMI Risk Assessment',
            title: 'Clinical Body Mass Index Calculator',
            subtitle: 'Screen cardiovascular & dietary risk indexes',
            description: 'Determine your height-to-weight alignment instantly. Check healthy score bands, review dietary nutritional indicators, and learn targeted physical activity guidelines.',
            actionText: 'Assess BMI Risk',
            icon: <HeartPulse className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
            badge: 'bg-cyan-50 text-cyan-650 border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900/40',
            visual: (
              <div className="w-full h-full flex flex-col justify-center items-center bg-slate-5/50 dark:bg-slate-900/35 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm relative">
                <div className="w-full max-w-[210px] space-y-4">
                  <div className="mx-auto w-24 h-24 rounded-full border-4 border-emerald-500/10 flex flex-col items-center justify-center p-2 text-center bg-white dark:bg-slate-900 shadow-sm shrink-0">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Active BMI</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">22.4</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider mt-0.5 uppercase">HEALTHY</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-sky-200" title="Underweight"></div>
                      <div className="absolute left-[30%] top-0 bottom-0 w-[35%] bg-emerald-400" title="Normal Healthy"></div>
                      <div className="absolute left-[65%] top-0 bottom-0 w-[15%] bg-amber-300" title="Overweight"></div>
                      <div className="absolute left-[80%] top-0 bottom-0 w-[20%] bg-rose-400" title="Obese"></div>
                      <div className="absolute left-[45%] top-0 bottom-0 w-1 bg-slate-900 dark:bg-white h-full shadow-md"></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-505 dark:text-slate-400 font-bold px-0.5">
                      <span>Underweight</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">Normal</span>
                      <span>Obese</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'glucose',
            tag: 'Glycemic Predictor',
            title: 'Advanced Food Glucose Predictor',
            subtitle: 'Identify glycemic curves & spikes dynamically',
            description: 'Evaluate nutritional components using artificial intelligence to forecast blood-sugar rises. Adjust carbohydrate levels and explore clinical glycemic tips before eating.',
            actionText: 'Predict Glucose Curve',
            icon: <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
            badge: 'bg-orange-50 text-orange-650 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-905/45',
            visual: (
              <div className="w-full h-full flex flex-col justify-center bg-slate-5/50 dark:bg-slate-900/35 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm text-left">
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-105 dark:border-slate-850">
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-105">Pre-Spike: Boiled Potato & White Rice</span>
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-md text-[8.5px] font-extrabold animate-pulse uppercase border border-rose-100/50">Spike Risk</span>
                  </div>
                  <div className="h-24 bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 relative border border-slate-150/50 dark:border-slate-800">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 240 60">
                      <line x1="0" y1="15" x2="240" y2="15" stroke="#e2e8f0" strokeDasharray="3" strokeWidth="0.5" className="dark:stroke-slate-800" />
                      <line x1="0" y1="35" x2="240" y2="35" stroke="#e2e8f0" strokeDasharray="3" strokeWidth="0.5" className="dark:stroke-slate-800" />
                      <path 
                        d="M 10,50 Q 80,48 110,8 T 160,50 Q 200,50 230,50" 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                      />
                      <circle cx="110" cy="8" r="4.5" fill="#ef4444" className="shadow-xs" />
                      <text x="120" y="12" fill="#ef4444" className="text-[8px] font-black">Spike Peak: 172 mg/dL</text>
                    </svg>
                    <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-405 font-bold pt-1">
                      <span>0h pre-meal</span>
                      <span className="text-orange-550 font-black">1.5h post-meal spike</span>
                      <span>4h metabolic recovery</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'appointments',
            tag: 'Clinical Calendars',
            title: 'Specialist In-Person & Tele-Consults',
            subtitle: 'Schedule slots with verified regional doctors',
            description: 'Navigate direct clinical calendars. Connect securely with board-certified practitioners in Bhubaneswar. Get prompt appointment confirmations across general care paths.',
            actionText: 'Book Practitioner Visit',
            icon: <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
            badge: 'bg-purple-50 text-purple-650 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40',
            visual: (
              <div className="w-full h-full flex flex-col justify-center bg-slate-55/35 dark:bg-slate-900/35 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm text-left">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-100 flex items-center justify-center text-xs font-black">
                      DS
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                        Dr. Olivia Sterling
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" title="Verified Specialist ✔"></span>
                      </h5>
                      <span className="text-[9px] font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest block">Chief Cardiologist, Capital Medical</span>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-lg flex justify-between items-center text-[10px] text-slate-650 dark:text-slate-350 font-extrabold border border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">📅 June 22, 2026</span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-400 rounded">10:30 AM Slot</span>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'care',
            tag: 'Odisha Care Finder',
            title: 'Localized Trauma & Clinical Search Maps',
            subtitle: 'Find state-certified emergency clinics near you',
            description: 'Locate local public clinics, certified vaccine chambers, and trauma centers across Bhubaneswar, Cuttack, and regional districts in Odisha with integrated geo-references.',
            actionText: 'Search Care Network',
            icon: <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            badge: 'bg-emerald-50 text-emerald-650 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40',
            visual: (
              <div className="w-full h-full flex flex-col justify-between bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-205 dark:border-slate-800 overflow-hidden relative min-h-[160px] text-left">
                <div className="absolute inset-0 opacity-25 dark:opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="p-3 relative z-10">
                  <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-250 dark:border-teal-900/60">ODISHA STATE CARE PORTAL</span>
                  <p className="text-xs font-black text-slate-900 dark:text-white mt-2">Capital Hospital Complex</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-350 font-bold leading-tight">Unit 6, Bhubaneswar, Odisha - 751001</p>
                </div>
                
                {/* Center marker simulation */}
                <div className="absolute top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <span className="relative flex h-8 w-8 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-600 items-center justify-center text-white border-2 border-white shadow-md text-[10px] font-black">H</span>
                  </span>
                </div>
                
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-850 text-center text-[9px] font-black text-emerald-700 dark:text-emerald-400 relative z-10">
                  📍 2.1 km away - Route directions enabled
                </div>
              </div>
            )
          },
          {
            id: 'vaccines',
            tag: 'Vaccination Planner',
            title: 'Personalized Vaccination Scheduler',
            subtitle: 'Stay protected with localized immunization tracking',
            description: 'Plan, monitor, and schedule critical vaccine immunizations for children, adults, and travel needs. Get smart notifications on dosing schedules and secure digital certificate copies.',
            actionText: 'Plan Vaccines Now',
            icon: <Syringe className="w-4 h-4 text-emerald-600 dark:text-teal-400" />,
            badge: 'bg-emerald-50 text-emerald-650 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40',
            visual: (
              <div className="w-full h-full flex flex-col justify-center bg-slate-5/50 dark:bg-slate-900/35 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm text-left">
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-105 dark:border-slate-850">
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-105">Upcoming Dose: Covid-19 Booster / Flu</span>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-705 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-md text-[8.5px] font-extrabold uppercase border border-emerald-100/50">Next Mo</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                      <span>Overall Immunization Completed</span>
                      <span className="text-teal-600 dark:text-teal-400">85%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 relative z-10 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-[9px] text-slate-600 dark:text-slate-350 font-bold">Hepatitis B & Tetanus certificates uploaded securely.</span>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'tracker',
            tag: 'Health Tracker',
            title: 'Comprehensive Personal Health Logging',
            subtitle: 'Register steps, blood pressure, and core vitals daily',
            description: 'Track daily wellness trends effortlessly. Log your blood pressure logs, step goals, heart rate variations, and weight changes to identify actionable health insights.',
            actionText: 'Open Health Tracker',
            icon: <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
            badge: 'bg-rose-50 text-rose-650 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40',
            visual: (
              <div className="w-full h-full flex flex-col justify-center bg-slate-5/50 dark:bg-slate-900/35 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Daily Movement</span>
                    <div className="my-1.5">
                      <span className="text-lg font-black text-slate-900 dark:text-white">8,420</span>
                      <span className="text-[9px] text-slate-450 ml-1">steps</span>
                    </div>
                    <span className="text-[9px] text-emerald-60s dark:text-emerald-400 font-extrabold">84% of Goal (10k)</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Blood Pressure</span>
                    <div className="my-1.5">
                      <span className="text-lg font-black text-slate-900 dark:text-white">118/78</span>
                      <span className="text-[9px] text-slate-450 ml-1">mmHg</span>
                    </div>
                    <span className="text-[9px] text-emerald-60s dark:text-emerald-400 font-extrabold flex items-center gap-0.5">Optimal Range</span>
                  </div>
                </div>
              </div>
            )
          }
        ];

        const activeSlideItem = slides[currentSlide];

        return (
          <section className="bg-gradient-to-b from-[#f0f9ff]/50 via-white to-slate-50/50 dark:from-[#030d22]/40 dark:via-slate-950 dark:to-slate-950 py-10 md:py-14 border-b border-slate-100 dark:border-slate-900 overflow-hidden relative select-none">
            
            {/* Background elements */}
            <div className="absolute top-1/2 right-[25%] -translate-y-1/2 w-64 h-64 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left Slide Description - Animated on Slide Changing */}
                <div className="lg:col-span-6 space-y-6 text-left flex flex-col justify-center min-h-[320px]">
                  
                  {/* Slide Meta Tag and Playback controller */}
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest ${activeSlideItem.badge}`}>
                      {activeSlideItem.icon}
                      <span>{activeSlideItem.tag}</span>
                    </div>
 
                    {/* Quick Pause/Play Status Indicator */}
                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className="p-1 px-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-450 dark:text-slate-400 hover:text-slate-800 dark:hover:text-amber-400 transition-colors cursor-pointer text-[9px] font-black flex items-center gap-1 shrink-0"
                      title={isAutoPlaying ? "Pause slideshow presentation" : "Play slideshow presentation"}
                    >
                      {isAutoPlaying ? (
                        <>
                          <Pause className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                          <span>AUTO MATCHING ACTIVE</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 text-amber-500" />
                          <span>PAUSED</span>
                        </>
                      )}
                    </button>
                  </div>
 
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="space-y-4"
                    >
                      <span className="text-[11px] font-extrabold tracking-widest text-[#0e8a94] dark:text-teal-400 uppercase block">
                        {activeSlideItem.subtitle}
                      </span>
                      <h2 className="text-3xl md:text-4.5xl font-black text-[#071330] dark:text-white leading-tight tracking-tight">
                        {activeSlideItem.title}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm md:text-[14.5px] leading-relaxed max-w-xl font-normal">
                        {activeSlideItem.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
 
                  {/* Immediate feature access deep-link CTA & Manual Slider arrows */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button
                      onClick={() => {
                        setActiveTab(activeSlideItem.id as TabType);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-655 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer truncate"
                    >
                      <span>{activeSlideItem.actionText}</span>
                      <span className="text-sm">&rarr;</span>
                    </button>
 
                    {/* Micro controls: Previous & Next arrows */}
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <button
                        onClick={() => {
                          setIsAutoPlaying(false);
                          setCurrentSlide((prev) => (prev - 1 + 7) % 7);
                        }}
                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Previous Feature Slide"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
 
                      <button
                        onClick={() => {
                          setIsAutoPlaying(false);
                          setCurrentSlide((prev) => (prev + 1) % 7);
                        }}
                        className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Next Feature Slide"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Slide Bullet Indicators */}
                  <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
                    {slides.map((slide, idx) => (
                      <button
                        key={slide.id}
                        onClick={() => {
                          setIsAutoPlaying(false);
                          setCurrentSlide(idx);
                        }}
                        className={`transition-all duration-300 cursor-pointer ${
                          idx === currentSlide 
                            ? 'w-6 h-2 rounded-full bg-teal-600 dark:bg-teal-400' 
                            : 'w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                        title={`Navigate to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                </div>

                {/* Right Interactive Mockup Graphics - Animated on Slide Changing */}
                <div className="lg:col-span-6 flex items-center justify-center min-h-[280px]">
                  <div className="w-full max-w-md aspect-video relative select-none">
                    
                    {/* Shadow visual background circles */}
                    <div className="absolute inset-0 bg-teal-200/5 dark:bg-teal-900/10 rounded-3xl blur-2xl transform scale-110" />
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.38, ease: "easeInOut" }}
                        className="w-full h-full"
                      >
                        {activeSlideItem.visual}
                      </motion.div>
                    </AnimatePresence>

                  </div>
                </div>

              </div>
            </div>
          </section>
        );
      })()}

      {/* Primary tabs navigation menu */}
      {activeTab !== 'home' && (
        <div 
          className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 shadow-2xs shrink-0 transition-all duration-300" 
          style={{ 
            position: "sticky", 
            top: navbarVisible ? "92px" : "16px", 
            zIndex: 30 
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-6 overflow-x-auto py-0 text-slate-655 dark:text-slate-400 select-none scrollbar-none" aria-label="Tabs">
              <button
                id="tab-splay-symptoms"
                onClick={() => setActiveTab('symptoms')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'symptoms' 
                    ? 'border-teal-600 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t('symptomChecker')}
              </button>

              <button
                id="tab-splay-bmi"
                onClick={() => setActiveTab('bmi')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'bmi' 
                    ? 'border-teal-600 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t('bmiRisk')}
              </button>

              <button
                id="tab-splay-glucose"
                onClick={() => setActiveTab('glucose')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'glucose' 
                    ? 'border-teal-605 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t('glucoseTab')}
              </button>

              <button
                id="tab-splay-tracker"
                onClick={() => setActiveTab('tracker')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'tracker' 
                    ? 'border-teal-600 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Health Tracker
              </button>

              <button
                id="tab-splay-vaccines"
                onClick={() => setActiveTab('vaccines')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'vaccines' 
                    ? 'border-teal-600 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Vaccines
              </button>

              <button
                id="tab-splay-appointments"
                onClick={() => setActiveTab('appointments')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'appointments' 
                    ? 'border-teal-600 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t('clinicalCalendars')}
              </button>

              <button
                id="tab-splay-care"
                onClick={() => setActiveTab('care')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'care' 
                    ? 'border-teal-600 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t('careFinderMap')}
              </button>

              <button
                id="tab-splay-blog"
                onClick={() => setActiveTab('blog')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'blog' 
                    ? 'border-teal-600 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t('healthResearchBlog')}
              </button>

              <button
                id="tab-splay-admin"
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'border-teal-605 text-teal-655 dark:text-teal-450 font-extrabold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t('clinicalControlDesk')}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main page content staging area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
        {activeTab !== 'home' && (
          <div className="mb-6 flex justify-start">
            <button
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center gap-2 group text-xs font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-all cursor-pointer bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:-translate-x-0.5 transition-all duration-200" />
              <span>{t('backToHome')}</span>
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="w-full"
          >
            {currentTabRender()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer disclaimer and status */}
      <footer className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 py-6 text-center text-xs text-slate-400 dark:text-slate-500 shrink-0 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-normal font-sans">
            &copy; 1554 - 2026 VeraMedica Diagnostic Corporation. All peer-reviewed rights reserved.
          </p>
          <div className="flex items-center gap-1.5 select-none font-semibold text-[10px] uppercase text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-150 dark:border-emerald-900/60">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Clinical Systems Active</span>
          </div>
        </div>
      </footer>

      {/* Auth credentials login modal form */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLogin={(user) => {
            setCurrentUser(user);
            // If logging in as admin and currently blocking, navigate to dashboard immediately
            if (user.role === 'admin' && activeTab === 'admin') {
              // Stay on admin table
            } else if (user.role === 'admin' && activeTab === 'symptoms') {
              setActiveTab('admin');
            } else {
              // Stay on active view tab
            }
          }}
        />
      )}

      {/* Floating SOS Emergency Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <button
          id="sos-floating-trigger-btn"
          onClick={() => setShowSosModal(true)}
          className="relative flex items-center justify-center w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border border-red-500/50"
          title="Emergency Help (SOS)"
        >
          {/* Pulsating emergency radar ripple */}
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
          
          <Phone className="w-6 h-6 relative z-10 animate-pulse text-white shrink-0" />
        </button>
      </div>

      {/* Emergency SOS Access Modal */}
      {showSosModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-950/40 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in text-left">
            
            {/* Warning Banner Header */}
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5.5 h-5.5 animate-bounce shrink-0" />
                <div>
                  <h3 className="font-extrabold text-base tracking-wide uppercase">Emergency Medical Help</h3>
                  <p className="text-[10px] text-red-100 font-bold block uppercase tracking-wider">Immediate Assistance & Nearest Location</p>
                </div>
              </div>
              <button
                id="close-sos-modal-btn"
                onClick={() => setShowSosModal(false)}
                className="p-1 hover:bg-white/15 rounded-lg transition-colors cursor-pointer text-white"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Info Panel */}
            <div className="p-6 space-y-6">
              
              {/* Emergency Quick-Dial list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Quick-dial Services
                </h4>
                
                {/* Dial Indian Emergency Line */}
                <div className="flex items-center justify-between p-3.5 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">National Emergency Help</p>
                      <p className="text-[10px] text-red-600 dark:text-red-400 font-extrabold tracking-wider select-all leading-normal">Press to Call: 112 / 108</p>
                    </div>
                  </div>
                  <a
                    href="tel:112"
                    className="px-4 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-extrabold rounded-lg tracking-wide shadow-xs active:scale-95 transition-all text-center"
                    id="sos-dial-112-btn"
                  >
                    Call Now
                  </a>
                </div>

                {/* Dial AIIMS Bhubaneswar ER */}
                <div className="flex items-center justify-between p-3.5 bg-teal-50/50 dark:bg-teal-950/10 border border-teal-100 dark:border-teal-950/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Heart className="w-5 h-5 fill-white/10" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">AIIMS Bhubaneswar ER</p>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold tracking-wider select-all leading-normal">0674 247 6789</p>
                    </div>
                  </div>
                  <a
                    href="tel:06742476789"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-lg tracking-wide shadow-xs active:scale-95 transition-all text-center"
                    id="sos-dial-hospital-btn"
                  >
                    Call ER
                  </a>
                </div>
              </div>

              {/* Nearest Hospital Card Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  Nearest Certified Facility
                </h4>
                
                <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
                  <div>
                    <h5 className="text-sm font-black text-slate-800 dark:text-slate-100">AIIMS Bhubaneswar Hospital</h5>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase mt-0.5 tracking-wider">Emergency Triage Dept • Trauma Level 1</p>
                  </div>
                  
                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 leading-normal font-normal">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <span>Sijua, Patrapada, Bhubaneswar, Odisha 751019</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-250/20">
                        2.5 km away
                      </span>
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-250/20">
                        Open 24 Hours
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://www.google.com/maps/search/?api=1&query=AIIMS+Bhubaneswar+Sijua+Patrapada+Bhubaneswar+Odisha+751019"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer pt-2"
                  >
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    Open Route Directions in Google Maps &rarr;
                  </a>
                </div>
              </div>

              {/* Instructions while waiting */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-505 dark:text-slate-400 font-semibold leading-relaxed border-l-4 border-red-650/80">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 block mb-0.5 uppercase tracking-wide text-[10px]">Guidelines while waiting:</span>
                Remain completely stationary, sit or lie down comfortably, regulate your breath, and keep your primary telecommunication lines entirely uncongested.
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Floating Toast Alerts stack container (styled with premium look & micro animations) */}
      <div className="fixed bottom-24 right-6 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex gap-3.5 items-start pointer-events-auto border-l-[5px] overflow-hidden"
              style={{
                borderLeftColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#3b82f6'
              }}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : toast.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Info className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5 text-left">
                <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{toast.title}</h5>
                <p className="text-xs text-slate-505 dark:text-slate-400 font-normal leading-normal">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Persistent Patient AI Assistant Desk (collapsible & reactive) */}
      <AIAssistant onChangeTab={setActiveTab} />

    </div>
  );
}
