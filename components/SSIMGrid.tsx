
import React, { useState, useRef } from 'react';
import { ISMElement, SSIMData, SSIMValue } from '../types';
import { RotateCcw, Wand2, Save, Upload, ArrowLeft, FileSpreadsheet, Image as ImageIcon, GitCompare, X, Plus, Check, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { getCategoryTheme } from './FactorInput';
import html2canvas from 'html2canvas';

interface Props {
  factors: ISMElement[];
  ssim: SSIMData;
  setSsim: React.Dispatch<React.SetStateAction<SSIMData>>;
  topic: string;
  onNext: () => void;
  onBack: () => void;
}

const SSIMGrid: React.FC<Props> = ({ factors, ssim, setSsim, onNext, onBack }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'compare'>('input');
  const [highlightCell, setHighlightCell] = useState<{i: string, j: string} | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  
  // Comparison State
  const [compModels, setCompModels] = useState<{
      2: { name: string, data: SSIMData } | null,
      3: { name: string, data: SSIMData } | null
  }>({ 2: null, 3: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const compFileRef2 = useRef<HTMLInputElement>(null);
  const compFileRef3 = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // --- Input Mode Logic ---

  const toggleValue = (iId: string, jId: string) => {
    if (activeTab === 'compare') return; // Read-only in compare mode

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
    if (activeTab === 'input') {
        alert(`Edit cell (${factors[colIdx].name}, ${factors[rowIdx].name}) in the upper triangle.`);
    }
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

  // --- File I/O ---

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

  const handleExportExcel = () => {
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>SSIM Matrix</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>body, table { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 12px; } table { border-collapse: collapse; } td, th { border: 0.5pt solid #94a3b8; padding: 5px; text-align: center; vertical-align: middle; } .header { font-weight: bold; background-color: #f1f5f9; text-align: left; } .header-col { font-weight: bold; background-color: #f1f5f9; text-align: center; } .v-cell { background-color: #d1fae5; color: #065f46; font-weight: bold; } .a-cell { background-color: #fef3c7; color: #92400e; font-weight: bold; } .x-cell { background-color: #dbeafe; color: #1e40af; font-weight: bold; } .o-cell { color: #94a3b8; } .diagonal { background-color: #f1f5f9; color: #cbd5e1; } .lower { background-color: #f8fafc; } .conflict { background-color: #fee2e2; color: #b91c1c; font-weight: bold; } .majority { background-color: #fef9c3; color: #854d0e; font-weight: bold; } .unanimous { color: #64748b; }</style>';
    html += '</head><body>';
    
    const title = activeTab === 'compare' ? 'SSIM Comparison Analysis' : 'Structural Self-Interaction Matrix (SSIM)';
    html += `<h3>${title}</h3>`;
    html += '<table><thead><tr><th style="min-width:200px;">Factor i \\ j</th>';
    factors.forEach(f => {
        html += `<th class="header-col">${f.name}</th>`;
    });
    html += '</tr></thead><tbody>';

    factors.forEach((rowFactor, i) => {
        html += `<tr><td class="header">${rowFactor.name}: ${rowFactor.description || ''}</td>`;
        factors.forEach((colFactor, j) => {
            
            if (i === j) {
                html += `<td class="diagonal"></td>`;
            } else if (j < i) {
                html += `<td class="lower"></td>`;
            } else {
                 if (activeTab === 'compare') {
                    const { isUnanimous, isConflict, majorityVal } = getConsensus(rowFactor.id, colFactor.id);
                    let cellClass = 'unanimous';
                    let val = majorityVal;
                    
                    if (isConflict) {
                        cellClass = 'conflict';
                        val = '?';
                    } else if (!isUnanimous) {
                        cellClass = 'majority';
                    }
                    html += `<td class="${cellClass}">${val}</td>`;
                 } else {
                     const val = ssim[rowFactor.id]?.[colFactor.id] || SSIMValue.O;
                     let cellClass = 'o-cell';
                     if (val === SSIMValue.V) cellClass = 'v-cell';
                     else if (val === SSIMValue.A) cellClass = 'a-cell';
                     else if (val === SSIMValue.X) cellClass = 'x-cell';
                     html += `<td class="${cellClass}">${val}</td>`;
                 }
            }
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    if (activeTab === 'compare') {
        html += '<br/><div><strong>Legend:</strong> <span style="background-color: #fee2e2; color: #b91c1c; padding: 2px;">?</span> Conflict (No Majority), <span style="background-color: #fef9c3; color: #854d0e; padding: 2px;">Value</span> Majority Suggestion, <span style="color: #64748b;">Value</span> Unanimous</div>';
    } else {
        html += '<br/><div><strong>Legend:</strong> V: i->j, A: j->i, X: Mutual, O: None</div>';
    }
    html += '</body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SSIM_${activeTab === 'compare' ? 'Comparison' : 'Export'}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  const handleExportImage = async () => {
    if (!gridRef.current) return;
    try {
        const canvas = await html2canvas(gridRef.current, {
            backgroundColor: '#ffffff',
            scale: 2, 
            logging: false,
            windowWidth: gridRef.current.scrollWidth + 100,
            windowHeight: gridRef.current.scrollHeight + 100,
            onclone: (clonedDoc) => {
                const element = clonedDoc.querySelector('[data-export-target="ssim-grid"]') as HTMLElement;
                if(element) {
                    element.style.overflow = 'visible';
                    element.style.height = 'auto';
                    element.style.width = 'fit-content';
                    element.style.maxWidth = 'none';
                    const stickies = element.querySelectorAll('.sticky');
                    stickies.forEach(el => {
                        (el as HTMLElement).style.position = 'static';
                        (el as HTMLElement).style.transform = 'none';
                    });
                    const table = element.querySelector('table');
                    if(table) table.style.width = '100%';
                }
            }
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `SSIM_${activeTab === 'compare' ? 'Comparison' : 'Matrix'}_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
    } catch (e) {
        console.error("Export failed", e);
        alert("Failed to export image.");
    }
  };

  // --- Comparison Logic ---

  const handleCompModelUpload = (slot: 2 | 3, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const data = JSON.parse(ev.target?.result as string);
              setCompModels(prev => ({
                  ...prev,
                  [slot]: { name: file.name.replace('.json',''), data }
              }));
          } catch(err) { alert("Invalid JSON file"); }
          if (slot === 2 && compFileRef2.current) compFileRef2.current.value = '';
          if (slot === 3 && compFileRef3.current) compFileRef3.current.value = '';
      };
      reader.readAsText(file);
  };

  const removeCompModel = (slot: 2 | 3) => {
      setCompModels(prev => ({ ...prev, [slot]: null }));
  };

  const getConsensus = (iId: string, jId: string) => {
      // Collect values from all active models
      const val1 = ssim[iId]?.[jId] || SSIMValue.O;
      const values = [{ val: val1, src: 'Model A' }];

      if (compModels[2]) values.push({ val: compModels[2].data[iId]?.[jId] || SSIMValue.O, src: compModels[2].name });
      if (compModels[3]) values.push({ val: compModels[3].data[iId]?.[jId] || SSIMValue.O, src: compModels[3].name });

      // Calculate consensus
      const counts: Record<string, number> = {};
      values.forEach(v => counts[v.val] = (counts[v.val] || 0) + 1);

      let maxFreq = 0;
      let candidates: SSIMValue[] = [];
      Object.entries(counts).forEach(([k, c]) => {
          if (c > maxFreq) {
              maxFreq = c;
              candidates = [k as SSIMValue];
          } else if (c === maxFreq) {
              candidates.push(k as SSIMValue);
          }
      });

      const isUnanimous = values.every(v => v.val === values[0].val);
      const isConflict = candidates.length > 1; // Tie
      const majorityVal = candidates[0];

      return {
          values,
          isUnanimous,
          isConflict,
          majorityVal,
          candidates
      };
  };

  const handleApplyConsensus = () => {
      const newSSIM: SSIMData = { ...ssim }; // Clone existing
      let appliedCount = 0;

      factors.forEach((r, rIdx) => {
          factors.forEach((c, cIdx) => {
              if (cIdx > rIdx) {
                  const { isConflict, majorityVal, isUnanimous } = getConsensus(r.id, c.id);
                  if (!isUnanimous && !isConflict) {
                      // Apply Majority
                      if (!newSSIM[r.id]) newSSIM[r.id] = {};
                      newSSIM[r.id][c.id] = majorityVal;
                      appliedCount++;
                  }
                  // If conflict, we keep the original (Model A) value
              }
          });
      });
      setSsim(newSSIM);
      setActiveTab('input');
      alert(`Applied suggested values to ${appliedCount} cells. Conflicting cells retain original values.`);
  };

  // --- Rendering Helpers ---

  const getCellColor = (val: SSIMValue) => {
    switch(val) {
      case SSIMValue.V: return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200';
      case SSIMValue.A: return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
      case SSIMValue.X: return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      default: return 'bg-white text-slate-300 border-slate-200 hover:bg-slate-50';
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-100px)]">
      
      {/* Announcement Bar */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r shadow-sm flex items-start gap-3 flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 font-medium">
          This Application cannot store data automatically. Save your progress in Excel/image/JSON format together with your factors/barriers on the previous page before leaving the site.
        </p>
      </div>

      {/* Header & Tabs */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-2 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">SSIM Input</h2>
              <p className="text-slate-500 text-sm mt-1">Define upper triangle relationships.</p>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('input')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'input' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Entry Mode
                </button>
                <button 
                    onClick={() => setActiveTab('compare')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'compare' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <GitCompare className="w-3.5 h-3.5" /> Comparison
                </button>
            </div>
          </div>

          {/* Comparison Toolbar */}
          {activeTab === 'compare' && (
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-md border border-slate-200 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-r border-slate-300 pr-4 mr-2">
                      <span>Model A:</span>
                      <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">Current Input</span>
                  </div>
                  
                  {/* Model 2 Slot */}
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Model B:</span>
                      {compModels[2] ? (
                          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 text-xs">
                              <span className="font-medium">{compModels[2].name}</span>
                              <button onClick={() => removeCompModel(2)} className="hover:text-red-500"><X className="w-3 h-3"/></button>
                          </div>
                      ) : (
                          <>
                            <input type="file" ref={compFileRef2} onChange={(e) => handleCompModelUpload(2, e)} className="hidden" accept=".json"/>
                            <button onClick={() => compFileRef2.current?.click()} className="flex items-center gap-1 text-xs bg-white border border-dashed border-slate-300 px-2 py-1 rounded hover:border-indigo-400 hover:text-indigo-600">
                                <Plus className="w-3 h-3"/> Upload
                            </button>
                          </>
                      )}
                  </div>

                  {/* Model 3 Slot */}
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Model C:</span>
                      {compModels[3] ? (
                          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 text-xs">
                              <span className="font-medium">{compModels[3].name}</span>
                              <button onClick={() => removeCompModel(3)} className="hover:text-red-500"><X className="w-3 h-3"/></button>
                          </div>
                      ) : (
                          <>
                            <input type="file" ref={compFileRef3} onChange={(e) => handleCompModelUpload(3, e)} className="hidden" accept=".json"/>
                            <button onClick={() => compFileRef3.current?.click()} className="flex items-center gap-1 text-xs bg-white border border-dashed border-slate-300 px-2 py-1 rounded hover:border-indigo-400 hover:text-indigo-600">
                                <Plus className="w-3 h-3"/> Upload
                            </button>
                          </>
                      )}
                  </div>
              </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded"><span className="font-bold">V</span>: i&rarr;j</div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 text-amber-800 rounded"><span className="font-bold">A</span>: j&rarr;i</div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-800 rounded"><span className="font-bold">X</span>: Mutual</div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded"><span className="font-bold">O</span>: None</div>
            
            {activeTab === 'compare' && (
                <>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded"><AlertTriangle className="w-3 h-3"/> Mismatch (Majority)</div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 text-red-600 rounded"><HelpCircle className="w-3 h-3"/> Conflict (No Majority)</div>
                </>
            )}
          </div>
      </div>

      <div 
        ref={gridRef} 
        data-export-target="ssim-grid"
        className="flex-1 overflow-auto bg-white rounded-lg border border-slate-300 shadow-sm relative pb-4"
      >
        <table className="border-collapse w-max min-w-full table-fixed">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-slate-50 p-3 text-left text-slate-600 font-bold text-sm border-b border-r border-slate-300 min-w-[300px] w-[350px] shadow-sm">
                Factor i \ j
              </th>
              {factors.map((f, idx) => (
                <th key={f.id} className="sticky top-0 z-20 bg-slate-50 p-2 text-slate-700 font-bold text-sm w-16 text-center border-b border-slate-300 border-r border-slate-100 shadow-sm">
                   {/* Horizontal Upright ID */}
                   {f.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factors.map((rowFactor, i) => (
              <tr key={rowFactor.id} className="hover:bg-slate-50">
                <td className={`sticky left-0 z-20 bg-white p-3 text-slate-700 text-sm font-semibold border-r border-slate-300 border-b border-slate-100 border-l-4 ${getCategoryTheme(rowFactor.category).borderL} min-w-[300px] max-w-[400px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-normal leading-tight`} title={rowFactor.description}>
                  <span className="text-slate-400 mr-2">{rowFactor.name}.</span>
                  {rowFactor.description || rowFactor.name}
                </td>
                {factors.map((colFactor, j) => {
                  const isDiagonal = i === j;
                  const isLower = j < i;
                  const val = ssim[rowFactor.id]?.[colFactor.id] || SSIMValue.O;
                  const isHighlighted = highlightCell?.i === rowFactor.id && highlightCell?.j === colFactor.id;

                  // Render Diagonal / Lower
                  if (isDiagonal) return <td key={colFactor.id} className="bg-slate-100 border border-slate-200"></td>;
                  if (isLower) return <td key={colFactor.id} onClick={() => handleLowerTriangleClick(rowFactor.id, colFactor.id, i, j)} className="bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-200"></td>;

                  // --- COMPARISON MODE RENDER ---
                  if (activeTab === 'compare') {
                      const { isUnanimous, isConflict, majorityVal, values } = getConsensus(rowFactor.id, colFactor.id);
                      
                      let cellClass = "";
                      let displayVal: string = majorityVal;
                      let tooltip = values.map(v => `${v.src}: ${v.val}`).join('\n');
                      
                      if (isUnanimous) {
                          cellClass = "opacity-60 grayscale"; // Standard
                      } else if (isConflict) {
                          cellClass = "bg-red-100 text-red-700 font-bold ring-1 ring-inset ring-red-300";
                          displayVal = "?";
                          tooltip = "CONFLICT (No Majority):\n" + tooltip;
                      } else {
                          // Majority Exists but not Unanimous
                          cellClass = "bg-yellow-100 text-yellow-800 font-bold ring-1 ring-inset ring-yellow-300";
                          tooltip = "MAJORITY SUGGESTION:\n" + tooltip;
                      }

                      return (
                        <td key={colFactor.id} className={`p-1 border border-slate-200 text-center relative`}>
                            <div 
                                className={`w-full h-9 md:h-11 rounded-md flex items-center justify-center text-sm md:text-base cursor-help ${cellClass}`}
                                title={tooltip}
                            >
                                {isConflict ? <HelpCircle className="w-5 h-5" /> : displayVal}
                            </div>
                        </td>
                      );
                  }

                  // --- INPUT MODE RENDER ---
                  return (
                    <td key={colFactor.id} className={`p-1 border border-slate-200 text-center relative ${isHighlighted ? 'bg-yellow-50' : ''}`}>
                        <button
                          type="button"
                          onClick={() => toggleValue(rowFactor.id, colFactor.id)}
                          className={`w-full h-9 md:h-11 rounded-md border font-bold text-sm md:text-base transition-all flex items-center justify-center ${getCellColor(val)} ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
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

      {/* Footer Controls */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 pb-4 border-t border-slate-200 bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 -mb-6 rounded-b-lg">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <button onClick={onBack} className="px-4 py-2 border border-slate-300 bg-white text-slate-600 rounded-md hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
                <ArrowLeft className="w-4 h-4"/> Back
            </button>
            <button onClick={handleClearClick} className={`px-4 py-2 border rounded-md text-sm font-medium flex items-center gap-2 ${confirmClear ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-300 hover:text-red-600'}`}>
                <RotateCcw className="w-4 h-4" /> {confirmClear ? "Confirm?" : "Clear"}
            </button>
            
            <div className="hidden sm:block w-px h-8 bg-slate-300 mx-2"></div>

            <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
            
            <div className="flex bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden divide-x divide-slate-200">
                <button onClick={handleExportExcel} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                   <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
                </button>
                <button onClick={handleExportImage} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                   <ImageIcon className="w-4 h-4 text-indigo-600" /> Img
                </button>
                <button onClick={handleExportData} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                   <Save className="w-4 h-4 text-slate-600" /> Save
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                   <Upload className="w-4 h-4 text-slate-600" /> Load
                </button>
            </div>
            
            {activeTab === 'compare' && (
                <>
                    <div className="hidden sm:block w-px h-8 bg-slate-300 mx-2"></div>
                    <button 
                        onClick={handleApplyConsensus} 
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold flex items-center gap-2 shadow-sm"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Apply Consensus to Input
                    </button>
                </>
            )}
        </div>
        
        <button onClick={onNext} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-md shadow-sm flex items-center justify-center gap-2">
          Generate Model <Wand2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SSIMGrid;
