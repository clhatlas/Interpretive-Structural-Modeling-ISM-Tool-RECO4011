
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
  isExport?: boolean;
}

const InterrelationshipGraph: React.FC<Props> = ({ result, factors, isExport = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = Array.from(new Set(factors.map(f => f.category).filter(Boolean))) as string[];

  useEffect(() => {
    if (!result || !svgRef.current || (!containerRef.current && !isExport)) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    // USE INITIAL REACHABILITY MATRIX
    const { initialReachabilityMatrix } = result;
    
    // Scale Configuration
    const containerWidth = containerRef.current?.clientWidth || 800;
    
    // Export: 2400x2400 canvas. Screen: responsive width, fixed 600 height.
    const width = isExport ? 2400 : Math.max(containerWidth, 600);
    const height = isExport ? 2400 : 600; 
    
    const margin = isExport ? 200 : 60;
    const radius = Math.min(width, height) / 2 - margin; 
    
    // Restoring visual proportions of screen mode for export (approx 3-4x scale)
    const nodeRadius = isExport ? 70 : 24; 
    const fontSize = isExport ? "48px" : "12px";
    const strokeWidthNormal = isExport ? 4 : 1.5;
    const strokeWidthMutual = isExport ? 8 : 2.5;
    const markerScale = isExport ? 4 : 1;
    const gap = isExport ? 20 : 5;

    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff");

    // --- Marker Positioning Logic ---
    const arrowDist = nodeRadius + gap;
    // refX calculation: 
    // The path ends at (target.x, target.y).
    // The marker is drawn such that its (refX, refY) aligns with that end point.
    // We want the tip of the arrow to stop 'arrowDist' away from the center of the node.
    // Standard arrow path is M0,-5L10,0L0,5 (tip at 10,0). Length 10.
    // Scaled length = 10 * markerScale.
    
    const defs = svg.append("defs");

    // Standard End Arrow (Grey)
    defs.append("marker")
      .attr("id", isExport ? "arrowhead-end-grey-exp" : "arrowhead-end-grey")
      .attr("viewBox", "0 -5 10 10")
      // If we want the tip (x=10) to be 'arrowDist' away from node center:
      // The line stops at node center (conceptually) or we shorten the line.
      // D3 lines go center-to-center. 
      // So refX should be such that the marker tip is at (LineLen - nodeRadius - gap).
      // refX = 10 + (nodeRadius + gap) / markerScale
      .attr("refX", 10 + arrowDist / markerScale) 
      .attr("refY", 0)
      .attr("markerWidth", 10 * markerScale)
      .attr("markerHeight", 10 * markerScale)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Mutual End Arrow (Purple)
    defs.append("marker")
      .attr("id", isExport ? "arrowhead-end-purple-exp" : "arrowhead-end-purple")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10 + arrowDist / markerScale)
      .attr("refY", 0)
      .attr("markerWidth", 10 * markerScale)
      .attr("markerHeight", 10 * markerScale)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#8b5cf6");

    // Mutual Start Arrow (Purple)
    // Tip at 0,0. Back at 10,0.
    // We want tip at distance 'arrowDist' from source node.
    // Line starts at source center.
    // So marker should be placed at source center? No, marker-start is at start of line.
    // We need to shift it forward by arrowDist.
    // refX = -arrowDist / markerScale.
    defs.append("marker")
      .attr("id", isExport ? "arrowhead-start-purple-exp" : "arrowhead-start-purple")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", -arrowDist / markerScale)
      .attr("refY", 0)
      .attr("markerWidth", 10 * markerScale)
      .attr("markerHeight", 10 * markerScale)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M10,-5L0,0L10,5") // Points Left (towards 0,0)
      .attr("fill", "#8b5cf6");

    // Create Nodes in a Circle
    const nodes = factors.map((f, i) => {
        const angle = (i / factors.length) * 2 * Math.PI - Math.PI / 2; // Start from top
        return {
            id: i,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            data: f
        };
    });

    // Process Links
    const links: any[] = [];
    const processedMutuals = new Set<string>();

    for(let i=0; i<initialReachabilityMatrix.length; i++) {
        for(let j=0; j<initialReachabilityMatrix.length; j++) {
            if(initialReachabilityMatrix[i][j] === 1 && i !== j) {
                const isMutual = initialReachabilityMatrix[j][i] === 1;
                
                if (isMutual) {
                    const key = [Math.min(i, j), Math.max(i, j)].join('-');
                    if (!processedMutuals.has(key)) {
                        links.push({ source: nodes[i], target: nodes[j], type: 'mutual' });
                        processedMutuals.add(key);
                    }
                } else {
                    links.push({ source: nodes[i], target: nodes[j], type: 'direct' });
                }
            }
        }
    }

    const midId = isExport ? "-exp" : "";

    // Draw Links
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("d", (d: any) => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`)
        .attr("fill", "none")
        .attr("stroke", (d:any) => d.type === 'mutual' ? "#8b5cf6" : "#94a3b8")
        .attr("stroke-width", (d:any) => d.type === 'mutual' ? strokeWidthMutual : strokeWidthNormal)
        .attr("marker-end", (d:any) => d.type === 'mutual' ? `url(#arrowhead-end-purple${midId})` : `url(#arrowhead-end-grey${midId})`)
        .attr("marker-start", (d:any) => d.type === 'mutual' ? `url(#arrowhead-start-purple${midId})` : null)
        .attr("opacity", (d:any) => d.type === 'mutual' ? 1 : 0.6);

    // Draw Nodes
    const nodeGroups = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", "white")
        .attr("stroke", (d: any) => getCategoryColorHex(d.data.category))
        .attr("stroke-width", isExport ? 6 : 3)
        .attr("cursor", isExport ? "default" : "pointer")
        .on("mouseover", function() { if(!isExport) d3.select(this).attr("fill", "#f1f5f9"); })
        .on("mouseout", function() { if(!isExport) d3.select(this).attr("fill", "white"); });

    nodeGroups.append("text")
        .attr("dy", isExport ? 16 : 5)
        .attr("text-anchor", "middle")
        .text((d) => d.data.name)
        .attr("font-size", fontSize)
        .attr("font-weight", "bold")
        .attr("font-family", "Times New Roman, Times, serif")
        .attr("fill", "#1e293b")
        .style("pointer-events", "none");

  }, [result, factors, isExport]);

  return (
    <div 
        ref={containerRef} 
        className={`w-full bg-white flex flex-col items-center pb-8 ${isExport ? '' : 'rounded-xl border border-slate-200 shadow-inner overflow-hidden'}`}
    >
        <div className={`w-full ${isExport ? '' : 'overflow-x-auto'}`}>
            <svg id={isExport ? "interrelationship-graph-svg-export" : "interrelationship-graph-svg"} ref={svgRef} className="block mx-auto"></svg>
        </div>
        
        {/* HTML Legend */}
        <div className={`mt-4 flex flex-col items-center px-6 text-center graph-legend-container ${isExport ? 'mt-16' : ''}`}>
            <h3 className={`${isExport ? 'text-6xl mb-16' : 'text-lg mb-6'} font-bold text-slate-800 graph-legend-title`}>Interrelationships between factors / barriers</h3>
            
            {/* Arrow Types Legend */}
            <div className={`flex flex-wrap justify-center ${isExport ? 'gap-x-24 gap-y-12 mb-16 pb-16' : 'gap-x-10 gap-y-4 mb-6 pb-6'} border-b border-slate-200 w-full max-w-4xl`}>
                 <div className="flex items-center gap-3 graph-legend-item">
                     <div className={`${isExport ? 'w-48' : 'w-10'} h-px bg-slate-400 relative flex-shrink-0`}>
                         <div className={`absolute right-0 top-1/2 -translate-y-1/2 border-t-[${isExport ? '20px' : '5px'}] border-t-transparent border-b-[${isExport ? '20px' : '5px'}] border-b-transparent border-l-[${isExport ? '32px' : '8px'}] border-l-slate-400`}></div>
                     </div>
                     <span className={`${isExport ? 'text-5xl' : 'text-sm'} text-slate-600 font-medium whitespace-nowrap`}>One-way Arrow (V/A)</span>
                 </div>
                 <div className="flex items-center gap-3 graph-legend-item">
                     <div className={`${isExport ? 'w-48' : 'w-10'} h-px bg-violet-500 relative flex-shrink-0`}>
                          <div className={`absolute left-0 top-1/2 -translate-y-1/2 border-t-[${isExport ? '20px' : '5px'}] border-t-transparent border-b-[${isExport ? '20px' : '5px'}] border-b-transparent border-r-[${isExport ? '32px' : '8px'}] border-r-violet-500`}></div>
                         <div className={`absolute right-0 top-1/2 -translate-y-1/2 border-t-[${isExport ? '20px' : '5px'}] border-t-transparent border-b-[${isExport ? '20px' : '5px'}] border-b-transparent border-l-[${isExport ? '32px' : '8px'}] border-l-violet-500`}></div>
                     </div>
                     <span className={`${isExport ? 'text-5xl' : 'text-sm'} text-slate-600 font-medium whitespace-nowrap`}>Two-way Arrow (X)</span>
                 </div>
            </div>

            {/* Categories Legend */}
            <div className={`flex flex-wrap justify-center ${isExport ? 'gap-x-24 gap-y-12' : 'gap-x-6 gap-y-3'}`}>
                {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 graph-legend-item">
                        <span className={`${isExport ? 'w-16 h-16 border-4' : 'w-3 h-3 border'} rounded-full border-slate-300 flex-shrink-0`} style={{backgroundColor: getCategoryColorHex(cat)}}></span>
                        <span className={`${isExport ? 'text-5xl' : 'text-sm'} text-slate-600 font-medium`}>{cat}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default InterrelationshipGraph;
