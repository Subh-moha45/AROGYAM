import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageType = 'en' | 'hi' | 'or';

interface LanguageContextProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const translations: Record<LanguageType, Record<string, string>> = {
  en: {
    // Header & Navigation
    arogyam: 'AROGYAM',
    healthcarePortal: 'Healthcare Portal',
    fullSuite: 'Full Suite',
    symptomChecker: 'AI Symptom Checker',
    bmiRisk: 'BMI Risk Assessment',
    clinicalCalendars: 'Clinical Calendars',
    careFinderMap: 'Care Finder Map',
    healthResearchBlog: 'Health Research Blog',
    clinicalControlDesk: 'Clinical Control Desk',
    portalAccess: 'Portal Access',
    logout: 'Logout',
    active: 'Clinical Systems Active',
    dismissCheckIn: 'Dismiss check-in',
    backToHome: 'Back to Home (Quick Navigation)',

    // Access Gates
    credentialsRequired: 'Patient Credentials Required',
    credentialsText: 'To consult our clinical triage index and save your symptom monitoring assessments, please log in with your credentials. Try the quick selection options!',
    signInPortal: 'Sign In to Patient Portal',
    unlockDoctor: 'Unlock Doctor Booking',
    unlockDoctorText: 'Access certified clinical calendars, arrange physical outpatient consultations and manage your family\'s care logs by registering your profile.',
    accessCareDirs: 'Access Care Directories',
    clearanceRequired: 'Hospital Director Clearance Required',
    clearanceText: 'You are currently navigating as a guest or patient. Complete clearance authentication to access outpatient statistics, confirm appointments or review outbreak charts.',
    signInAdmin: 'Sign In as Administrator',
    returnTriage: 'Return to Patient Symptoms Triage',

    // Symptom Checker Main Details
    enterSymptoms: 'Symptom Analyzer',
    describeFeeling: 'How can we help you feel better today?',
    symptomsPlaceholder: 'Describe how you feel (e.g., headache, low fever for 2 days, slight coughing)...',
    durationLabel: 'Symptom Duration',
    durationPlaceholder: 'e.g., 2 days, 1 week, since this morning...',
    additionalLabel: 'Allergies, Chronic Conditions or Ongoing Medications',
    additionalPlaceholder: 'e.g., Asthma, Penicillin allergy, none...',
    clearInputs: 'Clear Inputs',
    analyzeNow: 'Analyze Symptoms Now',
    pastAssessments: 'Past Health Triage Reports',
    analysisReport: 'Clinical Differential Analysis',
    urgencyLabel: 'Urgency Staging',
    recSpecialty: 'Recommended Specialty',
    precautionaryMeasures: 'Immediate Precautionary Advisories',
    recommendedAction: 'Care Navigation Summary',
    noHistory: 'No past triage assessments recorded yet. Fill out the form above to start!',
    micActive: 'Listening to symptoms...',
    micTap: 'Tap to speak symptoms',
    speechNotSupported: 'Speech recognition not supported or permission denied.',

    // BMI Main Details
    bmiAssessment: 'Meti-Risk BMI Assessor',
    bmiSub: 'Analyze clinical risk factor correlations based on height/bodyweight ratio index.',
    weightLabel: 'Body Weight (kg/lbs)',
    heightLabel: 'Stature Height (cm/inches)',
    unitMetric: 'Metric Units (kg / cm)',
    unitImperial: 'Imperial Units (lbs / inches)',
    calculateBmi: 'Calculate Body Mass Index',
    resultsBmi: 'Your Personalized BMI Profile',
    bmiCategory: 'Category Label',
    risksAssociated: 'Associated Health Assessment Risks',
    recommendationsBmi: 'Preventative Clinician Advisories',

    // Appointments Main Details
    scheduleOutpatient: 'Bhubaneswar Outpatient Scheduling',
    subSchedule: 'Book real-time clinical outpatient appointments and physical consult chambers with trusted specialists in Odisha.',
    chooseSpecialty: 'Choose Medical Specialty',
    availableDoctors: 'Available Clinical Experts',
    rating: 'Patient Rating',
    experience: 'Clinical Experience',
    selectSlot: 'Select Appointment Date / Slot',
    notesLabel: 'Brief Reason for Outpatient Consultation',
    notesPlaceholder: 'e.g., Routine checking, cardiovascular panel review...',
    bookingCompleted: 'Booking outpatient session...',
    bookSuccess: 'Clinical Chambers Appointment Requested!',
    noDoctorsSpecialty: 'No physicians found for this particular medical specialty.',
    experienceYears: 'years',

    // Common labels
    bhubaneswarDesk: 'Bhubaneswar Clinical Support Desk',
    dobLabel: 'Date of Birth',
    glucoseTab: 'AI Glucose Predictor',
    glucoseDesc: 'Blood glucose curves & macronutrients recommendations',
    glucoseCalculations: 'AI Glucose Spike Calculator',
  },
  hi: {
    // Header & Navigation
    arogyam: 'आरोग्यम',
    healthcarePortal: 'स्वास्थ्य सेवा पोर्टल',
    fullSuite: 'पूर्ण सुइट',
    symptomChecker: 'एआई लक्षण जांचकर्ता',
    bmiRisk: 'बीएमआई जोखिम मूल्यांकन',
    clinicalCalendars: 'चिकित्सा कैलेंडर',
    careFinderMap: 'अस्पताल खोजक नक्शा',
    healthResearchBlog: 'स्वास्थ्य अनुसंधान ब्लॉग',
    clinicalControlDesk: 'चिकित्सा नियंत्रण डेस्क',
    portalAccess: 'पोर्टल साइन-इन',
    logout: 'लॉग आउट',
    active: 'चिकित्सा प्रणालियाँ सक्रिय',
    dismissCheckIn: 'चेक-इन रद्द करें',
    backToHome: 'होम पर वापस जाएं (त्वरित नेविगेशन)',

    // Access Gates
    credentialsRequired: 'रोगी क्रेडेंशियल्स आवश्यक',
    credentialsText: 'हमारे नैदानिक ​​ट्राइएज इंडेक्स से परामर्श करने और अपने लक्षण मूल्यांकन को सहेजने के लिए, कृपया अपनी साख के साथ लॉगिन करें। त्वरित चयन विकल्पों को आज़माएं!',
    signInPortal: 'रोगी पोर्टल में साइन इन करें',
    unlockDoctor: 'डॉक्टर बुकिंग अनलॉक करें',
    unlockDoctorText: 'प्रमाणित नैदानिक ​​कैलेंडर तक पहुंचें, शारीरिक बाह्य रोगी परामर्श की व्यवस्था करें और अपनी प्रोफ़ाइल पंजीकृत करके अपने परिवार के देखभाल लॉग का प्रबंधन करें।',
    accessCareDirs: 'देखभाल निर्देशिकाओं तक पहुंचें',
    clearanceRequired: 'अस्पताल निदेशक मंजूरी आवश्यक',
    clearanceText: 'आप वर्तमान में एक अतिथि या रोगी के रूप में देख रहे हैं। बाह्य रोगी आंकड़े देखने, नियुक्तियों की पुष्टि करने या प्रकोप चार्ट की समीक्षा करने के लिए मंजूरी का उपयोग करें।',
    signInAdmin: 'प्रशासक के रूप में लॉगिन करें',
    returnTriage: 'रोगी लक्षण ट्राइएज पर लौटें',

    // Symptom Checker Main Details
    enterSymptoms: 'लक्षण विश्लेषक',
    describeFeeling: 'आज हम आपको बेहतर महसूस कराने के लिए क्या कर सकते हैं?',
    symptomsPlaceholder: 'वर्णन करें कि आप कैसा महसूस कर रहे हैं (जैसे, सिरदर्द, 2 दिनों से हल्का बुखार, हल्की खांसी)...',
    durationLabel: 'लक्षणों की अवधि',
    durationPlaceholder: 'जैसे, 2 दिन, 1 सप्ताह, आज सुबह से...',
    additionalLabel: 'एलर्जी, पुरानी बीमारियां या चल रही दवाएं',
    additionalPlaceholder: 'जैसे, अस्थमा, पेनिसिलिन एलर्जी, कोई नहीं...',
    clearInputs: 'इनपुट साफ़ करें',
    analyzeNow: 'अभी लक्षणों का विश्लेषण करें',
    pastAssessments: 'पिछले स्वास्थ्य ट्राइएज रिपोर्ट',
    analysisReport: 'नैदानिक ​​अंतर विश्लेषण',
    urgencyLabel: 'तात्कालिकता का स्तर',
    recSpecialty: 'अनुशंसित विशेषज्ञता',
    precautionaryMeasures: 'तत्काल एहतियाती सलाह',
    recommendedAction: 'देखभाल नेविगेशन सारांश',
    noHistory: 'अभी तक कोई पिछला ट्राइएज मूल्यांकन दर्ज नहीं किया गया है। शुरू करने के लिए ऊपर दिया गया फ़ॉर्म भरें!',
    micActive: 'लक्षणों को सुन रहा हूँ...',
    micTap: 'लक्षण बोलने के लिए टैप करें',
    speechNotSupported: 'भाषण पहचान समर्थित नहीं है या अनुमति अस्वीकृत है।',

    // BMI Main Details
    bmiAssessment: 'बीएमआई जोखिम मूल्यांकनकर्ता',
    bmiSub: 'ऊंचाई और शरीर के वजन के अनुपात सूचकांक के आधार पर नैदानिक ​​​​जोखिम कारकों का विश्लेषण करें।',
    weightLabel: 'शरीर का वजन (किलोग्राम / पाउंड)',
    heightLabel: 'कद की ऊंचाई (सेंटीमीटर / इंच)',
    unitMetric: 'मीट्रिक इकाइयाँ (किलोग्राम / सेमी)',
    unitImperial: 'शाही इकाइयाँ (पाउंड / इंच)',
    calculateBmi: 'बॉडी मास इंडेक्स की गणना करें',
    resultsBmi: 'आपका व्यक्तिगत बीएमआई प्रोफ़ाइल',
    bmiCategory: 'श्रेणी का नाम',
    risksAssociated: 'जुड़े नैदानिक ​​जोखिम',
    recommendationsBmi: 'निवारक चिकित्सकीय सलाह',

    // Appointments Main Details
    scheduleOutpatient: 'भुवनेश्वर बाह्य रोगी समय-सारणी',
    subSchedule: 'ओडिशा में विश्वसनीय विशेषज्ञों के साथ वास्तविक समय में नैदानिक ​​बाह्य रोगी नियुक्तियां और शारीरिक परामर्श बुक करें।',
    chooseSpecialty: 'चिकित्सा विशेषता का चयन करें',
    availableDoctors: 'उपलब्ध चिकित्सा विशेषज्ञ',
    rating: 'रोगी रेटिंग',
    experience: 'नैदानिक ​​अनुभव',
    selectSlot: 'नियुक्ति की तारीख / समय चुनें',
    notesLabel: 'परामर्श का संक्षिप्त कारण',
    notesPlaceholder: 'जैसे, नियमित जांच, हृदय पैनल समीक्षा...',
    bookingCompleted: 'बाह्य रोगी सत्र बुक किया जा रहा है...',
    bookSuccess: 'चिकित्सा कक्ष नियुक्ति का अनुरोध किया गया!',
    noDoctorsSpecialty: 'इस विशेष चिकित्सा विशेषता के लिए कोई डॉक्टर नहीं मिला।',
    experienceYears: 'वर्ष',

    // Common labels
    bhubaneswarDesk: 'भुवनेश्वर क्लिनिकल सहायता डेस्क',
    dobLabel: 'जन्म तिथि',
    glucoseTab: 'एआई ग्लूकोज प्रेडिक्टर',
    glucoseDesc: 'ब्लड ग्लूकोज कर्व और मैक्रोन्यूट्रिएंट्स सुझाव',
    glucoseCalculations: 'एआई ग्लूकोज स्पाइक कैलकुलेटर',
  },
  or: {
    // Header & Navigation
    arogyam: 'ଆରୋଗ୍ୟମ',
    healthcarePortal: 'ସ୍ୱାସ୍ଥ୍ୟସେବା ପୋର୍ଟାଲ୍',
    fullSuite: 'ସମ୍ପୂର୍ଣ୍ଣ ସୁଟ୍',
    symptomChecker: 'AI ରୋଗ ଚିହ୍ନଟକାରୀ',
    bmiRisk: 'BMI ବିପଦ ଆକଳନ',
    clinicalCalendars: 'କ୍ଲିନିକାଲ୍ କ୍ୟାଲେଣ୍ଡର',
    careFinderMap: 'ଡାକ୍ତରଖାନା ସନ୍ଧାନକାରୀ ମାନଚିତ୍ର',
    healthResearchBlog: 'ସ୍ୱାସ୍ଥ୍ୟ ଗବେଷଣା ବ୍ଲଗ୍',
    clinicalControlDesk: 'କ୍ଲିନିକାଲ୍ ନିୟନ୍ତ୍ରଣ ଡେସ୍କ',
    portalAccess: 'ପୋର୍ଟାଲ୍ ସାଇନ୍-ଇନ୍',
    logout: 'ଲଗଆଉଟ୍',
    active: 'ଚିକିତ୍ସା ପ୍ରଣାଳୀ ସକ୍ରିୟ',
    dismissCheckIn: 'ଚେକ୍-ଇନ୍ ରଦ୍ଦ କରନ୍ତୁ',
    backToHome: 'ହୋମ୍‌କୁ ଫେରନ୍ତୁ (ଶୀଘ୍ର ନେଭିଗେସନ୍)',

    // Access Gates
    credentialsRequired: 'ରୋଗୀଙ୍କ ପ୍ରମାଣପତ୍ର ଆବଶ୍ୟକ',
    credentialsText: 'ଆମର କ୍ଲିନିକାଲ୍ ଟ୍ରାଇଜ୍ ଇଣ୍ଡେକ୍ସ ସହିତ ପରାମର୍ଶ କରିବା ଏବଂ ଆପଣଙ୍କର ଲକ୍ଷଣ ମୂଲ୍ୟାଙ୍କନକୁ ସଂରକ୍ଷିତ କରିବା ପାଇଁ, ଦୟାକରି ଆପଣଙ୍କର ପ୍ରମାଣପତ୍ର ସହିତ ଲଗ୍ ଇନ୍ କରନ୍ତୁ | ଶୀଘ୍ର ଚୟନ ବିକଳ୍ପ ଚେଷ୍ଟା କରନ୍ତୁ!',
    signInPortal: 'ରୋଗୀ ପୋର୍ଟାଲରେ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ',
    unlockDoctor: 'ଡାକ୍ତର ବୁକିଂ ଖୋଲନ୍ତୁ',
    unlockDoctorText: 'ଆପଣଙ୍କର ପ୍ରୋଫାଇଲ୍ ପଞ୍ଜିକରଣ କରି ସାର୍ଟିଫାଏଡ୍ କ୍ଲିନିକାଲ୍ କ୍ୟାଲେଣ୍ଡରଗୁଡିକ ଆକ୍ସେସ୍ କରନ୍ତୁ, ଶାରୀରିକ ବହିର୍ବିଭାଗ ପରାମର୍ଶର ବ୍ୟବସ୍ଥା କରନ୍ତୁ ଏବଂ ଆପଣଙ୍କ ପରିବାରର ଯତ୍ନ ଲଗ୍ ପରିଚାଳନା କରନ୍ତୁ |',
    accessCareDirs: 'ଚିକିତ୍ସା ନିର୍ଦ୍ଦେଶିକା ଆକ୍ସେସ୍ କରନ୍ତୁ',
    clearanceRequired: 'ଡାକ୍ତରଖାନା ନିର୍ଦ୍ଦେଶକଙ୍କ ଅନୁମତି ଆବଶ୍ୟକ',
    clearanceText: 'ଆପଣ ବର୍ତ୍ତମାନ ଜଣେ ଅତିଥି କିମ୍ବା ରୋଗୀ ଭାବରେ ଦେଖୁଛନ୍ତି। ବହିର୍ବିଭାଗ ପରିସଂଖ୍ୟାନ, ନିଯୁକ୍ତି ନିଶ୍ଚିତକରଣ କିମ୍ବା ରୋଗ ବ୍ୟାପିବା ଚାର୍ଟ ଦେଖିବା ପାଇଁ ପ୍ରଶାସକୀୟ ଅନୁମତି ନିଅନ୍ତୁ।',
    signInAdmin: 'ପ୍ରଶାସକ ଭାବରେ ସାଇନ ଇନ କରନ୍ତୁ',
    returnTriage: 'ରୋଗୀଙ୍କ ରୋଗ ଚିହ୍ନଟକାରୀକୁ ଫେରନ୍ତୁ',

    // Symptom Checker Main Details
    enterSymptoms: 'ରୋଗ ଲକ୍ଷଣ ବିଶ୍ଳେଷଣକାରୀ',
    describeFeeling: 'ଆଜି ଆମେ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ କିପରି ସାହାଯ୍ୟ କରିପାରିବା?',
    symptomsPlaceholder: 'ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି ବର୍ଣ୍ଣନା କରନ୍ତୁ (ଯେପରିକି ମୁଣ୍ଡବିନ୍ଧା, ୨ ଦିନ ଧରି ଜ୍ୱର, ସାମାନ୍ୟ କାଶ)...',
    durationLabel: 'ଲକ୍ଷଣର ଅବଧି',
    durationPlaceholder: 'ଯେପରିକି, ୨ ଦିନ, ୧ ସପ୍ତାହ, ଆଜି ସକାଳୁ...',
    additionalLabel: 'ଆଲର୍ଜି, ପୁରୁଣା ରୋଗ କିମ୍ବା ଚାଲିଥିବା ଔଷଧ',
    additionalPlaceholder: 'ଯେପରିକି, ଆଜମା, ପେନିସିଲିନ୍ ଆଲର୍ଜି, କିଛି ନାହିଁ...',
    clearInputs: 'ତଥ୍ୟ ସଫା କରନ୍ତୁ',
    analyzeNow: 'ବର୍ତ୍ତମାନ ଲକ୍ଷଣ ବିଶ୍ଳେଷଣ କରନ୍ତୁ',
    pastAssessments: 'ପୂର୍ବ ସ୍ୱାସ୍ଥ୍ୟ ଟ୍ରାଇଜ୍ ରିପୋର୍ଟ',
    analysisReport: 'କ୍ଲିନିକାଲ୍ ବିଶ୍ଳେଷଣ ରିପୋର୍ଟ',
    urgencyLabel: 'ଜରୁରୀକାଳୀନତା ସ୍ତର',
    recSpecialty: 'ପରାମର୍ଶିତ ଚିକିତ୍ସା ବିଶେଷଜ୍ଞ',
    precautionaryMeasures: 'ତୁରନ୍ତ ସତର୍ତତାମୂଳକ ପରାମର୍ଶ',
    recommendedAction: 'ସେବା ନିର୍ଦ୍ଦେଶିକା ସାରାଂଶ',
    noHistory: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପୂର୍ବ ରୋଗ ଚିହ୍ନଟ ରିପୋର୍ଟ ନାହିଁ | ଆରମ୍ଭ କରିବାକୁ ଉପରୋକ୍ତ ଫର୍ମ ପୂରଣ କରନ୍ତୁ!',
    micActive: 'ଲକ୍ଷଣ ଶୁଣୁଛି...',
    micTap: 'ଲକ୍ଷଣ କହିବା ପାଇଁ ଟ୍ୟାପ୍ କରନ୍ତୁ',
    speechNotSupported: 'ଏହି ବ୍ରାଉଜରରେ ସ୍ୱର ଚିହ୍ନଟ ସମର୍ଥିତ ନୁହେଁ କିମ୍ବା ଅନୁମତି ମିଳିନାହିଁ ।',

    // BMI Main Details
    bmiAssessment: 'ବିଏମଆଇ ବିପଦ ଆକଳନକାରୀ',
    bmiSub: 'ଉଚ୍ଚତା ଏବଂ ଶାରୀରିକ ଓଜନ ଅନୁପାତ ଆଧାରରେ ସ୍ୱାସ୍ଥ୍ୟଗତ ବିପଦର କ୍ଲିନିକାଲ୍ ଆକଳନ କରନ୍ତୁ।',
    weightLabel: 'ଶରୀରିକ ଓଜନ (କିଲୋଗ୍ରାମ / ପାଉଣ୍ଡ)',
    heightLabel: 'ଉଚ୍ଚତା (ସେଣ୍ଟିମିଟର / ଇଞ୍ଚ)',
    unitMetric: 'ମେଟ୍ରିକ୍ ୟୁନିଟ୍ (କିଲୋଗ୍ରାମ / ସେଣ୍ଟିମିଟର)',
    unitImperial: 'ଇମ୍ପେରିଆଲ୍ ୟୁନିଟ୍ (ପାଉଣ୍ଡ / ଇଞ୍ଚ)',
    calculateBmi: 'Body Mass Index (BMI) ହିସାବ କରନ୍ତୁ',
    resultsBmi: 'ଆପଣଙ୍କର ବ୍ୟକ୍ତିଗତ BMI ବିଶ୍ଳେଷଣ',
    bmiCategory: 'ବର୍ଗ ନାମ',
    risksAssociated: 'ଜଡିତ ସ୍ୱାସ୍ଥ୍ୟଗତ ବିପଦଗୁଡିକ',
    recommendationsBmi: 'ପ୍ରତିଷେଧକ ଚିକିତ୍ସା ପରାମର୍ଶ',

    // Appointments Main Details
    scheduleOutpatient: 'ଭୁବନେଶ୍ୱର ବହିର୍ବିଭାଗ ଚିକିତ୍ସା ସମୟ ନିର୍ଘଣ୍ଟ',
    subSchedule: 'ଓଡ଼ିଶାର ବିଶ୍ୱସ୍ତ ବିଶେଷଜ୍ଞଙ୍କ ସହ ବାସ୍ତବ ସମୟରେ ବହିର୍ବିଭାଗ ନିଯୁକ୍ତି ଏବଂ ସାକ୍ଷାତକାର ବୁକ୍ କରନ୍ତୁ ।',
    chooseSpecialty: 'ଚିକିତ୍ସା ବିଭାଗ ଚୟନ କରନ୍ତୁ',
    availableDoctors: 'ଉପଲବ୍ଧ ଚିକିତ୍ସା ବିଶେଷଜ୍ଞ',
    rating: 'ରୋଗୀଙ୍କ ମୂଲ୍ୟାଙ୍କନ',
    experience: 'ଚିକିତ୍ସା ଅଭିଜ୍ଞତା',
    selectSlot: 'ସାକ୍ଷାତକାର ତାରିଖ / ସମୟ ଚୟନ କରନ୍ତୁ',
    notesLabel: 'ପରାମର୍ଶର ସଂକ୍ଷିପ୍ତ କାରଣ',
    notesPlaceholder: 'ଯେପରିକି, ନିୟମିତ ଯାଞ୍ଚ, ହୃଦୟ ଯାଞ୍ଚ ସମୀକ୍ଷା...',
    bookingCompleted: 'ପଞ୍ଜିକୃତ ହେଉଛି...',
    bookSuccess: 'ସାକ୍ଷାତକାର ପଞ୍ଜିକରଣ ସଫଳ ହେଲା!',
    noDoctorsSpecialty: 'ଏହି ଚିକିତ୍ସା ବିଭାଗ ପାଇଁ କୋଣସି ଡାକ୍ତର ମିଳିଲେ ନାହିଁ।',
    experienceYears: 'ବର୍ଷ',

    // Common labels
    bhubaneswarDesk: 'ଭୁବନେଶ୍ୱର କ୍ଲିନିକାଲ୍ ସହାୟତା ଡେସ୍କ',
    dobLabel: 'ଜନ୍ମ ତାରିଖ',
    glucoseTab: 'AI ଗ୍ଲୁକୋଜ୍ ପ୍ରେଡିକ୍ଟର',
    glucoseDesc: 'ମେଟାବୋଲିକ୍ ଗ୍ଲୁକୋଜ୍ ସ୍ପାଇକ୍ କ୍ୟାଲକୁଲେଟର',
    glucoseCalculations: 'AI ଗ୍ଲୁକୋଜ୍ ପ୍ରତିକ୍ରିୟା ପୂର୍ବାନୁମାନ',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('arogyam-language') as LanguageType) || 'en';
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem('arogyam-language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English if not found
    const enDict = translations['en'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
