import React, { useState } from 'react';
import { ISMResult, ISMElement } from '../types';
import HierarchyGraph from './HierarchyGraph';
import InterrelationshipGraph from './InterrelationshipGraph';
import AnalysisTable from './AnalysisTable';
import MicmacAnalysis from './MicmacAnalysis';
import { Download, Printer } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  result: ISMResult;
  onReset: () => void;
  onBack: () => void;
}

const ResultsView: React.FC<Props> = ({ factors, result, onReset, onBack }) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'digraph' | 'micmac' | 'analysis' | 'irm' | 'frm'>('hierarchy');

  const handleDownloadPNG = () => {
    // Note: Added micmac logic to png export if needed, 
    // but the generic ID selector needs to match the rendered component.
    let svgId = '';
    if (activeTab === 'digraph') svgId = 'interrelationship-graph-svg';
    else if (activeTab === 'hierarchy') svgId = 'hierarchy-graph-svg';
    else return; // Only support simple export for these two for now

    const svgElement = document.getElementById(svgId) as unknown as SVGSVGElement;
    if (!svgElement) return;

    // Use XMLSerializer to convert SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    // Create a canvas to draw the SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgRect = svgElement.getBoundingClientRect();
    
    // Scale for better resolution
    const scale = 2;
    canvas.width = svgRect.width * scale;
    canvas.height = svgRect.height * scale;
    
    if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);

        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const pngData = canvas.toDataURL('image/png');
            
            // Trigger download
            const link = document.createElement('a');
            link.href = pngData;
            link.download = `ISM_${activeTab === 'digraph' ? 'Digraph' : 'Hierarchy'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSimpleMatrix = (matrix: number[][]) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 border border-slate-200 bg-slate-50 text-slate-500">#</th>
            {factors.map((f, i) => (
              <th key={i} className="p-2 border border-slate-200 bg-slate-50 text-slate-700 w-10 text-center text-xs font-mono">{f.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
               <td className="p-2 border border-slate-200 bg-slate-50 text-slate-700 font-bold text-center text-xs font-mono whitespace-nowrap">{factors[i].name}</td>
               {row.map((val, j) => (
                 <td key={j} className={`p-2 border border-slate-200 text-center ${val === 1 ? 'text-emerald-700 bg-emerald-50 font-bold' : 'text-slate-400'}`}>
                   {val}
                 </td>
               ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFRMWithPowers = (frm: number[][], irm: number[][]) => {
    const size = frm.length;
    const drivingPowers = frm.map(row => row.reduce((sum, val) => sum + val, 0));
    const dependencePowers = Array.from({ length: size }, (_, colIndex) => 
      frm.reduce((sum, row) => sum + row[colIndex], 0)
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 border border-slate-200 bg-slate-50 text-slate-500 font-mono text-xs">i \ j</th>
              {factors.map((f, i) => (
                <th key={i} className="p-2 border border-slate-200 bg-slate-50 text-slate-700 w-10 text-center font-mono text-xs" title={f.name}>{f.name}</th>
              ))}
              <th className="p-2 border border-slate-200 bg-emerald-50 text-emerald-800 font-bold whitespace-nowrap text-center">Driving Power</th>
            </tr>
          </thead>
          <tbody>
            {frm.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                 <td className="p-2 border border-slate-200 bg-slate-50 text-slate-700 font-bold text-center whitespace-nowrap" title={factors[i].name}>
                    <div className="flex items-center gap-2">
                        <span className="w-8 text-right font-mono text-xs">{factors[i].name}</span>
                        <span className="font-normal text-xs text-slate-500 truncate max-w-[120px] hidden lg:block text-left">{factors[i].description}</span>
                    </div>
                 </td>
                 {row.map((val, j) => {
                   const isDirect = irm[i][j] === 1;
                   const isSelf = i === j;
                   
                   let displayVal: React.ReactNode = val;
                   let cellClass = "text-slate-300";
                   
                   if (val === 1) {
                       if (isDirect || isSelf) {
                           displayVal = "1";
                           cellClass = "text-emerald-900 font-bold bg-emerald-50";
                       } else {
                           displayVal = "1*"; // Transitive
                           cellClass = "text-amber-600 font-bold bg-amber-50";
                       }
                   } else {
                       displayVal = "0";
                   }

                   return (
                     <td key={j} className={`p-2 border border-slate-200 text-center ${cellClass}`}>
                       {displayVal}
                     </td>
                   );
                 })}
                 <td className="p-2 border border-slate-200 bg-emerald-50 text-emerald-800 font-bold text-center">
                    {drivingPowers[i]}
                 </td>
              </tr>
            ))}
            <tr className="bg-orange-50 font-bold border-t-2 border-orange-200">
                <td className="p-2 border border-slate-200 text-orange-800 font-bold text-center whitespace-nowrap">Dependence Power</td>
                {dependencePowers.map((val, j) => (
                    <td key={j} className="p-2 border border-slate-200 text-orange-700 text-center">
                        {val}
                    </td>
                ))}
                <td className="p-2 border border-slate-200 bg-slate-100"></td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 text-xs text-slate-500 flex gap-4">
            <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-800 bg-emerald-50 px-1 rounded">1</span>: Direct Relationship
            </div>
            <div className="flex items-center gap-2">
                <span className="font-bold text-amber-600 bg-amber-50 px-1 rounded">1*</span>: Transitive Relationship (Inferred)
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">ISM Model Analysis</h2>
          <p className="text-slate-500">Visual hierarchy, partitioning analysis, and matrix computations.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           <button 
             onClick={handlePrint}
             className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
           >
              <Printer className="w-4 h-4" /> Print PDF
           </button>
           {(activeTab === 'hierarchy' || activeTab === 'digraph') && (
               <button 
                 onClick={handleDownloadPNG}
                 className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
               >
                  <Download className="w-4 h-4" /> Export Graph
               </button>
           )}
           <div className="w-px h-8 bg-slate-300 mx-2 hidden md:block"></div>
           <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
            {[
                { id: 'hierarchy', label: 'Hierarchy' },
                { id: 'digraph', label: 'Digraph' },
                { id: 'micmac', label: 'MICMAC' },
                { id: 'analysis', label: 'Sets' },
                { id: 'frm', label: 'Final Matrix' },
                { id: 'irm', label: 'Initial Matrix' },
            ].map(tab => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                >
                {tab.label}
                </button>
            ))}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-xl min-h-[500px] print-content">
        {activeTab === 'hierarchy' && (
          <div className="p-4 h-full">
            <HierarchyGraph result={result} factors={factors} />
          </div>
        )}

        {activeTab === 'digraph' && (
          <div className="p-4 h-full">
            <InterrelationshipGraph result={result} factors={factors} />
          </div>
        )}

        {activeTab === 'micmac' && (
           <div className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">MICMAC Analysis</h3>
             <p className="text-sm text-slate-500 mb-4">Classification of factors based on driving power and dependence power.</p>
             <MicmacAnalysis result={result} factors={factors} />
           </div>
        )}

        {activeTab === 'analysis' && (
           <div className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">Level Partitioning & Set Analysis</h3>
             <AnalysisTable factors={factors} result={result} />
           </div>
        )}

        {activeTab === 'irm' && (
           <div className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">Initial Reachability Matrix (IRM)</h3>
             {renderSimpleMatrix(result.initialReachabilityMatrix)}
           </div>
        )}

        {activeTab === 'frm' && (
           <div className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">Final Reachability Matrix (Transitive)</h3>
             <p className="text-sm text-slate-500 mb-4">Includes implied links derived from transitivity (if A&rarr;B and B&rarr;C, then A&rarr;C).</p>
             {renderFRMWithPowers(result.finalReachabilityMatrix, result.initialReachabilityMatrix)}
           </div>
        )}
      </div>

      <div className="flex justify-between pt-4 no-print">
        <button
          onClick={onBack}
          className="px-6 py-3 text-slate-500 hover:text-slate-900 transition-colors"
        >
          Modify SSIM
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Start New Project
        </button>
      </div>
    </div>
  );
};

export default ResultsView;