
import React, { useState, useRef } from 'react';
import { ISMResult, ISMElement } from '../types';
import HierarchyGraph from './HierarchyGraph';
import InterrelationshipGraph from './InterrelationshipGraph';
import AnalysisTable from './AnalysisTable';
import MicmacAnalysis from './MicmacAnalysis';
import { Download, Printer, ArrowLeft, RefreshCw, FileSpreadsheet } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";

interface Props {
  factors: ISMElement[];
  result: ISMResult;
  onReset: () => void;
  onBack: () => void;
}

const ResultsView: React.FC<Props> = ({ factors, result, onReset, onBack }) => {
  // Default to Initial Reachability Matrix ('irm')
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'digraph' | 'micmac' | 'analysis' | 'irm' | 'frm'>('irm');
  const exportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!exportRef.current) return;

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // High resolution
        logging: false,
        windowWidth: 3000, // Simulate wide window to capture full width tables/charts
        onclone: (clonedDoc) => {
            // 1. Inject Global Styles for Font
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
                * { 
                    font-family: "Times New Roman", Times, serif !important; 
                    -webkit-font-smoothing: antialiased;
                }
            `;
            clonedDoc.head.appendChild(style);

            // 2. Prepare Main Container
            const element = clonedDoc.querySelector('.print-content') as HTMLElement;
            if (element) {
                element.style.width = 'fit-content';
                element.style.minWidth = '100%';
                element.style.height = 'auto';
                element.style.overflow = 'visible';
                element.style.padding = '40px';
                
                // 3. Expand All Scrollable Areas
                const scrollables = element.querySelectorAll('.overflow-x-auto, .overflow-auto');
                scrollables.forEach(el => {
                    const htmlEl = el as HTMLElement;
                    htmlEl.style.overflow = 'visible';
                    htmlEl.style.width = 'max-content'; // Force full width
                    htmlEl.style.maxWidth = 'none';
                    htmlEl.style.display = 'block';
                });

                // 4. Ensure Keys don't wrap
                const keys = element.querySelectorAll('.matrix-key');
                keys.forEach(el => {
                   (el as HTMLElement).style.whiteSpace = 'nowrap';
                   (el as HTMLElement).style.width = 'max-content';
                });

                // 5. Expand truncated text (Fix for Micmac lists export)
                const truncated = clonedDoc.querySelectorAll('.truncate');
                truncated.forEach(el => {
                    el.classList.remove('truncate');
                    const htmlEl = el as HTMLElement;
                    htmlEl.style.whiteSpace = 'normal';
                    htmlEl.style.overflow = 'visible';
                    htmlEl.style.textOverflow = 'clip';
                    htmlEl.style.wordBreak = 'break-word';
                });
            }
            
            // 6. Inject style for SVGs to ensure they use Times New Roman
            const svgs = clonedDoc.querySelectorAll('svg');
            svgs.forEach(svg => {
                const svgStyle = clonedDoc.createElement('style');
                svgStyle.innerHTML = `
                    text { font-family: "Times New Roman", Times, serif !important; }
                    .node text { font-family: "Times New Roman", Times, serif !important; }
                    foreignObject div { font-family: "Times New Roman", Times, serif !important; }
                `;
                svg.prepend(svgStyle);
                // Ensure SVG is fully visible
                svg.setAttribute('width', '100%');
                svg.style.width = '100%';
                svg.style.maxWidth = 'none';
                svg.style.overflow = 'visible';
            });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ISM_${activeTab}_Report.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF.");
    }
  };

  const handleDownloadPNG = async () => {
    // Method 1: SVG Serializer (Best for pure SVG Graphs like Hierarchy/Digraph)
    if (activeTab === 'digraph' || activeTab === 'hierarchy') {
        let svgId = '';
        if (activeTab === 'digraph') svgId = 'interrelationship-graph-svg';
        else if (activeTab === 'hierarchy') svgId = 'hierarchy-graph-svg';
        
        const svgElement = document.getElementById(svgId) as unknown as SVGSVGElement;
        if (svgElement) {
            // Clone the SVG node to manipulate it safely without affecting the live DOM
            const clone = svgElement.cloneNode(true) as SVGSVGElement;
            
            // Inject Times New Roman style
            const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
            style.textContent = `
                text { font-family: "Times New Roman", Times, serif !important; }
                .node text { font-family: "Times New Roman", Times, serif !important; }
                foreignObject div { font-family: "Times New Roman", Times, serif !important; }
            `;
            clone.prepend(style);

            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(clone);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Use viewBox for true dimensions to avoid clipping if container is smaller
            const vbWidth = svgElement.viewBox.baseVal.width;
            const vbHeight = svgElement.viewBox.baseVal.height;
            
            const scale = 2; // High resolution
            const padding = 50; // Add white padding around the image
            
            canvas.width = (vbWidth + padding * 2) * scale;
            canvas.height = (vbHeight + padding * 2) * scale;
            
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const img = new Image();
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
                img.onload = () => {
                    // Draw image centered with padding
                    ctx.drawImage(img, padding * scale, padding * scale, vbWidth * scale, vbHeight * scale);
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `ISM_${activeTab === 'digraph' ? 'Digraph' : 'Hierarchy'}.png`;
                    link.click();
                };
            }
            return;
        }
    }

    // Method 2: html2canvas (For Mixed HTML/SVG content like Tables, MICMAC)
    if (exportRef.current) {
        try {
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // High resolution
                logging: false,
                windowWidth: 3000, // Simulate wide window
                onclone: (clonedDoc) => {
                    // 1. Inject Global Styles for Font
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * { 
                            font-family: "Times New Roman", Times, serif !important; 
                            -webkit-font-smoothing: antialiased;
                        }
                    `;
                    clonedDoc.head.appendChild(style);

                    // 2. Prepare Main Container
                    const element = clonedDoc.querySelector('.print-content') as HTMLElement;
                    if (element) {
                        element.style.width = 'fit-content';
                        element.style.minWidth = '100%';
                        element.style.height = 'auto';
                        element.style.overflow = 'visible';
                        element.style.padding = '50px';
                        
                        // 3. Expand All Scrollable Areas
                        const scrollables = element.querySelectorAll('.overflow-x-auto, .overflow-auto');
                        scrollables.forEach(el => {
                            const htmlEl = el as HTMLElement;
                            htmlEl.style.overflow = 'visible';
                            htmlEl.style.width = 'max-content'; // Force full width
                            htmlEl.style.maxWidth = 'none';
                            htmlEl.style.display = 'block';
                        });

                        // 4. Ensure Keys don't wrap
                        const keys = element.querySelectorAll('.matrix-key');
                        keys.forEach(el => {
                           (el as HTMLElement).style.whiteSpace = 'nowrap';
                           (el as HTMLElement).style.width = 'max-content';
                        });

                        // 5. Expand truncated text
                        const truncated = clonedDoc.querySelectorAll('.truncate');
                        truncated.forEach(el => {
                            el.classList.remove('truncate');
                            const htmlEl = el as HTMLElement;
                            htmlEl.style.whiteSpace = 'normal';
                            htmlEl.style.overflow = 'visible';
                            htmlEl.style.textOverflow = 'clip';
                            htmlEl.style.wordBreak = 'break-word';
                        });
                    }
                    
                    // 6. Inject style for SVGs (like Micmac)
                    const svgs = clonedDoc.querySelectorAll('svg');
                    svgs.forEach(svg => {
                        const svgStyle = clonedDoc.createElement('style');
                        svgStyle.innerHTML = `
                            text { font-family: "Times New Roman", Times, serif !important; }
                            foreignObject div { font-family: "Times New Roman", Times, serif !important; }
                        `;
                        svg.prepend(svgStyle);
                        svg.setAttribute('width', '100%');
                        svg.style.width = '100%';
                        svg.style.maxWidth = 'none';
                        svg.style.overflow = 'visible';
                    });
                }
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `ISM_${activeTab}_Result.png`;
            link.click();
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to generate image.");
        }
    }
  };

  const handleExportExcel = () => {
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';
    
    const sheets = [
        { name: 'Level Partition', id: 'sheet1', content: generateAnalysisTableHTML() },
        { name: 'Final Matrix', id: 'sheet2', content: generateMatrixHTML(result.finalReachabilityMatrix, result.initialReachabilityMatrix, true) },
        { name: 'Initial Matrix', id: 'sheet3', content: generateMatrixHTML(result.initialReachabilityMatrix, null, false) }
    ];

    sheets.forEach(sheet => {
        excelContent += `<x:ExcelWorksheet><x:Name>${sheet.name}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`;
    });

    excelContent += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    // Add Times New Roman style for Excel
    excelContent += '<style>body, table { font-family: "Times New Roman", Times, serif; }</style>';
    excelContent += '</head><body>';

    sheets.forEach(sheet => {
        excelContent += sheet.content;
    });

    excelContent += '</body></html>';

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ISM_Analysis_Results_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  // Helper to generate HTML Table for Analysis
  const generateAnalysisTableHTML = () => {
      let html = '<table><thead><tr><th>Factor</th><th>Reachability Set</th><th>Antecedent Set</th><th>Intersection</th><th>Level</th></tr></thead><tbody>';
      
      const { finalReachabilityMatrix, levels } = result;
      const size = factors.length;
      const levelMap = new Map<number, number>();
      levels.forEach(l => l.elements.forEach(idx => levelMap.set(idx, l.level)));

      factors.forEach((factor, i) => {
        const reachabilitySet = [];
        const antecedentSet = [];
        for (let j = 0; j < size; j++) {
            if (finalReachabilityMatrix[i][j] === 1) reachabilitySet.push(factors[j].name);
            if (finalReachabilityMatrix[j][i] === 1) antecedentSet.push(factors[j].name);
        }
        const intersection = reachabilitySet.filter(x => antecedentSet.includes(x));
        
        html += `<tr><td>${factor.name}</td><td>${reachabilitySet.join(', ')}</td><td>${antecedentSet.join(', ')}</td><td>${intersection.join(', ')}</td><td>${levelMap.get(i)}</td></tr>`;
      });
      html += '</tbody></table><br/>';
      return html;
  };

  // Helper to generate HTML Table for Matrices
  const generateMatrixHTML = (matrix: number[][], irm: number[][] | null, isFinal: boolean) => {
      let html = '<table>';
      if(isFinal) {
          html += '<tr><td colspan="5" style="font-weight:bold">Key:</td></tr>';
          html += '<tr><td colspan="5">1: Direct Relationship</td></tr>';
          html += '<tr><td colspan="5">1*: Transitive Relationship</td></tr>';
          html += '<tr><td colspan="5">0: No Relationship</td></tr>';
          html += '<tr><td colspan="5"></td></tr>';
      }
      html += '<thead><tr><th>i \\ j</th>';
      // Columns: Short Name/ID Only
      factors.forEach(f => html += `<th>${f.name}</th>`);
      if(isFinal) html += '<th>Driving Power</th>';
      html += '</tr></thead><tbody>';
      const size = matrix.length;
      const drivingPowers = matrix.map(row => row.reduce((sum, val) => sum + val, 0));
      const dependencePowers = Array.from({ length: size }, (_, colIndex) => matrix.reduce((sum, row) => sum + row[colIndex], 0));
      matrix.forEach((row, i) => {
          // Rows: Full Name/Description
          html += `<tr><td>${factors[i].name}: ${factors[i].description || ''}</td>`;
          row.forEach((val, j) => {
              let displayVal = val.toString();
              if (isFinal && irm && val === 1) {
                   const isDirect = irm[i][j] === 1;
                   const isSelf = i === j;
                   if (!isDirect && !isSelf) displayVal = "1*";
              }
              html += `<td>${displayVal}</td>`;
          });
          if(isFinal) html += `<td>${drivingPowers[i]}</td>`;
          html += '</tr>';
      });
      if(isFinal) {
          html += '<tr><td>Dependence Power</td>';
          dependencePowers.forEach(val => html += `<td>${val}</td>`);
          html += '<td></td></tr>';
      }
      html += '</tbody></table><br/>';
      return html;
  };

  const renderSimpleMatrix = (matrix: number[][]) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded border border-slate-200 matrix-key whitespace-nowrap">
          <span className="font-bold text-slate-700">Key:</span>
          <div className="flex items-center gap-1.5"><span className="min-w-[1.5rem] h-6 px-1 flex items-center justify-center bg-blue-100 text-blue-900 font-bold border border-blue-200 rounded text-[10px]">1</span> Relationship</div>
          <div className="flex items-center gap-1.5"><span className="min-w-[1.5rem] h-6 px-1 flex items-center justify-center bg-white text-slate-300 border border-slate-200 rounded text-[10px]">0</span> No Relation</div>
      </div>
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-collapse text-sm border border-slate-300 table-auto">
          <thead>
            <tr>
              <th className="p-2 border border-slate-300 bg-slate-800 text-white font-mono text-xs text-left min-w-[200px]">i \ j</th>
              {factors.map((f, i) => (
                <th key={i} className="p-2 border border-slate-300 bg-slate-100 text-slate-800 text-center text-xs font-bold font-mono px-3 w-auto">
                    {/* Columns: Short ID Only, Horizontal, Auto Width */}
                    {f.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-2 border border-slate-300 bg-slate-100 text-slate-800 font-bold text-left text-xs whitespace-normal leading-tight min-w-[200px]" title={factors[i].description}>
                  {/* Rows: Full Description */}
                  <span className="mr-1">{factors[i].name}:</span>
                  <span className="font-normal text-slate-600">{factors[i].description}</span>
                </td>
                {row.map((val, j) => (
                  <td key={j} className={`p-2 border border-slate-300 text-center ${val === 1 ? 'text-blue-900 bg-blue-50 font-bold' : 'text-slate-300'}`}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFRMWithPowers = (frm: number[][], irm: number[][]) => {
    const size = frm.length;
    const drivingPowers = frm.map(row => row.reduce((sum, val) => sum + val, 0));
    const dependencePowers = Array.from({ length: size }, (_, colIndex) => 
      frm.reduce((sum, row) => sum + row[colIndex], 0)
    );

    return (
      <div className="space-y-4">
        {/* Key / Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-50 p-3 rounded border border-slate-200 matrix-key whitespace-nowrap">
            <span className="font-bold text-slate-700">Key:</span>
            <div className="flex items-center gap-1.5"><span className="min-w-[1.5rem] h-6 px-1 flex items-center justify-center bg-blue-100 text-blue-900 font-bold border border-blue-200 rounded text-[10px]">1</span> Direct</div>
            <div className="flex items-center gap-1.5"><span className="min-w-[1.5rem] h-6 px-1 flex items-center justify-center bg-amber-100 text-amber-900 font-bold border border-amber-200 rounded text-[10px]">1*</span> Transitive</div>
            <div className="flex items-center gap-1.5"><span className="min-w-[1.5rem] h-6 px-1 flex items-center justify-center bg-white text-slate-300 border border-slate-200 rounded text-[10px]">0</span> No Relation</div>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full border-collapse text-sm border border-slate-300 table-auto">
            <thead>
              <tr>
                <th className="p-2 border border-slate-300 bg-slate-800 text-white font-mono text-xs text-left min-w-[200px]">i \ j</th>
                {factors.map((f, i) => (
                  <th key={i} className="p-2 border border-slate-300 bg-slate-100 text-slate-800 text-center text-xs font-bold font-mono px-3 w-auto">
                     {/* Columns: Short ID Only, Horizontal */}
                     {f.name}
                  </th>
                ))}
                <th className="p-2 border border-slate-300 bg-indigo-100 text-indigo-900 font-bold text-center text-xs uppercase tracking-wider w-[120px] px-2 whitespace-nowrap">
                    Driving Power
                </th>
              </tr>
            </thead>
            <tbody>
              {frm.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                   <td className="p-2 border border-slate-300 bg-slate-100 text-slate-800 font-bold text-left whitespace-normal text-xs leading-tight min-w-[200px]" title={factors[i].description}>
                        {/* Rows: Full Description */}
                        <span className="mr-1">{factors[i].name}:</span>
                        <span className="font-normal text-slate-600">{factors[i].description}</span>
                   </td>
                   {row.map((val, j) => {
                     const isDirect = irm[i][j] === 1;
                     const isSelf = i === j;
                     let displayVal: React.ReactNode = val;
                     let cellClass = "text-slate-300";
                     if (val === 1) {
                         if (isDirect || isSelf) {
                             displayVal = "1";
                             cellClass = "text-blue-900 font-bold bg-blue-50";
                         } else {
                             displayVal = "1*";
                             cellClass = "text-amber-700 font-bold bg-amber-50";
                         }
                     } else displayVal = "0";
                     return <td key={j} className={`p-2 border border-slate-300 text-center ${cellClass}`}>{displayVal}</td>;
                   })}
                   <td className="p-2 border border-slate-300 bg-indigo-50 text-indigo-800 font-bold text-center">{drivingPowers[i]}</td>
                </tr>
              ))}
              <tr className="font-bold">
                  <td className="p-2 border border-slate-300 bg-teal-100 text-teal-900 font-bold text-center whitespace-nowrap text-xs uppercase tracking-wider">Dependence Power</td>
                  {dependencePowers.map((val, j) => <td key={j} className="p-2 border border-slate-300 bg-teal-50 text-teal-800 text-center">{val}</td>)}
                  <td className="p-2 border border-slate-300 bg-slate-200"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Model Results</h2>
          <p className="text-slate-500 text-sm">Structural analysis and visualizations.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
           <div className="grid grid-cols-2 sm:flex gap-3">
               <button onClick={handleDownloadPDF} className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-xs font-bold shadow-sm">
                  <Printer className="w-4 h-4" /> PDF Report
               </button>
               
               {(activeTab === 'analysis' || activeTab === 'frm' || activeTab === 'irm') && (
                 <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-xs font-bold shadow-sm animate-in fade-in">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
                 </button>
               )}

               <button onClick={handleDownloadPNG} className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-xs font-bold shadow-sm">
                  <Download className="w-4 h-4" /> Image
               </button>
           </div>

           <div className="hidden sm:block w-px h-8 bg-slate-300 mx-1"></div>
           
           <div className="flex bg-slate-100 p-1 rounded-md overflow-x-auto max-w-full">
            {[
                { id: 'irm', label: 'Initial' },
                { id: 'frm', label: 'Final' },
                { id: 'analysis', label: 'Partition' }, // Changed from Sets
                { id: 'digraph', label: 'Digraph' },
                { id: 'hierarchy', label: 'Hierarchy' },
                { id: 'micmac', label: 'MICMAC' },
            ].map(tab => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                >
                {tab.label}
                </button>
            ))}
            </div>
        </div>
      </div>

      <div ref={exportRef} className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[600px] print-content">
        {activeTab === 'hierarchy' && (
             <div className="p-4 h-full overflow-x-auto">
                <HierarchyGraph result={result} factors={factors} />
             </div>
        )}
        {activeTab === 'digraph' && (
             <div className="p-4 h-full overflow-x-auto">
                <InterrelationshipGraph result={result} factors={factors} />
             </div>
        )}
        {activeTab === 'micmac' && (
            <div className="p-6 overflow-x-auto">
                <div className="flex justify-between items-center mb-4 min-w-[600px]">
                    <h3 className="font-bold text-slate-900">Results of MICMAC analysis of factors / barriers</h3>
                </div>
                <MicmacAnalysis result={result} factors={factors} />
            </div>
        )}
        {activeTab === 'analysis' && (
            <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-4">Results of level partition</h3>
                <AnalysisTable factors={factors} result={result} />
            </div>
        )}
        {activeTab === 'irm' && (
            <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-4">Initial reachability matrix</h3>
                {renderSimpleMatrix(result.initialReachabilityMatrix)}
            </div>
        )}
        {activeTab === 'frm' && (
            <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-4">Final reachability matrix</h3>
                {renderFRMWithPowers(result.finalReachabilityMatrix, result.initialReachabilityMatrix)}
            </div>
        )}
      </div>

      <div className="flex justify-between pt-6 no-print">
        <button onClick={onBack} className="px-5 py-2.5 border border-slate-300 bg-white text-slate-600 rounded-md hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
           <ArrowLeft className="w-4 h-4" /> Modify Inputs
        </button>
        <button onClick={onReset} className="px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 text-sm font-medium flex items-center gap-2">
           <RefreshCw className="w-4 h-4" /> New Project
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
