import React, { useState } from 'react';
import { ISMElement, SSIMData, SSIMValue } from '../types';
import { RotateCcw, Wand2 } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  ssim: SSIMData;
  setSsim: React.Dispatch<React.SetStateAction<SSIMData>>;
  topic: string;
  onNext: () => void;
  onBack: () => void;
}

const SSIMGrid: React.FC<Props> = ({ factors, ssim, setSsim, onNext, onBack }) => {
  const [highlightCell, setHighlightCell] = useState<{i: string, j: string} | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const toggleValue = (iId: string, jId: string) => {
    const current = ssim[iId]?.[jId] || SSIMValue.O;
    const nextMap: Record<SSIMValue, SSIMValue> = {
      [SSIMValue.V]: SSIMValue.A,
      [SSIMValue.A]: SSIMValue.X,
      [SSIMValue.X]: SSIMValue.O,
      [SSIMValue.O]: SSIMValue.V,
    };
    
    setSsim(prev => ({
      ...prev,
      [iId]: {
        ...(prev[iId] || {}),
        [jId]: nextMap[current]
      }
    }));
  };

  const handleLowerTriangleClick = (rowId: string, colId: string, rowIdx: number, colIdx: number) => {
    setHighlightCell({ i: colId, j: rowId });
    setTimeout(() => setHighlightCell(null), 2000);
    
    alert(`To set relationship "${factors[rowIdx].name} → ${factors[colIdx].name}", please edit cell (${factors[colIdx].name}, ${factors[rowIdx].name}) in the upper triangle to 'A'.`);
  };

  const handleClearClick = () => {
    if (confirmClear) {
        setSsim({});
        setConfirmClear(false);
    } else {
        setConfirmClear(true);
        // Auto-reset confirmation after 3 seconds
        setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const getCellColor = (val: SSIMValue) => {
    switch(val) {
      case SSIMValue.V: return 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200';
      case SSIMValue.A: return 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200';
      case SSIMValue.X: return 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200';
      case SSIMValue.O: return 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex flex-shrink-0 justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Structural Self-Interaction Matrix (SSIM)</h2>
          <p className="text-slate-500 text-sm mt-1">
             Define relationships in the upper triangle. 
             <span className="hidden md:inline ml-1 text-slate-400">
               (Row i vs Column j)
             </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-700">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50" title="i influences j"><span className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full"></span> <span className="font-mono font-bold text-emerald-600">V</span>: i &rarr; j</div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50" title="j influences i"><span className="w-2 h-2 md:w-3 md:h-3 bg-amber-500 rounded-full"></span> <span className="font-mono font-bold text-amber-600">A</span>: j &rarr; i</div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50" title="Mutual influence"><span className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full"></span> <span className="font-mono font-bold text-purple-600">X</span>: i &harr; j</div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50" title="No relationship"><span className="w-2 h-2 md:w-3 md:h-3 bg-slate-300 rounded-full"></span> <span className="font-mono font-bold text-slate-400">O</span>: None</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-2xl relative">
        <table className="border-collapse w-max min-w-full">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-white p-2 text-left text-slate-500 font-mono text-sm border-b border-r border-slate-200 min-w-[200px] shadow-sm">
                i \ j
              </th>
              {factors.map((f, idx) => (
                <th key={f.id} className="sticky top-0 z-20 bg-white p-2 text-slate-700 font-mono text-xs w-10 md:w-14 text-center border-b border-slate-200 shadow-sm group relative cursor-help">
                  {f.name}
                  <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs p-2 rounded shadow-xl whitespace-nowrap z-40 border border-slate-600 pointer-events-none">
                    <span className="font-bold">{f.name}:</span> {f.description || f.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factors.map((rowFactor, i) => (
              <tr key={rowFactor.id} className="hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-20 bg-white p-2 text-slate-700 text-xs md:text-sm font-medium border-r border-slate-200 min-w-[200px] max-w-[300px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-help" title={rowFactor.description || rowFactor.name}>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-8 text-slate-400 font-mono text-right">{rowFactor.name}.</span>
                    <span className="truncate">{rowFactor.description || rowFactor.name}</span>
                  </div>
                </td>
                {factors.map((colFactor, j) => {
                  const isDiagonal = i === j;
                  const isLowerTriangle = j < i;
                  
                  if (isDiagonal) {
                     return <td key={colFactor.id} className="p-1 bg-slate-100 border border-slate-100"></td>;
                  }

                  if (isLowerTriangle) {
                     return (
                        <td 
                            key={colFactor.id} 
                            onClick={() => handleLowerTriangleClick(rowFactor.id, colFactor.id, i, j)}
                            className="p-1 bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                            title={`Go to cell (${colFactor.name}, ${rowFactor.name}) to edit this relationship`}
                        >
                        </td>
                     );
                  }

                  // Upper Triangle
                  const val = ssim[rowFactor.id]?.[colFactor.id] || SSIMValue.O;
                  const isHighlighted = highlightCell?.i === rowFactor.id && highlightCell?.j === colFactor.id;

                  return (
                    <td key={colFactor.id} className={`p-0.5 md:p-1 text-center border border-slate-100 relative transition-colors duration-500 ${isHighlighted ? 'bg-indigo-50' : ''}`}>
                      <div className="relative group/cell">
                        <button
                          type="button"
                          onClick={() => toggleValue(rowFactor.id, colFactor.id)}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-sm md:rounded-md border font-bold text-xs md:text-sm transition-all flex items-center justify-center ${getCellColor(val)} ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white scale-110' : ''}`}
                        >
                          {val}
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-shrink-0 flex justify-between items-center pt-2 pb-4">
        <div className="flex gap-2">
            <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 text-slate-500 hover:text-slate-900 transition-colors"
            >
            Back
            </button>
            <button
                type="button"
                onClick={handleClearClick}
                className={`px-4 py-3 transition-colors flex items-center gap-2 text-sm ${confirmClear ? 'text-red-600 font-bold bg-red-50 rounded-lg' : 'text-slate-500 hover:text-red-500'}`}
                title="Reset all relationships to 'O'"
            >
                <RotateCcw className={`w-4 h-4 ${confirmClear ? 'animate-spin' : ''}`} /> 
                {confirmClear ? "Confirm Clear?" : "Clear"}
            </button>
        </div>
        
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] flex items-center gap-2"
        >
          Generate Model <Wand2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SSIMGrid;