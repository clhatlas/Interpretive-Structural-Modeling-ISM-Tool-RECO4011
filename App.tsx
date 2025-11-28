import React, { useState, useEffect } from 'react';
import { AppStep, ISMElement, SSIMData, ISMResult } from './types';
import FactorInput from './components/FactorInput';
import SSIMGrid from './components/SSIMGrid';
import ResultsView from './components/ResultsView';
import { runISMAnalysis } from './services/ismLogic';
import { HardHat, Wand2 } from 'lucide-react';

// Fixed 11 factors based on the Sustainability Barriers input
const FIXED_FACTORS: ISMElement[] = [
  { id: 'F1', name: 'F1', description: 'Lack of commitment from top management', category: 'Management' },
  { id: 'F2', name: 'F2', description: 'Financial Constraints', category: 'Cost' },
  { id: 'F3', name: 'F3', description: 'Organizational culture inhibitive to sustainability/CSR', category: 'Organization' },
  { id: 'F4', name: 'F4', description: 'Lack of new technology/materials and processes on sustainability', category: 'Technology' },
  { id: 'F5', name: 'F5', description: 'Lack of awareness of benefits of sustainability', category: 'Knowledge' },
  { id: 'F6', name: 'F6', description: 'Lack of green purchasing', category: 'Process' },
  { id: 'F7', name: 'F7', description: 'Lack of regulations and enforcement of environment standards', category: 'Policy' },
  { id: 'F8', name: 'F8', description: 'Lack of R&D on sustainability', category: 'Technology' },
  { id: 'F9', name: 'F9', description: 'Lack of training/human expertise on sustainability', category: 'Knowledge' },
  { id: 'F10', name: 'F10', description: 'Resistance to change and adopting innovation in sustainability', category: 'Organization' },
  { id: 'F11', name: 'F11', description: 'Lack of performance metrics/evaluation standards on sustainability', category: 'Process' },
];

const FIXED_TOPIC = "Barriers to Sustainability Implementation";

const App: React.FC = () => {
  // Initialize directly to Factor Definition step with fixed data
  const [step, setStep] = useState<AppStep>(AppStep.DEFINE_FACTORS);
  const [topic] = useState(FIXED_TOPIC);
  const [factors] = useState<ISMElement[]>(FIXED_FACTORS);
  const [ssim, setSsim] = useState<SSIMData>({});
  const [result, setResult] = useState<ISMResult | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const goToSSIM = () => {
    setStep(AppStep.FILL_SSIM);
  };

  const calculateAndShowResults = () => {
    const factorIds = factors.map(f => f.id);
    const analysis = runISMAnalysis(factors.length, factorIds, ssim);
    setResult(analysis);
    setStep(AppStep.ANALYSIS_RESULT);
  };

  const resetAnalysis = () => {
    if(window.confirm("This will clear the current analysis and SSIM data. Continue?")) {
      setSsim({});
      setResult(null);
      setStep(AppStep.DEFINE_FACTORS);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent hidden md:block">
              SSIM Construction (TEST)
            </h1>
            <span className="text-slate-400 hidden md:block">|</span>
            <p className="text-sm md:text-base font-semibold text-slate-700">Critical Factors Network</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className={step === AppStep.DEFINE_FACTORS ? 'text-indigo-600 font-bold' : ''}>1. Factors</span>
            <span>&rarr;</span>
            <span className={step === AppStep.FILL_SSIM ? 'text-indigo-600 font-bold' : ''}>2. Relations</span>
            <span>&rarr;</span>
            <span className={step === AppStep.ANALYSIS_RESULT ? 'text-indigo-600 font-bold' : ''}>3. Model</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 print:p-0">
        
        {step === AppStep.DEFINE_FACTORS && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Project Scope</h2>
                <p className="text-slate-600 italic">"{topic}"</p>
             </div>

             <FactorInput 
                factors={factors} 
                // Pass dummy setFactors as it's read-only now
                setFactors={() => {}} 
                topic={topic} 
                onNext={goToSSIM} 
              />
          </div>
        )}

        {step === AppStep.FILL_SSIM && (
          <SSIMGrid 
            factors={factors} 
            ssim={ssim} 
            setSsim={setSsim} 
            topic={topic}
            onNext={calculateAndShowResults}
            onBack={() => setStep(AppStep.DEFINE_FACTORS)}
          />
        )}

        {step === AppStep.ANALYSIS_RESULT && result && (
          <ResultsView 
            factors={factors} 
            result={result} 
            onReset={resetAnalysis}
            onBack={goToSSIM}
          />
        )}
      </main>
    </div>
  );
};

export default App;