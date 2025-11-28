import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
}

const HierarchyGraph: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || !svgRef.current || !containerRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const { levels, canonicalMatrix } = result;
    const width = containerRef.current.clientWidth || 800;
    const levelHeight = 140; // Increased spacing
    const height = Math.max(600, levels.length * levelHeight + 100);
    const nodeRadius = 22;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff"); // White background

    // Define Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", nodeRadius + 8) // Offset to not overlap node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8"); // Slate 400

    const nodes: any[] = [];
    
    // Position Levels
    // Level 1 is Top (Dependent). Higher Levels are Bottom (Driving).
    levels.forEach((lvl, lvlIndex) => {
        const y = 50 + (lvlIndex * levelHeight);
        const count = lvl.elements.length;
        const spacing = width / (count + 1);

        lvl.elements.forEach((elIndex, i) => {
            nodes.push({
                id: elIndex,
                x: spacing * (i + 1),
                y: y,
                level: lvl.level,
                data: factors[elIndex]
            });
        });
    });

    // Prepare Link Data from Canonical Matrix
    const links: any[] = [];
    for(let i=0; i<canonicalMatrix.length; i++) {
        for(let j=0; j<canonicalMatrix.length; j++) {
            if(canonicalMatrix[i][j] === 1 && i !== j) {
                const source = nodes.find(n => n.id === i);
                const target = nodes.find(n => n.id === j);
                if (source && target) {
                    links.push({ source, target });
                }
            }
        }
    }

    // Draw Links
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy); 
            
            // If link is bottom-up (Driving -> Dependent), which is standard visual flow in ISM:
            // But here Y increases downwards.
            // If target level (e.g. 1) < source level (e.g. 3). Target Y < Source Y.
            // This is an UPWARD arrow.
            
            // Check if same level
            if (d.source.level === d.target.level) {
                 // Curve for same level
                 return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            }

            // Straight line for standard hierarchical links
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", "#94a3b8") // Slate 400
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrowhead)");

    // Draw Nodes
    const nodeGroups = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("cursor", "default")
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    // Node Circle
    nodeGroups.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", "#ffffff") // White fill
        .attr("stroke", (d:any) => d.level === 1 ? "#10b981" : "#6366f1") // Level 1 Emerald-500, others Indigo-500
        .attr("stroke-width", 3)
        .attr("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))");

    // Node ID Text
    nodeGroups.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d: any) => d.id + 1)
        .attr("fill", "#1e293b") // Slate 800
        .attr("font-weight", "bold")
        .attr("font-family", "monospace")
        .attr("font-size", "14px");

    // Label Text (Below node)
    const textGroup = nodeGroups.append("g")
         .attr("transform", `translate(0, ${nodeRadius + 15})`);

    textGroup.append("text")
        .attr("text-anchor", "middle")
        .text((d: any) => d.data.name)
        .attr("fill", "#334155") // Slate 700
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .each(function(d: any) {
             const self = d3.select(this);
             const name = d.data.name;
             if (name.length > 20) {
                 self.text(name.substring(0, 18) + "...");
                 self.append("title").text(name);
             }
        });
        
    textGroup.append("text")
        .attr("dy", 14)
        .attr("text-anchor", "middle")
        .text((d: any) => d.data.category || "")
        .attr("fill", "#64748b") // Slate 500
        .attr("font-size", "9px");

    // Level Indicators (on the left)
    const uniqueLevels = [...new Set(nodes.map((n:any) => n.level))].sort((a,b) => a-b);
    
    svg.selectAll(".level-label")
       .data(uniqueLevels)
       .enter()
       .append("text")
       .attr("x", 20)
       .attr("y", (d: any, i) => 50 + (i * levelHeight))
       .text((d: any) => `Level ${d}`)
       .attr("fill", "#64748b") // Slate 500
       .attr("font-weight", "bold")
       .attr("font-size", "14px")
       .attr("alignment-baseline", "middle");

  }, [result, factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-x-auto overflow-y-hidden">
        <svg id="hierarchy-graph-svg" ref={svgRef} className="block min-w-[600px] mx-auto"></svg>
    </div>
  );
};

export default HierarchyGraph;