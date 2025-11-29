
import React, { useState, useRef } from 'react';
import { ISMElement, SSIMData, SSIMValue } from '../types';
import { RotateCcw, Wand2, Save, Upload, ArrowLeft } from 'lucide-react';
import { getCategoryTheme } from './FactorInput';

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
    alert(`Edit cell (${factors[colIdx].name}, ${factors[rowIdx].name}) in the upper triangle.`);
  };

  const handleClearClick = () => {
    if (confirmClear) {
        setSsim({});
        setConfirmClear(false);
    } else {
        setConfirmClear(true);
        setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(ssim, null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([dataStr], { type: "application/json" }));
    link.download = `SSIM_Data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);
        if (typeof parsedData === 'object' && parsedData !== null) setSsim(parsedData);
      } catch (error) { alert("Failed to parse file."); }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const getCellColor = (val: SSIMValue) => {
    switch(val) {
      case SSIMValue.V: return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200';
      case SSIMValue.A: return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
      case SSIMValue.X: return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      default: return 'bg-white text-slate-300 border-slate-200 hover:bg-slate-50';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex flex-shrink-0 justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">SSIM Input</h2>
          <p className="text-slate-500 text-sm mt-1">Define upper triangle relationships.</p>
        </div>
        <div className="flex items-center gap-3 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded"><span className="font-bold">V</span>: i&rarr;j</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 text-amber-800 rounded"><span className="font-bold">A</span>: j&rarr;i</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-800 rounded"><span className="font-bold">X</span>: Mutual</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded"><span className="font-bold">O</span>: None</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-lg border border-slate-300 shadow-sm relative pb-4">
        <table className="border-collapse w-max min-w-full table-fixed">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-slate-50 p-2 text-left text-slate-600 font-bold text-xs border-b border-r border-slate-300 min-w-[200px] shadow-sm w-[250px]">
                Factor i \ j
              </th>
              {factors.map((f, idx) => (
                <th key={f.id} className="sticky top-0 z-20 bg-slate-50 p-2 text-slate-700 font-bold text-xs w-12 text-center border-b border-slate-300 border-r border-slate-100 shadow-sm align-bottom h-40">
                  <div className="transform -rotate-90 origin-bottom-left w-6 whitespace-nowrap overflow-visible translate-x-3 mb-2 text-left">
                     <span className="mr-2 text-slate-900 font-extrabold">{f.name}:</span>
                     <span className="font-normal text-slate-500">{f.description}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factors.map((rowFactor, i) => (
              <tr key={rowFactor.id} className="hover:bg-slate-50">
                <td className={`sticky left-0 z-20 bg-white p-2 text-slate-700 text-xs font-semibold border-r border-slate-300 border-b border-slate-100 border-l-4 ${getCategoryTheme(rowFactor.category).borderL} min-w-[200px] max-w-[300px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-normal leading-tight`} title={rowFactor.description}>
                  <span className="text-slate-400 mr-2">{rowFactor.name}.</span>
                  {rowFactor.description || rowFactor.name}
                </td>
                {factors.map((colFactor, j) => {
                  const isDiagonal = i === j;
                  const isLower = j < i;
                  const val = ssim[rowFactor.id]?.[colFactor.id] || SSIMValue.O;
                  const isHighlighted = highlightCell?.i === rowFactor.id && highlightCell?.j === colFactor.id;

                  if (isDiagonal) return <td key={colFactor.id} className="bg-slate-100 border border-slate-200"></td>;
                  if (isLower) return <td key={colFactor.id} onClick={() => handleLowerTriangleClick(rowFactor.id, colFactor.id, i, j)} className="bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-200"></td>;

                  return (
                    <td key={colFactor.id} className={`p-0.5 border border-slate-200 text-center ${isHighlighted ? 'bg-yellow-50' : ''}`}>
                        <button
                          type="button"
                          onClick={() => toggleValue(rowFactor.id, colFactor.id)}
                          className={`w-full h-8 md:h-9 rounded-sm border font-bold text-xs md:text-sm transition-all flex items-center justify-center ${getCellColor(val)} ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
                        >
                          {val}
                        </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-shrink-0 flex justify-between items-center pt-2 pb-4 border-t border-slate-200 bg-slate-50 -mx-6 px-6 -mb-6 rounded-b-lg">
        <div className="flex gap-3">
            <button onClick={onBack} className="px-4 py-2 border border-slate-300 bg-white text-slate-600 rounded-md hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
                <ArrowLeft className="w-4 h-4"/> Back
            </button>
            <button onClick={handleClearClick} className={`px-4 py-2 border rounded-md text-sm font-medium flex items-center gap-2 ${confirmClear ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-300 hover:text-red-600'}`}>
                <RotateCcw className="w-4 h-4" /> {confirmClear ? "Confirm?" : "Clear"}
            </button>
            
            <div className="w-px h-8 bg-slate-300 mx-2"></div>

            <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
            <div className="flex bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden divide-x divide-slate-200">
                <button onClick={handleExportData} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                   <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                   <Upload className="w-4 h-4" /> Load
                </button>
            </div>
        </div>
        
        <button onClick={onNext} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-md shadow-sm flex items-center gap-2">
          Generate Model <Wand2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SSIMGrid;
