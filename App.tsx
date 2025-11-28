import React, { useState, useEffect } from 'react';
import { AppStep, ISMElement, SSIMData, ISMResult } from './types';
import FactorInput from './components/FactorInput';
import SSIMGrid from './components/SSIMGrid';
import ResultsView from './components/ResultsView';
import { runISMAnalysis } from './services/ismLogic';
import { LayoutDashboard, ArrowRight, FileText } from 'lucide-react';

// Simplified to 10 factors F1-F10 as requested
const PRESET_FACTORS = Array.from({ length: 10 }, (_, i) => ({
  name: `F${i + 1}`,
  category: "Confined Space Factor"
}));

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.SETUP_TOPIC);
  const [topic, setTopic] = useState('');
  const [factors, setFactors] = useState<ISMElement[]>([]);
  const [ssim, setSsim] = useState<SSIMData>({});
  const [result, setResult] = useState<ISMResult | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const startProject = () => {
    if (topic.trim()) setStep(AppStep.DEFINE_FACTORS);
  };

  const loadSafetyTemplate = () => {
    setTopic("Driving/Dependent Relationships of Factors of Confined Space Accidents");
    const loadedFactors: ISMElement[] = PRESET_FACTORS.map((f, i) => ({
      id: `preset-${i}`,
      name: f.name,
      description: f.category,
      category: f.category
    }));
    setFactors(loadedFactors);
    setSsim({}); // Clear previous SSIM
    setResult(null);
    setStep(AppStep.DEFINE_FACTORS);
  };

  const goToSSIM = () => {
    setStep(AppStep.FILL_SSIM);
  };

  const calculateAndShowResults = () => {
    const factorIds = factors.map(f => f.id);
    const analysis = runISMAnalysis(factors.length, factorIds, ssim);
    setResult(analysis);
    setStep(AppStep.ANALYSIS_RESULT);
  };

  const resetApp = () => {
    if(window.confirm("Are you sure? All data will be lost.")) {
      setStep(AppStep.SETUP_TOPIC);
      setTopic('');
      setFactors([]);
      setSsim({});
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              CritNet for Confined Space Safety
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className={step === AppStep.SETUP_TOPIC ? 'text-indigo-600 font-bold' : ''}>1. Topic</span>
            <span>&rarr;</span>
            <span className={step === AppStep.DEFINE_FACTORS ? 'text-indigo-600 font-bold' : ''}>2. Factors</span>
            <span>&rarr;</span>
            <span className={step === AppStep.FILL_SSIM ? 'text-indigo-600 font-bold' : ''}>3. Relations</span>
            <span>&rarr;</span>
            <span className={step === AppStep.ANALYSIS_RESULT ? 'text-indigo-600 font-bold' : ''}>4. Model</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {step === AppStep.SETUP_TOPIC && (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                Model Safety Factors <br/>
                <span className="text-indigo-600">Intelligently</span>
              </h1>
              <p className="text-lg text-slate-500">
                CritNet: Analyze the Driving and Dependent Relationships of Factors for Confined Space Accidents using Interpretive Structural Modelling (ISM).
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
              <label className="block text-left text-sm font-medium text-slate-500 mb-4">
                Start a new project or load the standard model
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startProject()}
                    placeholder="Enter custom topic..."
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                  <button
                    onClick={startProject}
                    disabled={!topic.trim()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-500/20"
                  >
                    Start <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400">Or</span>
                  </div>
                </div>

                <button
                  onClick={loadSafetyTemplate}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-500 text-slate-700 font-medium rounded-lg transition-all flex items-center justify-center gap-2 group"
                >
                  <FileText className="w-4 h-4 text-indigo-500 group-hover:text-indigo-600" />
                  Load CritNet Model (Factors F1 - F10)
                </button>
              </div>

              {!process.env.API_KEY && (
                  <p className="mt-4 text-xs text-amber-600 text-left">
                    Note: AI features are disabled (API_KEY missing). You can still proceed manually.
                  </p>
              )}
            </div>
          </div>
        )}

        {step === AppStep.DEFINE_FACTORS && (
          <FactorInput 
            factors={factors} 
            setFactors={setFactors} 
            topic={topic} 
            onNext={goToSSIM} 
          />
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
            onReset={resetApp}
            onBack={goToSSIM}
          />
        )}
      </main>
    </div>
  );
};

export default App;