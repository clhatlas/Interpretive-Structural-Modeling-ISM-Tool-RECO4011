
import React, { useState, useEffect } from 'react';
import { AppStep, ISMElement, SSIMData, ISMResult } from './types';
import FactorInput from './components/FactorInput';
import SSIMGrid from './components/SSIMGrid';
import ResultsView from './components/ResultsView';
import { runISMAnalysis } from './services/ismLogic';
import { HardHat, BookOpen, ChevronDown, ChevronUp, Construction } from 'lucide-react';

// Default factors based on the Sustainability Barriers input
const DEFAULT_FACTORS: ISMElement[] = [
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
  // Initialize directly to Factor Definition step with default data
  const [step, setStep] = useState<AppStep>(AppStep.DEFINE_FACTORS);
  const [topic] = useState(FIXED_TOPIC);
  const [factors, setFactors] = useState<ISMElement[]>(DEFAULT_FACTORS);
  const [ssim, setSsim] = useState<SSIMData>({});
  const [result, setResult] = useState<ISMResult | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const goToSSIM = () => {
    if (factors.length < 2) {
      alert("Please define at least 2 factors to proceed.");
      return;
    }
    setStep(AppStep.FILL_SSIM);
  };

  const calculateAndShowResults = () => {
    const factorIds = factors.map(f => f.id);
    const analysis = runISMAnalysis(factors.length, factorIds, ssim);
    setResult(analysis);
    setStep(AppStep.ANALYSIS_RESULT);
  };

  const resetAnalysis = () => {
    if(window.confirm("This will clear the current analysis and SSIM data. The factors will remain. Continue?")) {
      setSsim({});
      setResult(null);
      setStep(AppStep.DEFINE_FACTORS);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            {/* Realistic Construction Logo Badge */}
            <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-md shadow-sm border-b-2 border-yellow-500">
               <HardHat className="w-8 h-8 text-yellow-500" strokeWidth={1.5} />
            </div>
            
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                ISM Tool
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-1 uppercase">
                SSIM & MICMAC Analysis <span className="text-yellow-600 font-bold px-1 bg-yellow-50 rounded border border-yellow-100 ml-1">TRIAL</span>
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
            <div className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${step === AppStep.DEFINE_FACTORS ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>
              1. Factors
            </div>
            <div className="text-slate-300 px-2">/</div>
            <div className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${step === AppStep.FILL_SSIM ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>
              2. SSIM Matrix
            </div>
            <div className="text-slate-300 px-2">/</div>
            <div className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${step === AppStep.ANALYSIS_RESULT ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>
              3. Analysis
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 print:p-0 flex-grow w-full">
        
        {step === AppStep.DEFINE_FACTORS && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
             
             {/* User Manual / Instructions */}
             <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div 
                    className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer border-b border-slate-200 hover:bg-slate-100 transition-colors"
                    onClick={() => setIsManualOpen(!isManualOpen)}
                >
                    <div className="flex items-center gap-3 text-slate-800 font-bold">
                        <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-base text-lg">User Manual & Workflow</h2>
                    </div>
                    {isManualOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
                
                {isManualOpen && (
                    <div className="p-8 space-y-8 text-slate-600 text-sm leading-relaxed">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm">1</span>
                                    <h3 className="font-bold text-slate-900 text-lg">Define Factors</h3>
                                </div>
                                <p className="text-slate-500 pl-10">
                                    Input the critical risk factors or barriers. For efficiency, download the CSV template and upload large datasets.
                                </p>
                                <p className="text-slate-500 pl-10 mt-1 text-xs italic">
                                    Import function is available for JSON and CSV file.
                                </p>
                                <div className="pl-10 mt-2">
                                  <div className="inline-flex gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-500">
                                     <span>Tip: Use <strong>Import</strong> for bulk entry.</span>
                                  </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm">2</span>
                                    <h3 className="font-bold text-slate-900 text-lg">Build SSIM</h3>
                                </div>
                                <p className="text-slate-500 pl-10">
                                    Establish pairwise relationships in the Structural Self-Interaction Matrix.
                                </p>
                                <div className="pl-10 grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-100 font-bold text-center">V (Forward)</div>
                                    <div className="bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-100 font-bold text-center">A (Reverse)</div>
                                    <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-100 font-bold text-center">X (Mutual)</div>
                                    <div className="bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 font-bold text-center">O (None)</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm">3</span>
                                    <h3 className="font-bold text-slate-900 text-lg">Analysis</h3>
                                </div>
                                <p className="text-slate-500 pl-10">
                                    Automated generation of structural models:
                                </p>
                                <ul className="pl-14 list-disc space-y-1 text-slate-500">
                                    <li>Reachability Matrix</li>
                                    <li>Hierarchy Graph</li>
                                    <li>Interrelationship Digraph</li>
                                    <li>MICMAC Quadrants</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
             </div>

             <FactorInput 
                factors={factors} 
                setFactors={setFactors} 
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

      {/* Professional Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 opacity-50">
               <Construction className="w-4 h-4" />
               <span className="text-sm font-bold tracking-wider uppercase">ISM Construction Tool</span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl text-center leading-relaxed">
                Disclaimer: The ISM Tool is built with React, Tailwind and Gemini by Atlas Cheung for academic use only. The tool is intended for educational and research purposes to support Interpretive Structural Modelling analysis. Results generated by this application are provided as-is and should be critically evaluated before any practical use. This application collects no personal information.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
