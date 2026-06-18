/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Activity, Dumbbell, ShieldAlert, CheckCircle, Apple, RefreshCw } from 'lucide-react';

export default function BmiCalculator() {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState<number>(70); // kg or lbs
  const [height, setHeight] = useState<number>(175); // cm or inches
  
  // States specifically for custom imperial entry separate from metric to make switching feel premium
  const [weightImp, setWeightImp] = useState<number>(154); // lbs
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(9);

  const [bmi, setBmi] = useState<number>(22.9);
  const [category, setCategory] = useState<string>('Normal');
  const [colorClass, setColorClass] = useState<string>('text-emerald-600 bg-emerald-50 border-emerald-200');
  const [progressPercent, setProgressPercent] = useState<number>(50); // Percent position on gauge (approx 15 to 40 scale)

  // Recalculate BMI when values change
  useEffect(() => {
    let computedBmi = 22.9;
    if (unit === 'metric') {
      if (height > 0) {
        computedBmi = weight / ((height / 100) * (height / 100));
      }
    } else {
      const totalInches = (heightFeet * 12) + heightInches;
      if (totalInches > 0) {
        computedBmi = (weightImp / (totalInches * totalInches)) * 703;
      }
    }
    
    // Safety guard
    if (isNaN(computedBmi) || !isFinite(computedBmi)) computedBmi = 0;
    
    computedBmi = Math.round(computedBmi * 10) / 10;
    setBmi(computedBmi);

    // Mapped classification categories
    let cat = 'Normal';
    let col = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    let progress = 50;

    if (computedBmi < 18.5) {
      cat = 'Underweight';
      col = 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/40';
      // Map < 18.5 to 0-30% on bar
      progress = Math.min(Math.max((computedBmi / 18.5) * 30, 5), 30);
    } else if (computedBmi >= 18.5 && computedBmi < 25) {
      cat = 'Normal Weight';
      col = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40';
      // Map 18.5 to 25 to 30%-60%
      progress = 30 + ((computedBmi - 18.5) / (25 - 18.5)) * 30;
    } else if (computedBmi >= 25 && computedBmi < 30) {
      cat = 'Overweight';
      col = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40';
      // Map 25 to 30 to 60%-80%
      progress = 60 + ((computedBmi - 25) / (30 - 25)) * 20;
    } else {
      cat = 'Obese';
      col = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40';
      // Map 30 to 45 to 80%-100%
      progress = 80 + Math.min(((computedBmi - 30) / 15) * 20, 20);
    }

    setCategory(cat);
    setColorClass(col);
    setProgressPercent(Math.min(Math.max(progress, 0), 100));
  }, [unit, weight, height, weightImp, heightFeet, heightInches]);

  const handleReset = () => {
    setWeight(70);
    setHeight(175);
    setWeightImp(154);
    setHeightFeet(5);
    setHeightInches(9);
  };

  // Helper lists supporting dynamic wellness guides mapped to the categories
  const getInsights = () => {
    switch (category) {
      case 'Underweight':
        return {
          risks: 'Nutrient deficiencies, elevated susceptibility to systemic disease, bone density deterioration, persistent lethargy.',
          diet: [
            'Increase high-density complex foods (avocados, nuts, seeds, nut butters).',
            'Integrate lean proteins (chicken breast, eggs, tofu) to rebuild lean mass.',
            'Consume smaller, more frequent meals (5-6 times daily) with high nutrient caps.'
          ],
          exercise: 'Prioritize progressive weight loads or bodyweight resistance training (calisthenics) 3 times weekly to gain physical alignment. Avoid hyper-intensive prolonged cardio.'
        };
      case 'Normal Weight':
        return {
          risks: 'Minimal weight-related risks. Keep screening for body fat distribution percentages.',
          diet: [
            'Maintain nutrient diversity using organic whole grains, greens, and lean fish.',
            'Moderate direct processed sugar and hydrogenated trans fats intake.',
            'Balance carbohydrates with high-fiber ingredients (chia, legumes, oats).'
          ],
          exercise: 'Engage in at least 150 minutes of structured aerobic physical activity per week, paired with functional muscle strengthening on alternate days.'
        };
      case 'Overweight':
        return {
          risks: 'Mild elevations in cardiovascular strain, elevated systemic inflammation markers, and potential pre-diabetic insulin patterns.',
          diet: [
            'Aim for a small caloric deficit (~300-500 kcal below daily maintenance).',
            'Substitute processed snacks with fresh dark berries or crisp high-fiber vegetables.',
            'Drink 500ml of fresh water 30 minutes prior to eating to aid satiety.'
          ],
          exercise: 'Incorporate brisk power walking, swimming, or moderate cardiovascular cycling (30-45 mins per day) to establish consistent, healthy fat burning cycles.'
        };
      default: // Obese
        return {
          risks: 'Elevated risks of Type 2 Diabetes, hypertension, coronary arterial stress, osteoarthritis, and obstructive sleep apnea.',
          diet: [
            'Adopt a structured low-glycemic, high-protein clinical meal rhythm.',
            'Cut all simple sugars, sweet carbonated soft drinks, and refined pastries completely.',
            'Increase dietary soluble fibers extensively to lower LDL cholesterol parameters.'
          ],
          exercise: 'Begin with low-impact joint-safe exercises (underwater water aerobics, rowing, elliptical trainers) to burn calories without stressing mechanical knees or vertebrae.'
        };
    }
  };

  const insights = getInsights();

  return (
    <div id="bmi-calculator" className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800/80 p-6 space-y-6">
      
      {/* Upper Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600 animate-pulse" />
            Clinical BMI Assessment
          </h2>
          <p className="text-xs text-slate-650 dark:text-slate-250 mt-1 font-semibold">
            Calculate your Body Mass Index (BMI) to understand your weight-to-height ratio according to clinical categories.
          </p>
        </div>

        {/* Units Tabs */}
        <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg self-start">
          <button
            id="bmi-unit-metric"
            onClick={() => setUnit('metric')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-md transition-all ${unit === 'metric' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-750'}`}
          >
            Metric (kg/cm)
          </button>
          <button
            id="bmi-unit-imperial"
            onClick={() => setUnit('imperial')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-md transition-all ${unit === 'imperial' ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-750'}`}
          >
            Imperial (lbs/in)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left inputs */}
        <div className="lg:col-span-5 space-y-5 bg-slate-50/50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          
          {unit === 'metric' ? (
            <>
              {/* Metric Height Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="height-range" className="text-xs font-extrabold text-slate-850 dark:text-slate-100">Height (cm)</label>
                  <span className="text-sm font-black text-teal-700 dark:text-teal-300">{height} cm</span>
                </div>
                <input
                  id="height-range"
                  type="range"
                  min="100"
                  max="220"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-650"
                />
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold mt-1">
                  <span>100 cm</span>
                  <span>160 cm</span>
                  <span>220 cm</span>
                </div>
              </div>

              {/* Metric Weight Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="weight-range" className="text-xs font-extrabold text-slate-850 dark:text-slate-100">Weight (kg)</label>
                  <span className="text-sm font-black text-teal-700 dark:text-teal-300">{weight} kg</span>
                </div>
                <input
                  id="weight-range"
                  type="range"
                  min="30"
                  max="150"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-650"
                />
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold mt-1">
                  <span>30 kg</span>
                  <span>90 kg</span>
                  <span>150 kg</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Imperial Height Inputs */}
              <div>
                <label className="block text-xs font-extrabold text-slate-850 dark:text-slate-100 mb-1" htmlFor="height-feet">Height</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      id="height-feet"
                      type="number"
                      min="3"
                      max="8"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-slate-250 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-600 dark:text-slate-300 font-bold">ft</span>
                  </div>
                  <div className="relative">
                    <input
                      id="height-inches"
                      type="number"
                      min="0"
                      max="11"
                      value={heightInches}
                      onChange={(e) => setHeightInches(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-slate-250 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-600 dark:text-slate-300 font-bold">in</span>
                  </div>
                </div>
              </div>

              {/* Imperial Weight Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="weight-imp-input" className="text-xs font-extrabold text-slate-850 dark:text-slate-100">Weight (lbs)</label>
                  <span className="text-sm font-black text-teal-700 dark:text-teal-300">{weightImp} lbs</span>
                </div>
                <input
                  id="weight-imp-input"
                  type="range"
                  min="60"
                  max="330"
                  value={weightImp}
                  onChange={(e) => setWeightImp(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-650"
                />
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold mt-1">
                  <span>60 lbs</span>
                  <span>195 lbs</span>
                  <span>330 lbs</span>
                </div>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              id="bmi-reset-btn"
              onClick={handleReset}
              className="flex-1 py-1.5 px-3 flex items-center justify-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Inputs
            </button>
          </div>
        </div>

        {/* Right metrics and gauge */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/40 dark:bg-slate-950/40 p-6 rounded-xl border border-slate-100 dark:border-slate-800/80">
            {/* Circle Score */}
            <div className="w-32 h-32 rounded-full border-4 border-teal-500/10 dark:border-teal-500/20 flex flex-col items-center justify-center p-3 text-center bg-white dark:bg-slate-800 shadow-xs shrink-0">
              <span className="text-xs font-bold text-slate-605 dark:text-slate-350 tracking-wider uppercase">Your BMI</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">{bmi}</span>
              <span className="text-[11px] text-slate-550 dark:text-slate-400 font-semibold mt-0.5">{unit === 'metric' ? 'kg/m²' : 'lbs/in²'}</span>
            </div>

            {/* Scale Gauge Bar */}
            <div className="flex-1 w-full space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-750 dark:text-slate-200 font-black uppercase tracking-wider">HEALTH SCORE STATUS</span>
                <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full border ${colorClass}`}>
                  {category}
                </span>
              </div>

              {/* Progress visual */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-visible">
                  {/* Underweight indicator range */}
                  <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-sky-205 dark:bg-sky-900/40 hover:bg-sky-305 transition-colors rounded-l-full cursor-help" title="Underweight (< 18.5)"></div>
                  {/* Normal indicator range */}
                  <div className="absolute left-[30%] top-0 bottom-0 w-[30%] bg-emerald-205 dark:bg-emerald-900/40 hover:bg-emerald-305 transition-colors cursor-help" title="Normal Healthy (18.5 - 24.9)"></div>
                  {/* Overweight range */}
                  <div className="absolute left-[60%] top-0 bottom-0 w-[20%] bg-amber-205 dark:bg-amber-900/40 hover:bg-amber-305 transition-colors cursor-help" title="Overweight (25.0 - 29.9)"></div>
                  {/* Obese range */}
                  <div className="absolute left-[80%] top-0 bottom-0 w-[20%] bg-rose-205 dark:bg-rose-900/40 hover:bg-rose-305 transition-colors rounded-r-full cursor-help" title="Obese (>= 30.0)"></div>
                  
                  {/* Pointer Pin representing computed position */}
                  <div 
                    id="bmi-pointer"
                    className="absolute top-1/2 -mt-2.5 -ml-1.5 w-3 h-5 bg-slate-800 dark:bg-slate-200 rounded-full border-2 border-white dark:border-slate-805 shadow-sm transition-all duration-300 ease-out cursor-grab"
                    style={{ left: `${progressPercent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] font-bold pt-1 px-1">
                  <span className="text-sky-700 dark:text-sky-305">Underweight</span>
                  <span className="text-emerald-700 dark:text-emerald-305 font-extrabold">Normal</span>
                  <span className="text-amber-750 dark:text-amber-305">Overweight</span>
                  <span className="text-rose-700 dark:text-rose-305">Obese</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic insights cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Diet recommendations */}
            <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                <Apple className="w-4 h-5 text-teal-600 dark:text-teal-400" />
                Dietary Nutritional Guide
              </h4>
              <ul className="space-y-1.55">
                {insights.diet.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-755 dark:text-slate-200 flex items-start gap-1.5 leading-relaxed font-bold">
                    <span className="inline-block w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Physical Training */}
            <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-5 text-cyan-600 dark:text-cyan-400" />
                Physical Activity Recommendation
              </h4>
              <p className="text-xs text-slate-755 dark:text-slate-200 leading-relaxed font-bold">
                {insights.exercise}
              </p>
              
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <p className="text-[11px] text-slate-750 dark:text-slate-200 font-extrabold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  Clinical Risk Profile:
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-normal font-bold">
                  {insights.risks}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
