/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Doctor, Appointment, SymptomLog, BlogPost } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Shared data directory
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments.json");
const SYMPTOMS_FILE = path.join(DATA_DIR, "symptom_logs.json");

// Middleware
app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper function to read/write persistent data
function readJSONFile<T>(filePath: string, defaultVal: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
      return defaultVal;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultVal;
  }
}

function writeJSONFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

// Global lists loaded once (or persisted)
const mockDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Jenkins",
    specialty: "General Physician",
    rating: 4.8,
    experience: 12,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
    hospital: "City General Hospital",
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    timeSlots: ["09:00 AM", "10:30 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"],
    bio: "Dr. Jenkins is a dedicated primary care practitioner specializing in comprehensive family medicine, preventative healthcare, and lifestyle wellness.",
    consultationFee: 500
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance",
    specialty: "Cardiologist",
    rating: 4.9,
    experience: 18,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
    hospital: "Cardiovascular Care Center",
    availability: ["Monday", "Wednesday", "Friday"],
    timeSlots: ["08:30 AM", "10:00 AM", "11:00 AM", "01:30 PM", "02:30 PM", "04:00 PM"],
    bio: "Dr. Vance is a board-certified Cardiologist focused on interventional cardiology, early cardiovascular disease screening, and arterial health management.",
    consultationFee: 900
  },
  {
    id: "doc-3",
    name: "Dr. Kenji Tanaka",
    specialty: "Pediatrician",
    rating: 4.7,
    experience: 8,
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300&h=300",
    hospital: "St. Jude Children's Clinic",
    availability: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
    timeSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"],
    bio: "Dr. Tanaka is a compassionate pediatrician recognized for providing warm, developmental-focused care for infants, young children, and adolescents.",
    consultationFee: 450
  },
  {
    id: "doc-4",
    name: "Dr. Elena Rostova",
    specialty: "Dermatologist",
    rating: 4.9,
    experience: 15,
    image: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300&h=300",
    hospital: "Radiant Skin Clinical Suite",
    availability: ["Monday", "Thursday", "Friday"],
    timeSlots: ["09:30 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"],
    bio: "Dr. Rostova specializes in general dermatology, modern pediatric skincare solutions, allergen testing, and advanced non-invasive clinical procedures.",
    consultationFee: 600
  },
  {
    id: "doc-5",
    name: "Dr. Neil Patel",
    specialty: "Neurologist",
    rating: 4.6,
    experience: 10,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
    hospital: "Brain & Spine Neurological Institute",
    availability: ["Tuesday", "Wednesday", "Thursday"],
    timeSlots: ["10:00 AM", "11:30 AM", "01:30 PM", "03:00 PM", "04:30 PM"],
    bio: "Dr. Patel's clinical interests encompass migraine prevention, sleep medicine, neuromuscular disorders, and advanced diagnostic electroencephalography.",
    consultationFee: 850
  },
  {
    id: "doc-6",
    name: "Dr. Chloe Dubois",
    specialty: "Psychiatrist",
    rating: 4.8,
    experience: 14,
    image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300&h=300",
    hospital: "Mind & Spirit Counseling Annex",
    availability: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    timeSlots: ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"],
    bio: "Dr. Dubois specializes in cognitive behavioral therapy setups, depression care programs, anxiety relief frameworks, and general neuropsychological health.",
    consultationFee: 700
  }
];

const mockArticles: BlogPost[] = [
  {
    id: "blog-1",
    title: "Understanding High Blood Pressure: The Silent Companion",
    category: "Wellness",
    author: "Dr. Marcus Vance",
    authorTitle: "MD, FACC",
    date: "June 12, 2026",
    readTime: "5 min read",
    excerpt: "Hypertension affects billions globally, often with zero symptomatic warnings. Discover tactical daily habits to measure, monitor, and regulate your reading safely.",
    content: "Blood pressure is the force of your blood pushing against the walls of your arteries. Each time your heart beats, it pumps blood into the arteries. Hypertension, or high blood pressure, occurs when this force is consistently too high, forcing your cardiovascular system to work harder than necessary under strain.\n\n### Primary Red Flags & Detection\nBecause high blood pressure famously presents with zero clinical symptoms, it is widely referred to by clinicians as the 'Silent Killer'. Regular checking is key. Normal healthy adult readings sit below **120/80 mmHg**. Consistent readings above **130/80 mmHg** are classified as clinical hypertension stage 1.\n\n### Practical Lifestyle Tactics:\n1. **Limit Sodium Intake**: Aim to consume less than 2,000 milligrams of sodium daily (roughly 1 teaspoon of table salt).\n2. **The DASH Diet Scheme**: Focus on eating fresh fruits, leafy vegetables, lean proteins, and potassium-rich foods (such as spinach and bananas).\n3. **Moderate Movement**: 30 minutes of aerobic exercise (brisk walking, cycling) daily reduces pressure parameters naturally by relaxing active blood vessel walls.\n4. **Manage Stress Levels**: Stress activates key sympathetic triggers causing heart rates and peripheral resistance to swell.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=500&h=300",
    likes: 42
  },
  {
    id: "blog-2",
    title: "A Clinical Approach to Balanced Nutrition and Gut Health",
    category: "Nutrition",
    author: "Dr. Sarah Jenkins",
    authorTitle: "MD, Board Certified GP",
    date: "May 28, 2026",
    readTime: "7 min read",
    excerpt: "The gut microbiome plays a pivotal role in overall systemic immunity and psychological well-being. Look into clinically-backed foods supporting your microflora.",
    content: "The human gut is home to trillions of microorganisms, comprising the complex microbiome. Scientific advancements show that a healthy microbiome coordinates digestive efficacy, regulates glycemic balance, strengthens immune response barriers, and influences neurotransmitter cycles associated with mental state.\n\n### The Probiotic vs. Prebiotic Balance\nMaintaining a flourishing internal microflora requires feeding the active beneficial bacteria with proper organic inputs:\n- **Probiotics**: Foods introducing live, healthy bacterial colonies directly (e.g., plain Greek yogurt, active kefir, fermented sauerkraut, kimchi).\n- **Prebiotics**: Viscous fibrous foods that digest slowly and act as actual food sources for friendly bacteria (e.g., onions, garlic, bananas, oats, and chia seeds).\n\n### Practical Rules to Support Digestive Wellness:\n- Avoid highly refined processed sugars which feed inflammatory strains.\n- Stay hydrated to preserve gut linings and optimize transit cycles.\n- Chew slowly is a simple physical habit to support enzymatic activation.",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=500&h=300",
    likes: 87
  },
  {
    id: "blog-3",
    title: "Recognizing Chronic Burnout: Mental Health Red Flags",
    category: "Mental Health",
    author: "Dr. Chloe Dubois",
    authorTitle: "PhD, Neuropsychiatrist",
    date: "April 15, 2026",
    readTime: "6 min read",
    excerpt: "Failing to separate persistent daily fatigue from professional cognitive burnout is a frequent occurrence. Explore physiological boundaries of stress fatigue.",
    content: "Burnout is not merely feeling tired after a demanding workday; it is an occupational clinical phenomenon resulting from unmanaged chronic workplace stress. Burnout directly affects neuro-endocrine pathways, leading to adrenal exhaustion and elevated cortisol output patterns.\n\n### The Three Core Dimensions of Burnout:\n1. **Deep Exhaustion**: Feeling physically, cognitive, and emotionally drained on a persistent basis.\n2. **De-personalization**: Developing negative, detached, or cynical outlooks toward professional tasks or social circles.\n3. **Diminished Efficacy**: A strong feeling of incompetence, listlessness, and complete lack of standard achievement.\n\n### Clinical Interventions & Stress Relief:\n- **Establish Clock Boundaries**: Make a hard distinction between work time and restoration time.\n- **Cognitive Reframing**: Talk through triggers using psychotherapist counsel to disarm somatic anxiety spirals.\n- **Diaphragmatic Breathing**: Calms active vagal pathways to shift the nervous system away from sympathetic 'fight-or-flight' states.",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=500&h=300",
    likes: 114
  }
];

// Seed initial empty files
let appointments = readJSONFile<Appointment[]>(APPOINTMENTS_FILE, []);
let symptomLogs = readJSONFile<SymptomLog[]>(SYMPTOMS_FILE, []);

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Doctors
app.get("/api/doctors", (req, res) => {
  res.json(mockDoctors);
});

// Appointments Management
app.get("/api/appointments", (req, res) => {
  const { email } = req.query;
  appointments = readJSONFile<Appointment[]>(APPOINTMENTS_FILE, []);
  if (email) {
    const userBookings = appointments.filter(a => a.userEmail === email);
    return res.json(userBookings);
  }
  res.json(appointments);
});

app.post("/api/appointments", (req, res) => {
  const {
    userId,
    userName,
    userEmail,
    userPhone,
    doctorId,
    doctorName,
    specialty,
    date,
    timeSlot,
    notes,
    paymentMethod,
    paymentAmount,
    paymentStatus,
    paymentTxnId
  } = req.body;

  if (!userName || !userEmail || !doctorId || !date || !timeSlot) {
    return res.status(400).json({ error: "Missing required booking details." });
  }

  appointments = readJSONFile<Appointment[]>(APPOINTMENTS_FILE, []);
  
  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    userId: userId || "anonymous",
    userName,
    userEmail,
    userPhone,
    doctorId,
    doctorName,
    specialty,
    date,
    timeSlot,
    status: 'pending',
    notes: notes || "",
    createdAt: new Date().toISOString(),
    paymentMethod,
    paymentAmount,
    paymentStatus,
    paymentTxnId
  };

  appointments.push(newAppointment);
  writeJSONFile(APPOINTMENTS_FILE, appointments);
  res.status(201).json(newAppointment);
});

// Cancel Appointment
app.post("/api/appointments/cancel", (req, res) => {
  const { appointmentId } = req.body;
  appointments = readJSONFile<Appointment[]>(APPOINTMENTS_FILE, []);
  
  const index = appointments.findIndex(a => a.id === appointmentId);
  if (index === -1) {
    return res.status(404).json({ error: "Appointment not found." });
  }

  appointments[index].status = 'cancelled';
  writeJSONFile(APPOINTMENTS_FILE, appointments);
  res.json(appointments[index]);
});

// Update Status (Admin dashboard action)
app.post("/api/appointments/status", (req, res) => {
  const { appointmentId, status } = req.body;
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ error: "Invalid status parameter." });
  }

  appointments = readJSONFile<Appointment[]>(APPOINTMENTS_FILE, []);
  
  const index = appointments.findIndex(a => a.id === appointmentId);
  if (index === -1) {
    return res.status(404).json({ error: "Appointment not found." });
  }

  appointments[index].status = status;
  writeJSONFile(APPOINTMENTS_FILE, appointments);
  res.json(appointments[index]);
});

// Symptom logs
app.get("/api/symptom-logs", (req, res) => {
  const { email } = req.query;
  symptomLogs = readJSONFile<SymptomLog[]>(SYMPTOMS_FILE, []);
  if (email) {
    const userLogs = symptomLogs.filter(log => log.userEmail === email || log.userId === email);
    return res.json(userLogs);
  }
  res.json(symptomLogs);
});

app.post("/api/symptom-logs", (req, res) => {
  const log = req.body;
  if (!log.symptoms || !log.analysis) {
    return res.status(400).json({ error: "Missing log properties." });
  }
  symptomLogs = readJSONFile<SymptomLog[]>(SYMPTOMS_FILE, []);
  symptomLogs.push(log);
  writeJSONFile(SYMPTOMS_FILE, symptomLogs);
  res.status(201).json(log);
});

// Blog posts
const blogLikesCache: Record<string, number> = {};
app.get("/api/blog", (req, res) => {
  const updatedArticles = mockArticles.map(art => ({
    ...art,
    likes: art.likes + (blogLikesCache[art.id] || 0)
  }));
  res.json(updatedArticles);
});

app.post("/api/blog/:id/like", (req, res) => {
  const id = req.params.id;
  blogLikesCache[id] = (blogLikesCache[id] || 0) + 1;
  res.json({ id, likes: blogLikesCache[id] });
});

// Administrative Stats
app.get("/api/stats", (req, res) => {
  appointments = readJSONFile<Appointment[]>(APPOINTMENTS_FILE, []);
  symptomLogs = readJSONFile<SymptomLog[]>(SYMPTOMS_FILE, []);

  const totalBookings = appointments.length;
  const pendingBookings = appointments.filter(a => a.status === 'pending').length;
  const confirmedBookings = appointments.filter(a => a.status === 'confirmed').length;
  const completedBookings = appointments.filter(a => a.status === 'completed').length;
  const cancelledBookings = appointments.filter(a => a.status === 'cancelled').length;

  const logsCount = symptomLogs.length;

  // Specialties list popular
  const specCounts: Record<string, number> = {};
  appointments.forEach(a => {
    specCounts[a.specialty] = (specCounts[a.specialty] || 0) + 1;
  });

  const symptomUrgencyCounts = { Routine: 0, Urgent: 0, Emergency: 0 };
  symptomLogs.forEach(log => {
    if (log.analysis && log.analysis.urgency) {
      symptomUrgencyCounts[log.analysis.urgency] = (symptomUrgencyCounts[log.analysis.urgency] || 0) + 1;
    }
  });

  res.json({
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },
    symptomChecksCount: logsCount,
    symptomUrgency: symptomUrgencyCounts,
    specialtyPopularity: specCounts
  });
});

// Intelligent AI Symptom Checker Route (using @google/genai on Server-Side)
app.post("/api/gemini/symptoms", async (req, res) => {
  const { symptoms, duration, additionalInfo, userDemographics } = req.body;

  if (!symptoms || !duration) {
    return res.status(400).json({ error: "Symptoms and duration parameters are required." });
  }

  const prompt = `
Analyze the following patient reported symptoms:
Symptom Description: "${symptoms}"
Duration: "${duration}"
Additional Info: "${additionalInfo || "None provided"}"
Patient Demographics: Age: ${userDemographics?.age || "Not provided"}, Biological Gender: ${userDemographics?.gender || "Not provided"}

Evaluate this data comprehensively. Formulate up to 3 possible medical conditions with details, corresponding probability levels ("Low", "Medium", or "High"), brief educational explanations, and clear disclaimer summaries. Include 3-5 immediate precautionary, non-critical supportive or physiological self-care measures. Advise on a specific professional course of action ("recommendedAction"), the specialty of the professional therapist or physician to look up ("recommendedSpecialty"), and clinical urgency priority tier ("urgency" which must be strictly "Routine", "Urgent", or "Emergency").

Constraints:
- You must speak objectively, professionally, and include standard clinical disclaimers. Do NOT prescribe drugs.
- Return the response strictly as valid, parsable JSON matching this schema exactly:
{
  "possibleConditions": [
    {
      "name": "Condition Name",
      "probability": "Low" | "Medium" | "High",
      "explanation": "Short detailed diagnostic explanation"
    }
  ],
  "precautionaryMeasures": [
    "Measure 1 to do at home (e.g., monitor hydration, rest, ice)",
    "Measure 2..."
  ],
  "recommendedAction": "Summary professional advice",
  "recommendedSpecialty": "e.g., General Physician, Dermatologist, Cardiologist, etc.",
  "urgency": "Routine" | "Urgent" | "Emergency"
}
`;

  try {
    const isKeyConfigured = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    
    if (!isKeyConfigured) {
      // Return highly structured, beautiful synthetic clinical dummy analysis if key is unconfigured
      console.log("Gemini API key is missing or is placeholder. Using robust clinical heuristic proxy.");
      const fallbackAnalysis = generateFallbackAnalysis(symptoms);
      return res.json(fallbackAnalysis);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleConditions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  probability: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                  explanation: { type: Type.STRING }
                },
                required: ["name", "probability", "explanation"]
              }
            },
            precautionaryMeasures: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedAction: { type: Type.STRING },
            recommendedSpecialty: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ["Routine", "Urgent", "Emergency"] }
          },
          required: ["possibleConditions", "precautionaryMeasures", "recommendedAction", "recommendedSpecialty", "urgency"]
        },
        temperature: 0.2
      }
    });

    const parsedText = response.text || "{}";
    const parsedData = JSON.parse(parsedText);
    res.json(parsedData);

  } catch (error) {
    console.error("Gemini Symptoms Extraction Failure:", error);
    // Graceful error proxy recovery
    const fallbackAnalysis = generateFallbackAnalysis(symptoms);
    res.json(fallbackAnalysis);
  }
});

// AIAssistant Chatbot Bot API Route (using @google/genai on Server-Side)
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message parameter is required." });
  }

  const systemInstruction = `
You are the "VeraMedica Arogyam Assistant" - an empathetic, highly professional, and extremely knowledgeable clinical chatbot companion.
VeraMedica (Arogyam Portal) is based in Bhubaneswar, Odisha, India. The local reference hospitals in the system are:
1. AIIMS Bhubaneswar Hospital (Sijua, Patrapada) - Specialty: Comprehensive Level-1 Trauma Care, Tertiary Super Speciality. Phone: 0674 247 6789.
2. AMRI Hospitals Bhubaneswar (Khandagiri-Udayagiri Road) - Specialty: Multispecialty Healthcare, Emergency Cardiac & Neuro Wing. Phone: 0674 666 6600.
3. Apollo Hospitals Bhubaneswar (Sainik School Rd, Unit 15) - Specialty: Major Surgical and Critical Triage Command. Phone: 0674 230 8500.
4. Kalinga Institute of Medical Sciences (KIMS) (Patharagadia) - Specialty: Regional High Density Super Speciality Center. Phone: 0674 272 5314.
We also have 24/7 pharmacies: Laxmi Medical Hall, Apollo Pharmacy, MedPlus Pharmacy.

The portal tabs are:
- Symptoms Triage (Symptom Checker Tab)
- BMI & Nutrition (BMI Calculator Tab)
- Specialist Booking (Appointment Booking Tab)
- Find Care interactive map (Map Tab)
- Health Blog (Wellness articles Tab)

Support rules:
- Answer medical, wellness, and portal navigation questions clearly. Speak objectively, professionally, and compassionately.
- Recommend user to see specialized physicians if needed.
- Suggest visiting relevant sections of our app when they mention actions like booking, map/location, checking symptoms, calculating BMI or checking the blog.
- Always include a short clinical disclaimer stating that this AI does not prescribe medicines or replace real doctors.
- Keep response under 130 words. Format with clean bullet points or bold highlights.
`;

  const formattedContents = [];
  
  if (Array.isArray(history)) {
    history.slice(-8).forEach(h => {
      formattedContents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    });
  }

  formattedContents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const isKeyConfigured = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

    if (!isKeyConfigured) {
      const responseText = generateFallbackChat(message);
      return res.json({ text: responseText });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 450,
      }
    });

    res.json({ text: response.text || "Hello! I am your medical assistant companion. How can I assist you with your health details today?" });
  } catch (error) {
    console.error("Gemini Chatbot Failure:", error);
    const responseText = generateFallbackChat(message);
    res.json({ text: responseText });
  }
});

// AI Glucose Spike Predictor Endpoint (using @google/genai on Server-Side)
app.post("/api/gemini/glucose", async (req, res) => {
  const { mealDescription, scenarios } = req.body;

  if (!mealDescription) {
    return res.status(400).json({ error: "Meal description parameter is required." });
  }

  const processedScenarios = Array.isArray(scenarios) ? scenarios : [];

  const systemInstruction = `
You are a highly precise metabolic clinical analysis system specializing in endocrinology, nutritional biochemistry, and glucose homeostasis.
Using glycemic indexes, macronutrient properties, and simulated gastric dumping responses, predict blood glucose curve patterns.
Analyze the meal described and the relevant lifestyle scenarios. Provide two data curves over 3 hours (0 to 180 min):
- Curve 1 (original Curve): Baseline starting around 80-100 mg/dL, predicting response to the raw meal.
- Curve 2 (mitigated Curve): Improved response curve if the patient incorporates optimal sequencing (fiber first, protein/fat second) and the suggested macronutrient adjustments.
Suggest how many Carbs, Protein, Fats, and Fiber the user SHOULD consume instead to reduce spikes.
Keep and generate exactly 9 time-points: 0m, 15m, 30m, 45m, 60m, 90m, 120m, 150m, 180m.
Make sure the glucose readings are clinically realistic (e.g., highly glycemic meals can peak near 160-200, low glycemic meals spike minimally and stay under 120).
`;

  const prompt = `
Meal: "${mealDescription}"
Adjusting factors / Scenarios: ${processedScenarios.length > 0 ? processedScenarios.join(", ") : "None"}

Generate a detailed metabolic report inside the JSON.
`;

  try {
    const isKeyConfigured = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

    if (!isKeyConfigured) {
      console.log("Gemini API key is unconfigured. Using high-fidelity metabolic simulation heuristics.");
      const simulation = generateFallbackGlucosePrediction(mealDescription, processedScenarios);
      return res.json(simulation);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mealAnalysis: {
              type: Type.OBJECT,
              properties: {
                itemName: { type: Type.STRING },
                glycemicIndex: { type: Type.INTEGER },
                glycemicLoad: { type: Type.INTEGER },
                calories: { type: Type.INTEGER },
                carbs: { type: Type.INTEGER },
                protein: { type: Type.INTEGER },
                fat: { type: Type.INTEGER },
                fiber: { type: Type.INTEGER },
                spikeRisk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                spikeSeverityScore: { type: Type.INTEGER }
              },
              required: ["itemName", "glycemicIndex", "glycemicLoad", "calories", "carbs", "protein", "fat", "fiber", "spikeRisk", "spikeSeverityScore"]
            },
            originalCurve: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.INTEGER },
                  glucose: { type: Type.INTEGER },
                  label: { type: Type.STRING }
                },
                required: ["time", "glucose", "label"]
              }
            },
            mitigatedCurve: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.INTEGER },
                  glucose: { type: Type.INTEGER },
                  label: { type: Type.STRING }
                },
                required: ["time", "glucose", "label"]
              }
            },
            suggestedIntake: {
              type: Type.OBJECT,
              properties: {
                carbs: { type: Type.INTEGER },
                protein: { type: Type.INTEGER },
                fat: { type: Type.INTEGER },
                fiber: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["carbs", "protein", "fat", "fiber", "explanation"]
            },
            hacks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["mealAnalysis", "originalCurve", "mitigatedCurve", "suggestedIntake", "hacks"]
        },
        temperature: 0.15
      }
    });

    const parsedText = response.text || "{}";
    const parsedData = JSON.parse(parsedText);
    res.json(parsedData);
  } catch (err) {
    console.error("Gemini Glucose Estimator Failed:", err);
    const simulation = generateFallbackGlucosePrediction(mealDescription, processedScenarios);
    res.json(simulation);
  }
});

function generateFallbackGlucosePrediction(meal: string, scenarios: string[]) {
  const lower = meal.toLowerCase();
  
  // Categorize food high, medium, low spike
  const isHighSpike = lower.includes("rice") || lower.includes("sugar") || lower.includes("sweet") || 
                      lower.includes("donut") || lower.includes("cookie") || lower.includes("cake") || 
                      lower.includes("pizza") || lower.includes("pizza") || lower.includes("soda") || 
                      lower.includes("bread") || lower.includes("burger") || lower.includes("honey") || 
                      lower.includes("chocolate") || lower.includes("juice") || lower.includes("pasta") || 
                      lower.includes("waffle") || lower.includes("pancake") || lower.includes("crepe");

  const isLowSpike = lower.includes("salad") || lower.includes("chicken") || lower.includes("egg") || 
                     lower.includes("avocado") || lower.includes("broccoli") || lower.includes("spinach") || 
                     lower.includes("steak") || lower.includes("cucumber") || lower.includes("tofu") || 
                     lower.includes("salmon") || lower.includes("fish") || lower.includes("protein shake") || 
                     lower.includes("nuts") || lower.includes("almond");

  // Base configurations
  let itemName = meal;
  let glycemicIndex = 52;
  let glycemicLoad = 14;
  let calories = 450;
  let carbs = 58;
  let protein = 14;
  let fat = 15;
  let fiber = 4;
  let spikeRisk: "High" | "Medium" | "Low" = "Medium";
  let spikeSeverityScore = 55;

  let origPeak = 148;
  let origPeakTime = 60;
  
  if (isHighSpike) {
    glycemicIndex = 78;
    glycemicLoad = 28;
    calories = 580;
    carbs = 85;
    protein = 8;
    fat = 18;
    fiber = 1;
    spikeRisk = "High";
    spikeSeverityScore = 85;
    origPeak = 188;
    origPeakTime = 45;
  } else if (isLowSpike) {
    glycemicIndex = 25;
    glycemicLoad = 3;
    calories = 310;
    carbs = 12;
    protein = 28;
    fat = 16;
    fiber = 6;
    spikeRisk = "Low";
    spikeSeverityScore = 18;
    origPeak = 112;
    origPeakTime = 30;
  }

  // Adjust peak based on scenarios selected
  let baseGlucose = 90;
  if (scenarios.includes("Fasting")) {
    baseGlucose = 82; // lower starting baseline
  } else if (scenarios.includes("First meal of the day")) {
    baseGlucose = 95; // slightly higher waking response
  }

  if (scenarios.includes("High Stress")) {
    origPeak += 15; // stress raises cortisol and glucose response
    spikeSeverityScore = Math.min(100, spikeSeverityScore + 10);
  }

  // Generate curves matching time sequence [0, 15, 30, 45, 60, 90, 120, 150, 180]
  const times = [0, 15, 30, 45, 60, 90, 120, 150, 180];
  const labels = ["0m", "15m", "30m", "45m", "60m", "90m", "120m", "150m", "180m"];

  // Helper curve shapes based on peak and return-to-normal
  const originalCurve = times.map((t, idx) => {
    let dev = 0;
    if (t === 0) dev = 0;
    else if (t === 15) dev = (origPeak - baseGlucose) * 0.45;
    else if (t === 30) dev = (origPeak - baseGlucose) * 0.82;
    else if (t === 45) dev = t <= origPeakTime ? (origPeak - baseGlucose) : (origPeak - baseGlucose) * 0.92;
    else if (t === 60) dev = t <= origPeakTime ? (origPeak - baseGlucose) : (origPeak - baseGlucose) * 0.85;
    else if (t === 90) dev = (origPeak - baseGlucose) * 0.45;
    else if (t === 120) dev = (origPeak - baseGlucose) * 0.18;
    else if (t === 150) dev = (origPeak - baseGlucose) * 0.05;
    else dev = -2; // slight dip below baseline
    
    return {
      time: t,
      glucose: Math.round(baseGlucose + dev),
      label: labels[idx]
    };
  });

  // Scenario mitigation: If "Apple Cider Vinegar" or "Post-meal walk" is already applied, 
  // original curve is flatter, but we still predict a further optimized mitigated curve
  let mitPeak = Math.round(baseGlucose + (origPeak - baseGlucose) * 0.52);
  let mitPeakTime = 60; // slower uptake shifts peak slightly later

  const mitigatedCurve = times.map((t, idx) => {
    let dev = 0;
    if (t === 0) dev = 0;
    else if (t === 15) dev = (mitPeak - baseGlucose) * 0.35;
    else if (t === 30) dev = (mitPeak - baseGlucose) * 0.70;
    else if (t === 45) dev = (mitPeak - baseGlucose) * 0.90;
    else if (t === 60) dev = (mitPeak - baseGlucose);
    else if (t === 90) dev = (mitPeak - baseGlucose) * 0.65;
    else if (t === 120) dev = (mitPeak - baseGlucose) * 0.35;
    else if (t === 150) dev = (mitPeak - baseGlucose) * 0.12;
    else dev = 0;

    return {
      time: t,
      glucose: Math.round(baseGlucose + dev),
      label: labels[idx]
    };
  });

  // Suggestions for optimized macronutrient intakes
  const suggestedCarbs = isHighSpike ? Math.round(carbs * 0.45) : Math.round(carbs * 0.8);
  const suggestedProtein = isHighSpike ? Math.round(protein * 2.2) : Math.round(protein * 1.2);
  const suggestedFat = Math.max(8, isHighSpike ? Math.round(fat * 0.8) : fat);
  const suggestedFiber = Math.max(8, fiber + 5);
  
  const explanation = isHighSpike 
    ? `This meal contains highly refined simple carbohydrates (${carbs}g) with minimal protein (${protein}g) and fiber (${fiber}g). This fuels rapid gastric emptying, dumping glucose cleanly into blood vessels. By re-balancing to ${suggestedCarbs}g Carbs, ${suggestedProtein}g high-biological-value Protein, and adding ${suggestedFiber}g soluble organic Fiber, you create a biochemical gel during digestion that limits the rate of glucose transport and flattens the peak curve.`
    : `This meal is already moderately well balanced. However, to achieve an absolutely flat glucose line under 120 mg/dL, we recommend adding ${suggestedFiber}g of dietary fiber first, followed by ${suggestedProtein}g of lean bio-available proteins, which stimulates GLP-1 secretion before carbohydrates are encountered.`;

  const hacks = [
    {
      title: "Sequence Your Nutrients First",
      description: "Always consume fiber (like broccoli, leafy salad) first, then eat proteins/fats, and finish with starches or glycemic carbs. Doing this slows gastric emptying and blocks rapid glucose absorption."
    }
  ];

  if (scenarios.includes("Post-meal walk")) {
    hacks.push({
      title: "Leverage Skeletal Muscle Syncing",
      description: "Your Post-meal walk is already lowering glucose levels. Keep doing this: walking for 10-15 minutes immediately after eating allows GLUT4 transporters in muscles to clear glucose without requiring extra insulin."
    });
  } else {
    hacks.push({
      title: "Initiate immediate 10m Post-Meal Walk",
      description: "A short 10-15 minute leisurely walk taken within 30 minutes of completing a meal allows contracting muscles to draw glucose straight from blood cells, lowering peak spikes by up to 28%."
    });
  }

  if (scenarios.includes("Apple Cider Vinegar")) {
    hacks.push({
      title: "Acetic Acid Pre-Load Confirmed",
      description: "The vinegar pre-load is highly effective. The acetic acid temporary delays salivary alpha-amylase activity, stalling starch-to-glucose breakdown in your stomach."
    });
  } else {
    hacks.push({
      title: "Implement the Acid Hack",
      description: "Drink 1 tbsp of raw organic apple cider vinegar diluted in a large glass of room-temperature water 10 minutes before meals. It reduces the glycemic impact of carbs."
    });
  }

  return {
    mealAnalysis: {
      itemName,
      glycemicIndex,
      glycemicLoad,
      calories,
      carbs,
      protein,
      fat,
      fiber,
      spikeRisk,
      spikeSeverityScore
    },
    originalCurve,
    mitigatedCurve,
    suggestedIntake: {
      carbs: suggestedCarbs,
      protein: suggestedProtein,
      fat: suggestedFat,
      fiber: suggestedFiber,
      explanation
    },
    hacks
  };
}

function generateFallbackChat(message: string): string {
  const lower = message.toLowerCase();
  
  let msg = "";
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("greet")) {
    msg = "Hello! I am your **Arogyam Assistant**. I am here to help you navigate your appointments, learn about healthcare facilities in Bhubaneswar, check symptoms, or read medical articles. How can I assist you today?";
  } else if (lower.includes("appointment") || lower.includes("book") || lower.includes("doctor") || lower.includes("visit")) {
    msg = "To schedule a clinician visit with one of our specialized doctors (such as Dr. Sarah Jenkins or Dr. Neil Patel), please go to our **Specialist Booking** tab. You can select your desired specialist, pick your time slot, describe your health situation, and secure a spot instantly!";
  } else if (lower.includes("symptom") || lower.includes("triage") || lower.includes("sick") || lower.includes("pain") || lower.includes("headache") || lower.includes("chest")) {
    msg = "For clinical symptom evaluations, please go to the **Symptom Checker** tab. Enter your active discomforts, and our triage engine will formulate possible conditions, home self-care recommendations, and clinical urgency priorities.";
  } else if (lower.includes("hospital") || lower.includes("map") || lower.includes("gps") || lower.includes("locate") || lower.includes("pharmacy") || lower.includes("bhubaneswar") || lower.includes("distance")) {
    msg = "You can easily check reference centers on the **Find Care** map tab. It features top Bhubaneswar facilities: **AIIMS Bhubaneswar** (Sijua), **AMRI Hospitals** (Khandagiri), and **Apollo Hospitals** (Gajapati). To verify travel range, click anywhere on the map to drop a custom location pin—all distances will re-calculate dynamically!";
  } else if (lower.includes("bmi") || lower.includes("weight") || lower.includes("height") || lower.includes("diet") || lower.includes("calories")) {
    msg = "VeraMedica features a clinical digestive calculator. Switch to our **BMI & Nutri** tab to compute your body mass index parameters and receive customized caloric dietary setups instantly.";
  } else if (lower.includes("article") || lower.includes("blog") || lower.includes("read") || lower.includes("gut") || lower.includes("hypertension") || lower.includes("burnout")) {
    msg = "We feature premium physician-authored logs in the **Health Blog** tab. You can digest papers on managing silent hypertension, balancing gut flora prebiotics, and reducing psychological stress burnout.";
  } else {
    msg = "I appreciate your message. As your VeraMedica health companion, I can help you understand medical triage, find general physicians, check clinical map ranges, and calculate BMI parameters. Feel free to direct me to any of these areas.\n\n*Disclaimer: Chatbot tips are informational support only and do not constitute formal clinical prescription.*";
  }
  return msg;
}

function generateFallbackAnalysis(symptoms: string) {
  const lower = symptoms.toLowerCase();
  
  if (lower.includes("chest") || lower.includes("heart") || lower.includes("cardiac") || lower.includes("breath")) {
    return {
      possibleConditions: [
        {
          name: "Angina / Cardiovascular Spasm (Simulated)",
          probability: "Medium",
          explanation: "Temporary lack of blood flow or oxygen to heart muscles under high workload. Needs professional clinical exclusion."
        },
        {
          name: "Gastroesophageal Reflux (GERD) Simulated",
          probability: "Medium",
          explanation: "Stomach acids escaping into the esophagus mimic physical symptoms of heavy breast pressure."
        }
      ],
      precautionaryMeasures: [
        "Avoid any heavy physical exertion or exercise immediately",
        "Sit upright and breathe deeply and calmly to regulate pulse",
        "Loosen tight clothing around neck and waist"
      ],
      recommendedAction: "Exclusion of cardiac anomalies is critical. Seek medical examination if discomfort propagates.",
      recommendedSpecialty: "Cardiologist",
      urgency: "Urgent"
    };
  }

  if (lower.includes("head") || lower.includes("migraine") || lower.includes("brain")) {
    return {
      possibleConditions: [
        {
          name: "Tension Headache (Simulated)",
          probability: "High",
          explanation: "Prolonged contraction of cranial-cervical muscles, often induced by prolonged screen exposure or heavy emotional tension."
        },
        {
          name: "Classic Migraine Episode (Simulated)",
          probability: "Medium",
          explanation: "Neurovascular event causing sensory amplification, nausea, or visual aura waves."
        }
      ],
      precautionaryMeasures: [
        "Rest in a dimmed, completely silent room",
        "Apply a cold, damp compress across the forehead",
        "Ensure thorough hydration and limit digital monitors"
      ],
      recommendedAction: "Log frequency and triggers. Consult for optimal pain regulation protocol.",
      recommendedSpecialty: "Neurologist",
      urgency: "Routine"
    };
  }

  // General fallback
  return {
    possibleConditions: [
      {
        name: "Viral Respiratory Infection / Mild Fatigue Setup (Simulated)",
        probability: "High",
        explanation: "Mild immune system activation responding to standard physiological triggers or season changes."
      },
      {
        name: "Mild Exhaustion / Dehydration Syndrome (Simulated)",
        probability: "Medium",
        explanation: "Elevated metabolic stress due to low fluid consumption combined with chronic workload sleep deficits."
      }
    ],
    precautionaryMeasures: [
      "Supplement water intake consistently (at least 2.5L daily)",
      "Ensure an uninterrupted rest cycle of 7-8 hours",
      "Monitor body temperature at scheduled intervals"
    ],
    recommendedAction: "Keep a daily log of physical status and seek primary physician counsel if conditions persist past 72 hours.",
    recommendedSpecialty: "General Physician",
    urgency: "Routine"
  };
}

// -------------------------------------------------------------
// Dev & Production Assets Serving Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting securely on http://0.0.0.0:${PORT}`);
  });
}

startServer();
