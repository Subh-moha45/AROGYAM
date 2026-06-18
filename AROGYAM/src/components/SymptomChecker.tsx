/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Heart, AlertTriangle, Clock, RefreshCw, Sparkles, Send, 
  ChevronRight, Calendar, User, FileText, CheckSquare, Stethoscope, Search,
  Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import { SymptomLog, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SymptomCheckerProps {
  currentUser: UserProfile;
}

export default function SymptomChecker({ currentUser }: SymptomCheckerProps) {
  const { t, language } = useLanguage();
  const [symptomsInput, setSymptomsInput] = useState('');
  const [duration, setDuration] = useState('Few days');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing triage checks...');
  const [activeAnalysis, setActiveAnalysis] = useState<SymptomLog['analysis'] | null>(null);
  const [history, setHistory] = useState<SymptomLog[]>([]);

  // Speech recognition state variables
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  // Voice reader (Text to Speech) state and methods
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown characters for crisp TTS speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/_/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'or') {
      utterance.lang = 'or-IN';
    } else {
      utterance.lang = 'en-US';
    }

    // Set voice volume to maximum level as requested by user
    utterance.volume = 1.0;
    utterance.rate = 0.95; // highly legible clinical pacing

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleReadInput = () => {
    if (!symptomsInput.trim()) {
      speakText(language === 'hi' ? 'कृपया अपनी बीमारी के लक्षण दर्ज करें।' : language === 'or' ? 'ଦୟାକରି ଆପଣଙ୍କର ଲକ୍ଷଣ ଲେଖନ୍ତୁ ଯାହାକୁ ମୁଁ ପଢିପାରିବି।' : 'Please type your symptoms first.');
      return;
    }
    
    let speechText = '';
    if (language === 'hi') {
      speechText = `दर्ज किए गए लक्षण: ${symptomsInput}. लक्षण की अवधि: ${duration}. क्रोनिक स्थिति: ${additionalInfo || 'कोई नहीं'}.`;
    } else if (language === 'or') {
      speechText = `ଲେଖାଯାଇଥିବା ଲକ୍ଷଣଗୁଡିକ: ${symptomsInput}. ଏହାର ଅବଧି: ${duration}. ପୁରୁଣା ରୋଗ: ${additionalInfo || 'କିଛି ନାହିଁ'}.`;
    } else {
      speechText = `Entered symptoms say: ${symptomsInput}. Duration of symptoms is ${duration}. Additional medical context: ${additionalInfo || 'None specified'}.`;
    }
    
    speakText(speechText);
  };

  const handleReadReport = () => {
    if (!activeAnalysis) return;
    
    let reportText = '';
    if (language === 'or') {
      reportText = `ଚିକିତ୍ସା ମୂଲ୍ୟାଙ୍କନ ରିପୋର୍ଟ। ଜରୁରୀକାଳୀନତା ସ୍ତର: ${activeAnalysis.urgency}। `;
      reportText += `ସମ୍ଭାବ୍ୟ ରୋଗଗୁଡିକ: `;
      activeAnalysis.possibleConditions.forEach(cond => {
        reportText += `${cond.name}। ${cond.explanation}। `;
      });
      reportText += `ପ୍ରସ୍ତାବିତ ପରାମର୍ଶ: `;
      activeAnalysis.precautionaryMeasures.forEach(m => {
        reportText += `${m}। `;
      });
      reportText += `ଚିକିତ୍ସା ସେବା ନିର୍ଦ୍ଦେଶିକା: ${activeAnalysis.recommendedAction}। ପ୍ରସ୍ତାବିତ ଡାକ୍ତରୀ ବିଭାଗ: ${activeAnalysis.recommendedSpecialty}।`;
    } else if (language === 'hi') {
      reportText = `नैदानिक विश्लेषण रिपोर्ट। तात्कालिकता स्तर: ${activeAnalysis.urgency}। `;
      reportText += `संभावित बीमारी: `;
      activeAnalysis.possibleConditions.forEach(cond => {
        reportText += `${cond.name}। ${cond.explanation}। `;
      });
      reportText += `अनुशंसित सावधानियां: `;
      activeAnalysis.precautionaryMeasures.forEach(m => {
        reportText += `${m}। `;
      });
      reportText += `देखभाल मार्गदर्शन: ${activeAnalysis.recommendedAction}। अनुशंसित डाक्टरी विशेषता: ${activeAnalysis.recommendedSpecialty}।`;
    } else {
      reportText = `Clinical triage evaluation report. Urgency status is ${activeAnalysis.urgency}. `;
      reportText += `Possible mapped conditions are: `;
      activeAnalysis.possibleConditions.forEach(cond => {
        reportText += `${cond.name} with ${cond.probability} probability. ${cond.explanation}. `;
      });
      reportText += `Recommended self-care measures are: `;
      activeAnalysis.precautionaryMeasures.forEach(m => {
        reportText += `${m}. `;
      });
      reportText += `Care referral summary: ${activeAnalysis.recommendedAction}. Recommended medical specialty is ${activeAnalysis.recommendedSpecialty}.`;
    }

    speakText(reportText);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSymptomsInput(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}.` : `${transcript}.`;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access denied. Please permit mic access in your browser/iframe settings.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please speak clearly into your microphone.');
        } else {
          setSpeechError(`Speech error detected: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      setSpeechError(null);
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  // Rotating loading messages
  useEffect(() => {
    if (!isLoading) return;
    const messages = [
      'Deconstructing symptom descriptors...',
      'Excluding coronary and neurological acute stressors...',
      'Mapping clinical differential databases...',
      'Structuring self-care and supportive advice parameters...',
      'Generating professional clinical care summaries...'
    ];
    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 400);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Load history from API for current user
  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/symptom-logs?email=${encodeURIComponent(currentUser.email)}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error loading symptoms logs:", error);
    }
  };

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;

    setIsLoading(true);
    setLoadingMessage('Initializing triage checks...');

    try {
      const payload = {
        symptoms: symptomsInput,
        duration,
        additionalInfo,
        userDemographics: {
          age: currentUser.age,
          gender: currentUser.gender,
          allergies: currentUser.allergies,
          chronicConditions: currentUser.chronicConditions
        }
      };

      const response = await fetch('/api/gemini/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Symptom triage request failed');
      }

      const analysisRaw = await response.json();
      
      // Complete log item
      const logItem: SymptomLog = {
        id: `logs-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        symptoms: symptomsInput,
        duration,
        additionalInfo: additionalInfo || 'None provided',
        analysis: analysisRaw,
        createdAt: new Date().toISOString()
      };

      // Save log to local persistent state on server
      await fetch('/api/symptom-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logItem)
      });

      setActiveAnalysis(analysisRaw);
      setHistory(prev => [logItem, ...prev]);

    } catch (error) {
      console.error("Symptom analysis error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearActiveAnalysis = () => {
    setSymptomsInput('');
    setAdditionalInfo('');
    setDuration('Few days');
    setActiveAnalysis(null);
  };

  const getUrgencyBadge = (urgency: SymptomLog['analysis']['urgency']) => {
    switch (urgency) {
      case 'Emergency':
        return 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse font-bold';
      case 'Urgent':
        return 'bg-amber-100 border-amber-300 text-amber-700 font-bold';
      default:
        return 'bg-emerald-100 border-emerald-300 text-emerald-700 font-bold';
    }
  };

  const selectHistoryItem = (item: SymptomLog) => {
    setSymptomsInput(item.symptoms);
    setDuration(item.duration);
    setAdditionalInfo(item.additionalInfo || '');
    setActiveAnalysis(item.analysis);
  };

  return (
    <div id="symptom-checker" className="space-y-6">
      
      {/* Disclaimer banner */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 flex gap-3 text-amber-900 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Automated Clinical Disclaimer</p>
          <p className="text-amber-800 leading-relaxed">
            The information provided by this automated triage platform is for <strong>educational and informational purposes only</strong> and is not a substitute for professional medical counsel, physical diagnoses, or physician-directed medication pathways. 
            If you are experiencing acute shortness of breath, severe chest pressure, sudden hemiplegia, or any other life-threatening medical situation, immediately call emergency services (911) or visit the nearest emergency facility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Inputs/Results Form */}
        <div className="lg:col-span-8 space-y-6">
          
          {!activeAnalysis && !isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{t('enterSymptoms')}</h3>
                  <p className="text-xs text-slate-450 mt-0.5">
                    {t('describeFeeling')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleTriage} className="space-y-4">
                
                {/* Active user details card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Patient Profile: <strong>{currentUser.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 font-medium text-slate-500">
                    <span>Age: <strong>{currentUser.age} yrs</strong></span>
                    <span>Gender: <strong>{currentUser.gender}</strong></span>
                    {currentUser.allergies && <span>Allergies: <strong className="text-amber-600">{currentUser.allergies}</strong></span>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 animate-fade-in" htmlFor="symptoms-entry">
                      {t('enterSymptoms')}
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Voice Reader (TTS) Speaker Button */}
                      <button
                        id="symptoms-read-aloud-btn"
                        type="button"
                        onClick={handleReadInput}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSpeaking 
                            ? 'bg-cyan-500 text-white border-cyan-400 animate-pulse'
                            : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                        title={isSpeaking ? "Stop Speaking" : "Read Symptoms Aloud"}
                      >
                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{isSpeaking ? "Stop" : "Read Aloud"}</span>
                      </button>

                      {isSpeechSupported && (
                        <button
                          id="speech-mic-trigger"
                          type="button"
                          onClick={toggleListening}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isListening 
                              ? 'bg-red-500 hover:bg-red-610 text-white animate-pulse'
                              : 'bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-450 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-150 dark:border-teal-900/60'
                          }`}
                          title={isListening ? 'Stop Listening' : t('micTap')}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="w-3.5 h-3.5" />
                              <span>{t('micActive')}</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5" />
                              <span>{t('micTap')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    id="symptoms-entry"
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    placeholder={t('symptomsPlaceholder')}
                    rows={4}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                    required
                  ></textarea>
                  
                  {/* Speech status information / errors */}
                  {isListening && (
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 animate-pulse font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                      Speak now — we are recording your voice into text...
                    </p>
                  )}
                  {speechError && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 font-semibold">
                      {speechError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1" htmlFor="symptoms-duration">{t('durationLabel')}</label>
                    <select
                      id="symptoms-duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-slate-900"
                    >
                      <option value="Few hours">Few hours</option>
                      <option value="24 hours">24 hours</option>
                      <option value="Few days">Few days</option>
                      <option value="More than a week">More than a week</option>
                      <option value="Couple of weeks">Couple of weeks</option>
                      <option value="Months / Chronic">Months / Chronic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 dark:text-slate-400 mb-1" htmlFor="symptoms-info">{t('additionalLabel')}</label>
                    <input
                      id="symptoms-info"
                      type="text"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder={t('additionalPlaceholder')}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <button
                  id="triage-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold rounded-xl hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t('analyzeNow')}
                </button>

              </form>

            </div>
          ) : isLoading ? (
            /* Rotating clinical loading state card */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-16 flex flex-col items-center justify-center text-center space-y-4 min-h-[350px]">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin"></div>
                <Heart className="w-6 h-6 text-teal-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-base">Processing Clinical Assessment</p>
                <p className="text-xs text-slate-500 animate-pulse">{loadingMessage}</p>
              </div>
            </div>
          ) : (
            /* Results Presentation */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                    Clinical Triage Evaluation
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Differential suggestions returned based on patient parameters.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="report-read-aloud-btn"
                    onClick={handleReadReport}
                    className={`px-3.5 py-1.5 border text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSpeaking
                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-400 animate-pulse'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-900'
                    }`}
                    title={isSpeaking ? "Stop Reading Report" : "Read Full Diagnostic Assessment Report Out Loud"}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
                  </button>

                  <button
                    id="clear-analysis-btn"
                    onClick={clearActiveAnalysis}
                    className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 bg-white dark:bg-slate-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Run New Check
                  </button>
                </div>
              </div>

              {/* Urgency indicators card */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">CLINICAL TRIAGE TIER</span>
                  <p className="text-sm font-bold text-slate-800">Assessment Urgency Status</p>
                </div>
                <div className={`px-4 py-1 border rounded-full text-xs ${getUrgencyBadge(activeAnalysis!.urgency)}`}>
                  {activeAnalysis!.urgency} Priority
                </div>
              </div>

              {/* Diagnostics Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Possible Mapped Conditions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAnalysis!.possibleConditions.map((cond, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-sm text-slate-800 leading-tight block">{cond.name}</strong>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          cond.probability === 'High' ? 'bg-rose-50 border-rose-250 text-rose-700' :
                          cond.probability === 'Medium' ? 'bg-amber-50 border-amber-250 text-amber-700' :
                          'bg-sky-50 border-sky-250 text-sky-700'
                        }`}>
                          {cond.probability} Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {cond.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Self-care advice */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
                
                {/* Precautionary list */}
                <div className="md:col-span-7 bg-teal-50/20 border border-teal-500/10 p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-teal-850 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-teal-600" />
                    Recommended Self-Care measures
                  </h4>
                  <ul className="space-y-2">
                    {activeAnalysis!.precautionaryMeasures.map((measure, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 shrink-0"></span>
                        <span>{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Professional Guidance */}
                <div className="md:col-span-5 bg-cyan-50/20 border border-cyan-500/10 p-5 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-cyan-850 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-cyan-600" />
                      Care Referral Routing
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {activeAnalysis!.recommendedAction}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-cyan-200/50 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-semibold text-cyan-800 uppercase block">RECOMMENDED SPECIALIST</span>
                      <strong className="text-xs text-slate-800 font-bold block mt-0.5">{activeAnalysis!.recommendedSpecialty}</strong>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0" />
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Right Logs History Sidecar */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Symptom Records
            </h4>
            <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-550 bg-slate-150 rounded-full">
              {history.length} Saved
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slate-600">No triage history</p>
              <p className="text-[10px] text-slate-405 leading-normal">Your saved evaluations will appear in this sidebar.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectHistoryItem(item)}
                  className="p-3 bg-slate-50/55 hover:bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer text-left transition-all hover:shadow-xs space-y-2 group"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-medium text-slate-450 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border scale-95 font-bold ${
                      item.analysis.urgency === 'Emergency' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                      item.analysis.urgency === 'Urgent' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      'bg-emerald-50 border-emerald-200 text-emerald-600'
                    }`}>
                      {item.analysis.urgency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-semibold line-clamp-1 group-hover:text-teal-650">
                    "{item.symptoms}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-450 border-t border-slate-100 pt-1.5">
                    <span>Duration: {item.duration}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">Details &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
