import React, { useState } from 'react';
import { ISMResult, ISMElement } from '../types';
import HierarchyGraph from './HierarchyGraph';
import { Download, Printer } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  result: ISMResult;
  onReset: () => void;
  onBack: () => void;
}

const ResultsView: React.FC<Props> = ({ factors, result, onReset, onBack }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'irm' | 'frm' | 'levels'>('graph');

  const handleDownloadPNG = () => {
    const svgElement = document.getElementById('hierarchy-graph-svg') as unknown as SVGSVGElement;
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
            link.download = 'ISM_Hierarchy_Model.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderMatrix = (matrix: number[][]) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 border border-slate-200 bg-slate-50 text-slate-500">#</th>
            {factors.map((_, i) => (
              <th key={i} className="p-2 border border-slate-200 bg-slate-50 text-slate-700 w-10 text-center">{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
               <td className="p-2 border border-slate-200 bg-slate-50 text-slate-700 font-bold text-center">{i + 1}</td>
               {row.map((val, j) => (
                 <td key={j} className={`p-2 border border-slate-200 text-center ${val === 1 ? 'text-emerald-600 bg-emerald-50 font-bold' : 'text-slate-400'}`}>
                   {val}
                 </td>
               ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">ISM Model Analysis</h2>
          <p className="text-slate-500">Visual hierarchy and matrix computations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={handlePrint}
             className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
           >
              <Printer className="w-4 h-4" /> Print PDF
           </button>
           {activeTab === 'graph' && (
               <button 
                 onClick={handleDownloadPNG}
                 className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
               >
                  <Download className="w-4 h-4" /> Export PNG
               </button>
           )}
           <div className="w-px h-8 bg-slate-300 mx-2 hidden md:block"></div>
           <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
            {(['graph', 'levels', 'frm', 'irm'] as const).map(tab => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
                >
                {tab === 'graph' ? 'Graph' : 
                tab === 'levels' ? 'Levels' :
                tab === 'frm' ? 'Final Matrix' : 'Init. Matrix'}
                </button>
            ))}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-xl min-h-[500px] print-content">
        {activeTab === 'graph' && (
          <div className="p-4 h-full">
            <HierarchyGraph result={result} factors={factors} />
          </div>
        )}

        {activeTab === 'irm' && (
           <div className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">Initial Reachability Matrix (IRM)</h3>
             {renderMatrix(result.initialReachabilityMatrix)}
           </div>
        )}

        {activeTab === 'frm' && (
           <div className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">Final Reachability Matrix (Transitive)</h3>
             <p className="text-sm text-slate-500 mb-4">Includes implied links derived from transitivity (if A&rarr;B and B&rarr;C, then A&rarr;C).</p>
             {renderMatrix(result.finalReachabilityMatrix)}
           </div>
        )}

        {activeTab === 'levels' && (
           <div className="p-6">
             <h3 className="text-lg font-semibold text-slate-900 mb-4">Level Partitioning Iterations</h3>
             <div className="space-y-4">
               {result.levels.map((lvl) => (
                 <div key={lvl.level} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                   <h4 className="text-indigo-600 font-bold mb-2">Level {lvl.level}</h4>
                   <div className="flex flex-wrap gap-2">
                     {lvl.elements.map(idx => (
                       <div key={idx} className="bg-white px-3 py-1 rounded border border-slate-200 text-slate-700 text-sm flex items-center gap-2 shadow-sm">
                         <span className="font-mono text-slate-400">{idx + 1}.</span>
                         {factors[idx].name}
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
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