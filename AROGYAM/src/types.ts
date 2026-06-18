/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  image: string;
  hospital: string;
  availability: string[];
  timeSlots: string[];
  bio: string;
  consultationFee?: number;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  createdAt: string;
  paymentMethod?: 'upi' | 'qr_code' | 'pay_at_clinic';
  paymentAmount?: number;
  paymentStatus?: 'pending' | 'paid';
  paymentTxnId?: string;
}

export interface SymptomLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  symptoms: string;
  duration: string;
  additionalInfo?: string;
  analysis: {
    possibleConditions: {
      name: string;
      probability: 'Low' | 'Medium' | 'High';
      explanation: string;
    }[];
    precautionaryMeasures: string[];
    recommendedAction: string;
    recommendedSpecialty: string;
    urgency: 'Routine' | 'Urgent' | 'Emergency';
  };
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  category: 'Wellness' | 'Nutrition' | 'Medical Innovations' | 'Mental Health';
  author: string;
  authorTitle: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string;
  image: string;
  likes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'admin';
  age: number;
  gender: string;
  dob?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
}

// Glucose Spike Predictor Data Models
export interface GlucoseDataPoint {
  time: number;
  glucose: number;
  label: string;
}

export interface GlucoseAnalysis {
  itemName: string;
  glycemicIndex: number;
  glycemicLoad: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  spikeRisk: 'Low' | 'Medium' | 'High';
  spikeSeverityScore: number;
}

export interface GlucoseSuggestion {
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  explanation: string;
}

export interface GlucoseHack {
  title: string;
  description: string;
}

export interface GlucosePredictionResult {
  mealAnalysis: GlucoseAnalysis;
  originalCurve: GlucoseDataPoint[];
  mitigatedCurve: GlucoseDataPoint[];
  suggestedIntake: GlucoseSuggestion;
  hacks: GlucoseHack[];
}

