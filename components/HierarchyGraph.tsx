import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

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
    const levelHeight = 140; // Spacing
    const height = Math.max(600, levels.length * levelHeight + 100);
    const nodeRadius = 24;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff");

    // Define Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", nodeRadius + 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

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
            
            // Check if same level
            if (d.source.level === d.target.level) {
                 // Curve for same level
                 return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            }

            // Straight line for standard hierarchical links
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", "#94a3b8")
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
        .attr("fill", "#ffffff")
        .attr("stroke", (d:any) => getCategoryColorHex(d.data.category))
        .attr("stroke-width", 4)
        .attr("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))");

    // Node ID Text (Using Name/Code like B02 instead of Index)
    nodeGroups.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d: any) => d.data.name)
        .attr("fill", "#1e293b")
        .attr("font-weight", "bold")
        .attr("font-family", "monospace")
        .attr("font-size", "12px");

    // Label Text (Below node)
    const textGroup = nodeGroups.append("g")
         .attr("transform", `translate(0, ${nodeRadius + 15})`);

    textGroup.append("text")
        .attr("text-anchor", "middle")
        .text((d: any) => d.data.name)
        .attr("fill", "#334155")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .each(function(d: any) {
             const self = d3.select(this);
             const desc = d.data.description || "";
             if (desc.length > 20) {
                 self.text(desc.substring(0, 18) + "...");
             } else {
                 self.text(desc);
             }
             self.append("title").text(desc);
        });

    // Level Indicators
    const uniqueLevels = [...new Set(nodes.map((n:any) => n.level))].sort((a,b) => a-b);
    
    svg.selectAll(".level-label")
       .data(uniqueLevels)
       .enter()
       .append("text")
       .attr("x", 20)
       .attr("y", (d: any, i) => 50 + (i * levelHeight))
       .text((d: any) => `Level ${d}`)
       .attr("fill", "#64748b")
       .attr("font-weight", "bold")
       .attr("font-size", "14px")
       .attr("alignment-baseline", "middle");

  }, [result, factors]);

  // Compute unique categories present in the data for legend
  const legendData = React.useMemo(() => {
     const cats = Array.from(new Set(factors.map(f => f.category).filter(Boolean))) as string[];
     return cats.map(c => ({ label: c, color: getCategoryColorHex(c) }));
  }, [factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-x-auto overflow-y-hidden">
        <svg id="hierarchy-graph-svg" ref={svgRef} className="block min-w-[600px] mx-auto"></svg>
        <div className="p-4 border-t border-slate-100 flex flex-wrap gap-4 justify-center text-xs">
            {legendData.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium">{item.label}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default HierarchyGraph;