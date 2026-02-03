
import React, { useState, useRef } from 'react';
import { ISMElement, SSIMData, SSIMValue } from '../types';
import { RotateCcw, Wand2, Save, Upload, ArrowLeft, FileSpreadsheet, Image as ImageIcon, GitCompare, X } from 'lucide-react';
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
  const [highlightCell, setHighlightCell] = useState<{i: string, j: string} | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [comparisonData, setComparisonData] = useState<SSIMData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compareInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  const handleCompareImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);
        if (typeof parsedData === 'object' && parsedData !== null) {
            setComparisonData(parsedData);
        } else {
            alert("Invalid SSIM data.");
        }
      } catch (error) { alert("Failed to parse comparison file."); }
      if (compareInputRef.current) compareInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const clearComparison = () => {
    setComparisonData(null);
  };

  const handleExportExcel = () => {
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>SSIM Matrix</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    html += '<style>body, table { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 12px; } table { border-collapse: collapse; } td, th { border: 0.5pt solid #94a3b8; padding: 5px; text-align: center; vertical-align: middle; } .header { font-weight: bold; background-color: #f1f5f9; text-align: left; } .header-col { font-weight: bold; background-color: #f1f5f9; text-align: center; } .v-cell { background-color: #d1fae5; color: #065f46; font-weight: bold; } .a-cell { background-color: #fef3c7; color: #92400e; font-weight: bold; } .x-cell { background-color: #dbeafe; color: #1e40af; font-weight: bold; } .o-cell { color: #94a3b8; } .diagonal { background-color: #f1f5f9; color: #cbd5e1; } .lower { background-color: #f8fafc; } </style>';
    html += '</head><body>';
    
    html += '<h3>Structural Self-Interaction Matrix (SSIM)</h3>';
    html += '<table><thead><tr><th style="min-width:200px;">Factor i \\ j</th>';
    factors.forEach(f => {
        html += `<th class="header-col">${f.name}</th>`;
    });
    html += '</tr></thead><tbody>';

    factors.forEach((rowFactor, i) => {
        html += `<tr><td class="header">${rowFactor.name}: ${rowFactor.description || ''}</td>`;
        factors.forEach((colFactor, j) => {
            const val = ssim[rowFactor.id]?.[colFactor.id] || SSIMValue.O;
            
            if (i === j) {
                html += `<td class="diagonal"></td>`;
            } else if (j < i) {
                html += `<td class="lower"></td>`;
            } else {
                 let cellClass = 'o-cell';
                 if (val === SSIMValue.V) cellClass = 'v-cell';
                 else if (val === SSIMValue.A) cellClass = 'a-cell';
                 else if (val === SSIMValue.X) cellClass = 'x-cell';
                 html += `<td class="${cellClass}">${val}</td>`;
            }
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '<br/><div><strong>Legend:</strong> V: i->j, A: j->i, X: Mutual, O: None</div>';
    html += '</body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SSIM_Export_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  const handleExportImage = async () => {
    if (!gridRef.current) return;
    try {
        const canvas = await html2canvas(gridRef.current, {
            backgroundColor: '#ffffff',
            scale: 2, // Retina quality
            logging: false,
            // Capture full scrollable area
            windowWidth: gridRef.current.scrollWidth + 100,
            windowHeight: gridRef.current.scrollHeight + 100,
            onclone: (clonedDoc) => {
                const element = clonedDoc.querySelector('[data-export-target="ssim-grid"]') as HTMLElement;
                if(element) {
                    element.style.overflow = 'visible';
                    element.style.height = 'auto';
                    element.style.width = 'fit-content';
                    element.style.maxWidth = 'none';
                    
                    // Fix sticky positioning for capture
                    const stickies = element.querySelectorAll('.sticky');
                    stickies.forEach(el => {
                        (el as HTMLElement).style.position = 'static';
                        (el as HTMLElement).style.transform = 'none';
                    });
                    
                    // Ensure table is fully visible
                    const table = element.querySelector('table');
                    if(table) table.style.width = '100%';
                }
            }
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `SSIM_Matrix_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
    } catch (e) {
        console.error("Export failed", e);
        alert("Failed to export image. Try maximizing the window.");
    }
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
      <div className="flex flex-col sm:flex-row flex-shrink-0 justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">SSIM Input</h2>
          <p className="text-slate-500 text-sm mt-1">Define upper triangle relationships.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded"><span className="font-bold">V</span>: i&rarr;j</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-100 text-amber-800 rounded"><span className="font-bold">A</span>: j&rarr;i</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-800 rounded"><span className="font-bold">X</span>: Mutual</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded"><span className="font-bold">O</span>: None</div>
          {comparisonData && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 text-red-600 rounded animate-pulse">
                <span className="font-bold">Mismatch</span>: Highlighted
              </div>
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
              <th className="sticky top-0 left-0 z-30 bg-slate-50 p-2 text-left text-slate-600 font-bold text-xs border-b border-r border-slate-300 min-w-[200px] shadow-sm w-[250px]">
                Factor i \ j
              </th>
              {factors.map((f, idx) => (
                <th key={f.id} className="sticky top-0 z-20 bg-slate-50 p-2 text-slate-700 font-bold text-xs w-12 text-center border-b border-slate-300 border-r border-slate-100 shadow-sm">
                   {/* Horizontal Upright ID */}
                   {f.name}
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

                  // Comparison Check
                  let isDiff = false;
                  let compareVal = null;
                  if (comparisonData && !isDiagonal && !isLower) {
                      compareVal = comparisonData[rowFactor.id]?.[colFactor.id] || SSIMValue.O;
                      isDiff = val !== compareVal;
                  }

                  if (isDiagonal) return <td key={colFactor.id} className="bg-slate-100 border border-slate-200"></td>;
                  if (isLower) return <td key={colFactor.id} onClick={() => handleLowerTriangleClick(rowFactor.id, colFactor.id, i, j)} className="bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-200"></td>;

                  return (
                    <td key={colFactor.id} className={`p-0.5 border border-slate-200 text-center relative ${isHighlighted ? 'bg-yellow-50' : ''}`}>
                        {isDiff && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full -mt-0.5 -mr-0.5 z-10 pointer-events-none shadow-sm"></div>}
                        <button
                          type="button"
                          onClick={() => toggleValue(rowFactor.id, colFactor.id)}
                          title={isDiff ? `Current: ${val} | Comparison: ${compareVal}` : undefined}
                          className={`w-full h-8 md:h-9 rounded-sm border font-bold text-xs md:text-sm transition-all flex items-center justify-center ${getCellColor(val)} 
                            ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}
                            ${isDiff ? 'ring-2 ring-red-500 ring-offset-1 border-red-500' : ''}
                          `}
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
            <input type="file" ref={compareInputRef} onChange={handleCompareImport} accept=".json" className="hidden" />
            
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

            <div className="hidden sm:block w-px h-8 bg-slate-300 mx-2"></div>

            <div className="flex bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden divide-x divide-slate-200">
                {comparisonData ? (
                     <button onClick={clearComparison} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium flex items-center gap-2 border-l border-red-200">
                        <X className="w-4 h-4" /> Stop Compare
                    </button>
                ) : (
                    <button onClick={() => compareInputRef.current?.click()} className="px-3 py-2 hover:bg-purple-50 text-slate-600 hover:text-purple-700 text-xs font-medium flex items-center gap-2 transition-colors">
                        <GitCompare className="w-4 h-4" /> Compare
                    </button>
                )}
            </div>
        </div>
        
        <button onClick={onNext} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-md shadow-sm flex items-center justify-center gap-2">
          Generate Model <Wand2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SSIMGrid;
        