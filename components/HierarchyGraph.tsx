
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
  isExport?: boolean;
}

const HierarchyGraph: React.FC<Props> = ({ result, factors, isExport = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const categories = Array.from(new Set(factors.map(f => f.category).filter(Boolean))) as string[];

  useEffect(() => {
    if (!result || !svgRef.current || !containerRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const { levels, initialReachabilityMatrix } = result;
    
    // Configuration for Boxes - Larger to fit enlarged text
    const boxWidth = isExport ? 450 : 250;
    const boxHeight = isExport ? 240 : 110;
    const hGap = isExport ? 100 : 30; 
    const vGap = isExport ? 180 : 80;
    
    // Calculate canvas size
    const maxNodesInLevel = Math.max(...levels.map(l => l.elements.length));
    const requiredNodeWidth = maxNodesInLevel * (boxWidth + hGap) + (isExport ? 200 : 100);
    
    const containerWidth = isExport ? requiredNodeWidth : (containerRef.current.clientWidth || 800);
    const width = Math.max(containerWidth, requiredNodeWidth);
    const height = Math.max(600, levels.length * (boxHeight + vGap) + (isExport ? 200 : 100));

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff")
      .style("overflow", "visible");

    // Define Arrowhead markers
    const defs = svg.append("defs");
    const markerScale = isExport ? 2 : 1; 

    // Standard Arrowhead
    defs.append("marker")
      .attr("id", isExport ? "arrowhead-exp" : "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10) 
      .attr("refY", 0)
      .attr("markerWidth", 6 * markerScale)
      .attr("markerHeight", 6 * markerScale)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    const nodes: any[] = [];
    
    // Position Levels (Top-Down)
    levels.forEach((lvl, lvlIndex) => {
        const y = 50 + (lvlIndex * (boxHeight + vGap));
        const count = lvl.elements.length;
        
        const totalLevelWidth = count * boxWidth + (count - 1) * hGap;
        const startX = (width - totalLevelWidth) / 2;

        lvl.elements.forEach((elIndex, i) => {
            nodes.push({
                id: elIndex,
                x: startX + i * (boxWidth + hGap),
                y: y,
                level: lvl.level,
                data: factors[elIndex]
            });
        });
    });

    const links: any[] = [];
    const matrix = initialReachabilityMatrix;
    
    for(let i=0; i<matrix.length; i++) {
        for(let j=0; j<matrix.length; j++) {
            if(matrix[i][j] === 1 && i !== j) {
                const source = nodes.find(n => n.id === i);
                const target = nodes.find(n => n.id === j);
                if (source && target) {
                    const levelDiff = source.level - target.level;
                    // Draw links for adjacent levels or same level
                    if (levelDiff === 0 || levelDiff === 1) {
                        links.push({ source, target, levelDiff });
                    }
                }
            }
        }
    }

    const markerUrl = isExport ? "url(#arrowhead-exp)" : "url(#arrowhead)";

    // Draw Links
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", (d: any) => {
            if (d.levelDiff === 0) {
                // Same Level: Side-to-Side
                if (d.source.x < d.target.x) {
                    const startX = d.source.x + boxWidth;
                    const startY = d.source.y + boxHeight / 2;
                    const endX = d.target.x;
                    const endY = d.target.y + boxHeight / 2;
                    return `M${startX},${startY}L${endX},${endY}`;
                } else {
                    const startX = d.source.x;
                    const startY = d.source.y + boxHeight / 2;
                    const endX = d.target.x + boxWidth;
                    const endY = d.target.y + boxHeight / 2;
                    return `M${startX},${startY}L${endX},${endY}`;
                }
            } else {
                // Different Level: Bottom-to-Top
                const startX = d.source.x + boxWidth / 2;
                const startY = d.source.y; 
                const endX = d.target.x + boxWidth / 2;
                const endY = d.target.y + boxHeight; 
                const midY = (startY + endY) / 2;
                return `M${startX},${startY}V${midY}H${endX}V${endY}`;
            }
        })
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", isExport ? 4 : 2)
        .attr("marker-end", markerUrl);

    // Draw Nodes
    const nodeGroups = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    nodeGroups.append("rect")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("rx", 6)
        .attr("fill", "#ffffff")
        .attr("stroke", (d:any) => getCategoryColorHex(d.data.category))
        .attr("stroke-width", isExport ? 5 : 2)
        .attr("filter", "drop-shadow(0px 4px 6px rgba(0,0,0,0.1))");

    // Styling Params - Enlarged Fonts
    const titleFS = isExport ? '36pt' : '16px'; 
    const bodyFS = isExport ? '28pt' : '13px'; 
    const padding = isExport ? '4px' : '4px'; 
    const lineHeight = isExport ? '1.15' : '1.2';
    const clamp = isExport ? '5' : '4';

    nodeGroups.append("foreignObject")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("padding", padding)
        .style("box-sizing", "border-box")
        .style("text-align", "center")
        .style("font-family", "Times New Roman, Times, serif")
        .html((d: any) => `
          <div style="font-weight:bold; font-size:${titleFS}; color:#334155; margin-bottom:4px; line-height:1.1;">${d.data.name}</div>
          <div style="font-size:${bodyFS}; line-height:${lineHeight}; color:#1e293b; overflow:hidden; display:-webkit-box; -webkit-line-clamp:${clamp}; -webkit-box-orient:vertical;">
            ${d.data.description || d.data.name}
          </div>
        `);

    // Level Labels
    const uniqueLevels = [...new Set(nodes.map((n:any) => n.level))].sort((a,b) => a-b);
    svg.selectAll(".level-label")
       .data(uniqueLevels)
       .enter()
       .append("text")
       .attr("x", 20)
       .attr("y", (d: any, i) => 50 + (i * (boxHeight + vGap)) + boxHeight/2)
       .text((d: any) => `Level ${d}`)
       .attr("fill", "#64748b")
       .attr("font-weight", "bold")
       .attr("font-size", isExport ? "36px" : "14px")
       .attr("font-family", "Times New Roman, Times, serif")
       .attr("alignment-baseline", "middle");

  }, [result, factors, isExport]);

  return (
    <div ref={containerRef} className={`w-full bg-white ${isExport ? '' : 'rounded-xl border border-slate-200 shadow-inner'} overflow-hidden flex flex-col items-center pb-8`}>
        <div className={`w-full ${isExport ? '' : 'overflow-x-auto'}`}>
            <svg id={isExport ? "hierarchy-graph-svg-export" : "hierarchy-graph-svg"} ref={svgRef} className="block min-w-[600px] mx-auto"></svg>
        </div>
        
        <div className={`mt-6 flex flex-col items-center px-6 text-center graph-legend-container`}>
            <h3 className={`${isExport ? 'text-4xl mb-10' : 'text-lg mb-4'} font-bold text-slate-800 graph-legend-title`}>ISM-based model</h3>
            <div className={`flex flex-wrap justify-center ${isExport ? 'gap-x-16 gap-y-8' : 'gap-x-6 gap-y-3'}`}>
                {categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 graph-legend-item">
                        <span className={`${isExport ? 'w-8 h-8 border-4' : 'w-3 h-3 border'} rounded-full border-slate-300 flex-shrink-0`} style={{backgroundColor: getCategoryColorHex(cat)}}></span>
                        <span className={`${isExport ? 'text-3xl' : 'text-sm'} text-slate-600 font-medium`}>{cat}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default HierarchyGraph;
