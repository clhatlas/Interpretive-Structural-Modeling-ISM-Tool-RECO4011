import React from 'react';
import { ISMElement } from '../types';
import { Tag } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  setFactors: React.Dispatch<React.SetStateAction<ISMElement[]>>;
  topic: string;
  onNext: () => void;
}

// Helper to get category color
export const getCategoryColorClasses = (category?: string) => {
  switch (category) {
    case 'Management': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Cost': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Organization': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Technology': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'Knowledge': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Process': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Policy': return 'bg-slate-200 text-slate-800 border-slate-300';
    default: return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
};

const FactorInput: React.FC<Props> = ({ factors, onNext }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Model Factors</h2>
          <p className="text-slate-500">The following are the {factors.length} most critical factors identified for the sustainability model.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-xl shadow-emerald-500/5">
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {factors.map((factor, idx) => {
             const catColor = getCategoryColorClasses(factor.category);
             return (
              <div key={factor.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-xs font-mono font-bold border ${catColor}`}>
                    {factor.name}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-slate-900 font-medium truncate">{factor.description || factor.name}</p>
                      {factor.category && (
                        <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${catColor}`}>
                          {factor.category}
                        </span>
                      )}
                    </div>
                    {factor.category && (
                       <span className={`md:hidden inline-flex items-center gap-1 text-[10px] mt-1 px-1.5 py-0.5 rounded border ${catColor}`}>
                          <Tag className="w-3 h-3" /> {factor.category}
                       </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-right text-xs text-slate-400">
            Total Factors: {factors.length}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
        >
          Next: Build SSIM Matrix
        </button>
      </div>
    </div>
  );
};

export default FactorInput;