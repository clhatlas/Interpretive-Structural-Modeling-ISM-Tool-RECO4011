import React, { useState, useRef } from 'react';
import { ISMElement, SSIMData, SSIMValue } from '../types';
import { RotateCcw, Wand2, Save, Upload } from 'lucide-react';
import { getCategoryColorClasses } from './FactorInput';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportData = () => {
    const dataStr = JSON.stringify(ssim, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SSIM_Data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        // Basic validation: check if it's an object
        if (typeof parsedData === 'object' && parsedData !== null) {
            setSsim(parsedData);
            alert("SSIM Data loaded successfully.");
        } else {
            alert("Invalid file format.");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Failed to parse file. Please ensure it is a valid JSON file exported from this app.");
      }
      // Reset input value to allow re-selecting the same file if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const getCellColor = (val: SSIMValue) => {
    switch(val) {
      case SSIMValue.V: return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200';
      case SSIMValue.A: return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
      case SSIMValue.X: return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      case SSIMValue.O: return 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  // Extract just the bg color part for row indicators
  const getCategoryBorderColor = (cat?: string) => {
     switch (cat) {
        case 'Management': return 'border-l-blue-400';
        case 'Cost': return 'border-l-rose-400';
        case 'Organization': return 'border-l-purple-400';
        case 'Technology': return 'border-l-cyan-400';
        case 'Knowledge': return 'border-l-amber-400';
        case 'Process': return 'border-l-orange-400';
        case 'Policy': return 'border-l-slate-400';
        default: return 'border-l-emerald-400';
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
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-50 border border-emerald-100" title="i influences j"><span className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full"></span> <span className="font-mono font-bold text-emerald-700">V</span>: i &rarr; j</div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-50 border border-amber-100" title="j influences i"><span className="w-2 h-2 md:w-3 md:h-3 bg-amber-500 rounded-full"></span> <span className="font-mono font-bold text-amber-700">A</span>: j &rarr; i</div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-50 border border-blue-100" title="Mutual influence"><span className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></span> <span className="font-mono font-bold text-blue-700">X</span>: i &harr; j</div>
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
                    <span className="font-bold text-emerald-300">{f.name}:</span> {f.description || f.name}
                    <br/>
                    <span className="text-slate-400 text-[10px]">{f.category}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factors.map((rowFactor, i) => (
              <tr key={rowFactor.id} className="hover:bg-slate-50 transition-colors">
                <td className={`sticky left-0 z-20 bg-white p-2 text-slate-700 text-xs md:text-sm font-medium border-r border-slate-200 border-l-4 ${getCategoryBorderColor(rowFactor.category)} min-w-[200px] max-w-[300px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-help`} title={rowFactor.description || rowFactor.name}>
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
                    <td key={colFactor.id} className={`p-0.5 md:p-1 text-center border border-slate-100 relative transition-colors duration-500 ${isHighlighted ? 'bg-yellow-50' : ''}`}>
                      <div className="relative group/cell">
                        <button
                          type="button"
                          onClick={() => toggleValue(rowFactor.id, colFactor.id)}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-sm md:rounded-md border font-bold text-xs md:text-sm transition-all flex items-center justify-center ${getCellColor(val)} ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-white scale-110' : ''}`}
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

      <div className="flex-shrink-0 flex justify-between items-center pt-2 pb-4 flex-wrap gap-4">
        <div className="flex gap-2 items-center flex-wrap">
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
                className={`px-4 py-3 transition-colors flex items-center gap-2 text-sm rounded-lg border border-transparent ${confirmClear ? 'text-red-600 font-bold bg-red-50 border-red-100' : 'text-slate-500 hover:text-red-500 hover:bg-slate-50'}`}
                title="Reset all relationships to 'O'"
            >
                <RotateCcw className={`w-4 h-4 ${confirmClear ? 'animate-spin' : ''}`} /> 
                {confirmClear ? "Confirm Clear?" : "Clear Grid"}
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportData} 
              accept=".json" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={handleExportData}
              className="px-3 py-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Save Data
            </button>
            <button
              type="button"
              onClick={triggerImport}
              className="px-3 py-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              <Upload className="w-4 h-4" /> Load Data
            </button>
        </div>
        
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] flex items-center gap-2 ml-auto"
        >
          Generate Model <Wand2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SSIMGrid;