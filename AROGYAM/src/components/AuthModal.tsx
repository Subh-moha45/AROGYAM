/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User, ShieldAlert, X, Check, Heart, Calendar } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('1996-06-15');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('Male');
  const [role, setRole] = useState<'patient' | 'admin'>('patient');

  const calculateAgeFromDob = (dobStr: string) => {
    if (!dobStr) return 30;
    const birthDate = new Date(dobStr);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge > 0 ? calculatedAge : 0;
  };

  const handleDobChange = (value: string) => {
    setDob(value);
    setAge(calculateAgeFromDob(value));
  };

  const handleQuickSelect = (type: 'patient' | 'admin') => {
    if (type === 'patient') {
      onLogin({
        id: 'usr-pat-1',
        name: 'Alex Morgan',
        email: 'alex.morgan@demo.com',
        role: 'patient',
        age: 32,
        gender: 'Female',
        dob: '1994-04-12',
        bloodGroup: 'O+',
        allergies: 'Penicillin',
        chronicConditions: 'None'
      });
    } else {
      onLogin({
        id: 'usr-adm-1',
        name: 'Dr. Olivia Sterling',
        email: 'admin@healthcare.com',
        role: 'admin',
        age: 45,
        gender: 'Female',
        dob: '1981-08-24',
        bloodGroup: 'A-'
      });
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    onLogin({
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      age: Number(age),
      dob,
      gender,
      bloodGroup: 'B+'
    });
    onClose();
  };

  return (
    <div id="auth-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white/20 text-white" />
            <h3 className="font-semibold text-lg tracking-tight">Access Healthcare Portal</h3>
          </div>
          <button 
            id="auth-close-btn"
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contents */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Select Buttons */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">Quick Demo Access</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="quick-patient-btn"
                onClick={() => handleQuickSelect('patient')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-slate-50 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 text-sm">Demo Patient</p>
                  <p className="text-xs text-slate-400 mt-0.5">Alex Morgan, 32</p>
                </div>
              </button>

              <button
                id="quick-admin-btn"
                onClick={() => handleQuickSelect('admin')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-cyan-500 hover:bg-slate-50 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-100">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 text-sm">Demo Admin</p>
                  <p className="text-xs text-slate-400 mt-0.5">Dr. Olivia Sterling</p>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Or Register Credentials</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              <button
                id="role-patient-toggle"
                type="button"
                className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md transition-all ${role === 'patient' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setRole('patient')}
              >
                Patient Account
              </button>
              <button
                id="role-admin-toggle"
                type="button"
                className={`flex-1 py-1.5 text-center text-xs font-medium rounded-md transition-all ${role === 'admin' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setRole('admin')}
              >
                Clinical Director
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 mb-1" htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 mb-1" htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 mb-1" htmlFor="auth-dob">
                {t('dobLabel')} <span className="text-slate-400 font-normal">(Select from Calendar)</span>
              </label>
              <div className="relative">
                <input
                  id="auth-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-650 mb-1" htmlFor="auth-age">Age (Years)</label>
                <input
                  id="auth-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min="0"
                  max="120"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-650 mb-1" htmlFor="auth-gender">Gender</label>
                <select
                  id="auth-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full mt-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold text-sm rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              Sign In to Patient Portal
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
