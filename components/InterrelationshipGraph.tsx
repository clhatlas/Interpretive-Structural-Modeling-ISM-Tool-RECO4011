
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
}

const InterrelationshipGraph: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = Array.from(new Set(factors.map(f => f.category).filter(Boolean))) as string[];

  useEffect(() => {
    if (!result || !svgRef.current || !containerRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    // USE INITIAL REACHABILITY MATRIX
    const { initialReachabilityMatrix } = result;
    const containerWidth = containerRef.current.clientWidth || 800;
    
    const width = Math.max(containerWidth, 600);
    const height = 600; // Fixed height for graph part
    
    const radius = Math.min(width, 600) / 2 - 60; 
    const nodeRadius = 24;
    const centerX = width / 2;
    const centerY = 300; // Center of graph area

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff");

    // --- Marker Positioning Logic ---
    const arrowDist = nodeRadius + 5;
    const refXEnd = 10 + arrowDist;
    const refXStart = -arrowDist;

    const defs = svg.append("defs");

    // Standard End Arrow (Grey)
    defs.append("marker")
      .attr("id", "arrowhead-end-grey")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", refXEnd) 
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Mutual End Arrow (Purple)
    defs.append("marker")
      .attr("id", "arrowhead-end-purple")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", refXEnd)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#8b5cf6");

    // Mutual Start Arrow (Purple)
    defs.append("marker")
      .attr("id", "arrowhead-start-purple")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", refXStart)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .attr("markerUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", "M10,-5L0,0L10,5") // Points Left
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

    // Draw Links
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("d", (d: any) => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`)
        .attr("fill", "none")
        .attr("stroke", (d:any) => d.type === 'mutual' ? "#8b5cf6" : "#94a3b8")
        .attr("stroke-width", (d:any) => d.type === 'mutual' ? 2.5 : 1.5)
        .attr("marker-end", (d:any) => d.type === 'mutual' ? "url(#arrowhead-end-purple)" : "url(#arrowhead-end-grey)")
        .attr("marker-start", (d:any) => d.type === 'mutual' ? "url(#arrowhead-start-purple)" : null)
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
        .attr("stroke-width", 3)
        .attr("cursor", "pointer")
        .on("mouseover", function() { d3.select(this).attr("fill", "#f1f5f9"); })
        .on("mouseout", function() { d3.select(this).attr("fill", "white"); });

    nodeGroups.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d) => d.data.name)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("font-family", "Times New Roman, Times, serif")
        .attr("fill", "#1e293b")
        .style("pointer-events", "none");

  }, [result, factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden flex flex-col items-center pb-8">
        <div className="w-full overflow-x-auto">
            <svg id="interrelationship-graph-svg" ref={svgRef} className="block mx-auto"></svg>
        </div>
        
        {/* HTML Legend */}
        <div className="mt-4 flex flex-col items-center px-6 text-center graph-legend-container">
            <h3 className="text-lg font-bold text-slate-800 mb-6 graph-legend-title">Interrelationships between factors / barriers</h3>
            
            {/* Arrow Types Legend */}
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-6 border-b border-slate-200 pb-6 w-full max-w-2xl">
                 <div className="flex items-center gap-3 graph-legend-item">
                     <div className="w-10 h-px bg-slate-400 relative flex-shrink-0">
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-slate-400"></div>
                     </div>
                     <span className="text-sm text-slate-600 font-medium whitespace-nowrap">One-way Arrow (V/A)</span>
                 </div>
                 <div className="flex items-center gap-3 graph-legend-item">
                     <div className="w-10 h-px bg-violet-500 relative flex-shrink-0">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px] border-r-violet-500"></div>
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-violet-500"></div>
                     </div>
                     <span className="text-sm text-slate-600 font-medium whitespace-nowrap">Two-way Arrow (X)</span>
                 </div>
            </div>

            {/* Categories Legend */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 graph-legend-item">
                        <span className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" style={{backgroundColor: getCategoryColorHex(cat)}}></span>
                        <span className="text-sm text-slate-600 font-medium">{cat}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default InterrelationshipGraph;
