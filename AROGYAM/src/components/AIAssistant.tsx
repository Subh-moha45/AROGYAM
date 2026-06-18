/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Sparkles, Bot, User, 
  ArrowRight, Heart, MapPin, Calendar, Activity 
} from 'lucide-react';
// @ts-ignore
import chatbotAvatar from '../assets/images/arogyam_hospital_logo_1781523240933.jpg';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface AIAssistantProps {
  onChangeTab: (tab: 'symptoms' | 'bmi' | 'appointments' | 'care' | 'blog' | 'admin') => void;
}

export default function AIAssistant({ onChangeTab }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckInCompleted, setIsCheckInCompleted] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your **VeraMedica AI Assistant**. I can help you evaluate physical symptoms, understand Bhubaneswar hospital locations, compute BMI parameters, or guide you through scheduling appointment panels with our physicians. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to lowest chat line
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.text,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error("Chat server error");
      }
    } catch (err) {
      console.error("AI Assistant response loop error:", err);
      // Fallback response inside client if server loop fails
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: "I am having transient response lag. For direct support, you can explore the **Symptom Checker** or call clinical centers in Sijua or Khandagiri directly.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseBoldText = (text: string) => {
    // Basic bold parsing inside widget text body: **text**
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part}</strong>;
      }
      return part;
    });
  };

  const suggestions = [
    { text: "How do I schedule an appointment?", Action: () => handleSendMessage("How do I book an appointment?") },
    { text: "Where are hospitals in Bhubaneswar?", Action: () => handleSendMessage("Where are the nearest hospitals in Bhubaneswar?") },
    { text: "Go to Symptom Checker", Action: () => { onChangeTab('symptoms'); setIsOpen(false); } },
    { text: "Check Clinics on Map", Action: () => { onChangeTab('care'); setIsOpen(false); } }
  ];

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    
    const customText = `Welcome, **${patientName.trim()}**! I have successfully registered your clinical companion care session with contact number **${phoneNumber || 'N/A'}**.

Our 24/7 Bhubaneswar help desk (supporting **AIIMS Bhubaneswar**, **AMRI Hospitals**, and **Apollo Hospitals**) is ready. Ask me any symptoms, care map range checks, or local doctor bookings. How can I help you today?`;

    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: customText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsCheckInCompleted(true);
    setIsOpen(true);
  };

  const handleSkipCheckIn = () => {
    setPatientName('Guest Patient');
    setPhoneNumber('');
    const customText = "Welcome! I have initialized an anonymous digital clinical session. Ask me any symptoms, Bhubaneswar hospital directions, physical BMI calculations, or Specialist booking guide queries!";
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: customText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsCheckInCompleted(true);
    setIsOpen(true);
  };

  const handleReCheckIn = () => {
    setIsCheckInCompleted(false);
    setIsOpen(false);
    setPatientName('');
    setPhoneNumber('');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {!isCheckInCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-3xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Outer decorative ambient glows */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header section with brand avatar icon */}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full mx-auto p-1 bg-gradient-to-tr from-teal-500 via-cyan-500 to-teal-750 shadow-xl overflow-hidden">
                    <img 
                      src={chatbotAvatar} 
                      alt="Arogyam Assistant Icon" 
                      className="w-full h-full object-cover rounded-full bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="absolute bottom-1 right-1 bg-teal-600 border-2 border-white dark:border-slate-900 text-white p-1.5 rounded-full shadow-md animate-bounce">
                    <Sparkles className="w-4 h-4 text-white" />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm sm:text-base text-slate-950 dark:text-white font-black tracking-wider uppercase">
                    Arogyam Smart Clinical Gate
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                    Please log in with a nickname and select your primary health focus to initialize your customized clinical care companion.
                  </p>
                </div>
              </div>

              {/* Check-In Submission Form */}
              <form onSubmit={handleCheckInSubmit} className="mt-8 space-y-5 relative">
                <div className="space-y-1 text-left">
                  <label htmlFor="patient-name-field" className="text-[10.5px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                    Patient Name / Nickname
                  </label>
                  <input
                    id="patient-name-field"
                    type="text"
                    required
                    placeholder="e.g. Subhransu Mohapatra"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label htmlFor="patient-phone-field" className="text-[10.5px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                    Phone Number
                  </label>
                  <input
                    id="patient-phone-field"
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-teal-500/10 transition duration-200 active:scale-98 tracking-widest uppercase cursor-pointer"
                >
                  Confirm Check-In & Enter
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSkipCheckIn}
                    className="text-[10px] text-slate-405 dark:text-slate-500 hover:text-teal-650 dark:hover:text-teal-450 font-black tracking-widest uppercase transition underline cursor-pointer"
                  >
                    Proceed as anonymous guest
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isOpen && isCheckInCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-20 left-0 w-92 sm:w-100 h-[520px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Widget Main Header */}
            <div className="bg-gradient-to-r from-teal-700 to-cyan-700 px-4 py-4 flex items-center justify-between text-white shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border border-white/30 select-none">
                  <img 
                    src={chatbotAvatar} 
                    alt="Arogyam Companion Icon" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-[13px] tracking-wider uppercase leading-none">Arogyam Assistant</h4>
                  <span className="text-[10px] text-teal-100 font-bold block mt-1 tracking-widest uppercase">Verified Clinical Aide</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReCheckIn}
                  className="px-2 py-1 text-[9px] uppercase font-bold tracking-widest bg-white/10 hover:bg-white/20 text-teal-50 border border-white/20 rounded-md transition-all cursor-pointer hover:text-white"
                  title="Switch patient registration credentials"
                  id="reset-clinical-session-btn"
                >
                  Switch Patient
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/15 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-white"
                  title="Minimize Drawer"
                  id="close-ai-chatbot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Warning advisory line */}
            <div className="bg-slate-50 dark:bg-slate-905 border-b border-slate-150 dark:border-slate-850 px-3.5 py-1 text-center shrink-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3 text-red-500 shrink-0 animate-pulse fill-red-500" />
                Arogyam Smart Desk • Informational Triage
              </p>
            </div>

            {/* Message Chat Room Content Staging */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-910">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex gap-2.5 items-start ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Chat Avatar Bubble */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-3xs border select-none flex items-center justify-center ${
                    msg.sender === 'user' 
                      ? 'bg-slate-200 border-slate-300 text-slate-800 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-200' 
                      : 'bg-teal-600/10 border-teal-550/15'
                  }`}>
                    {msg.sender === 'user' ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <img 
                        src={chatbotAvatar} 
                        alt="Bot Avatar" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  <div className="space-y-1 max-w-[80%] text-left">
                    <div className={`p-3 rounded-2xl text-[12.5px] leading-relaxed shadow-3xs font-medium relative ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-teal-650 to-teal-700 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-150 dark:border-slate-850/60'
                    }`}>
                      <p className="whitespace-pre-line font-normal text-xs sm:text-[12.5px]">
                        {parseBoldText(msg.text)}
                      </p>
                    </div>
                    <span className={`text-[9px] text-slate-400 dark:text-slate-500 font-bold block ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-start flex-row animate-pulse">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-600/10 border border-teal-550/15 flex items-center justify-center shrink-0">
                    <img 
                      src={chatbotAvatar} 
                      alt="Thinking" 
                      className="w-full h-full object-cover animate-pulse" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none border border-slate-150 dark:border-slate-850/60 shadow-3xs flex gap-1 items-center justify-center h-8.5 max-w-[50px]">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestions Drawer */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-850 shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={sug.Action}
                    className="shrink-0 px-3 py-1.5 bg-slate-50 hover:bg-teal-50 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 rounded-full text-[11px] font-extrabold transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    {sug.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Inputs Footer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="p-3 bg-slate-50 dark:bg-slate-905 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                id="chatbot-msg-input-field"
                type="text"
                placeholder="Ask about clinical appointments, care maps..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-[12.5px] rounded-xl outline-none text-slate-800 dark:text-slate-100 disabled:opacity-60 focus:border-teal-500 font-semibold"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition-all active:scale-90 disabled:opacity-40 disabled:scale-100 shrink-0 cursor-pointer flex items-center justify-center border border-teal-500/10"
                id="chatbot-submit"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Bubble Button */}
      {isCheckInCompleted && (
        <button
          id="ai-chatbot-trigger-bubble"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer border select-none ${
            isOpen 
              ? 'p-4 bg-slate-900 border-slate-800 text-slate-200 rotate-90' 
              : 'p-1 bg-gradient-to-br from-teal-600 via-teal-750 to-cyan-600 border-teal-500/35 hover:from-teal-500 hover:to-cyan-500 text-white animate-bounce'
          }`}
          title="VeraMedica AI Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-md">
                <img 
                  src={chatbotAvatar} 
                  alt="Arogyam Assistant Icon" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Sparkles indicator tag at bottom-right */}
              <span className="absolute -bottom-1 -right-1 bg-teal-500 border border-white dark:border-slate-900 text-white p-1 rounded-full shadow-sm animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              {/* Pulsating badge indicator at top-right */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
              </span>
            </div>
          )}
        </button>
      )}
    </div>
  );
}
