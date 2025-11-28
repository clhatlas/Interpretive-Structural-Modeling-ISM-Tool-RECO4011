import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
}

const InterrelationshipGraph: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result || !svgRef.current || !containerRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    // USE INITIAL REACHABILITY MATRIX to show ALL defined connections (SSIM inputs)
    // instead of the reduced Canonical Matrix.
    const { initialReachabilityMatrix } = result;
    const width = containerRef.current.clientWidth || 800;
    const height = 600;
    const radius = Math.min(width, height) / 2 - 60; // Radius of the circle layout
    const nodeRadius = 24;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff");

    // Define Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead-circle")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", nodeRadius + 12) // Adjusted to ensure arrow tip touches node edge cleanly
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b");

    // Define Purple Arrowhead for Two-Way (X) connections
    svg.append("defs").append("marker")
      .attr("id", "arrowhead-circle-mutual")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", nodeRadius + 12)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
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

    // Create Links from Initial Reachability Matrix (All Direct Connections)
    const links: any[] = [];
    for(let i=0; i<initialReachabilityMatrix.length; i++) {
        for(let j=0; j<initialReachabilityMatrix.length; j++) {
            if(initialReachabilityMatrix[i][j] === 1 && i !== j) {
                // Check if it's a two-way (X) or one-way relationship for styling
                const isMutual = initialReachabilityMatrix[j][i] === 1;
                links.push({ 
                    source: nodes[i], 
                    target: nodes[j],
                    type: isMutual ? 'mutual' : 'direct' 
                });
            }
        }
    }

    // Draw Links (Curved)
    svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("d", (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            // Curve calculation: '1' sweep flag ensures curves always go one way relative to direction.
            // This naturally separates A->B and B->A into two visible paths.
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.3; 
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", (d:any) => d.type === 'mutual' ? "#8b5cf6" : "#94a3b8") // Purple for X, Slate for others
        .attr("stroke-width", (d:any) => d.type === 'mutual' ? 2 : 1.5)
        .attr("marker-end", (d:any) => d.type === 'mutual' ? "url(#arrowhead-circle-mutual)" : "url(#arrowhead-circle)")
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
        .attr("stroke", "#334155")
        .attr("stroke-width", 2)
        .attr("cursor", "pointer")
        .on("mouseover", function() { d3.select(this).attr("fill", "#f1f5f9"); })
        .on("mouseout", function() { d3.select(this).attr("fill", "white"); });

    nodeGroups.append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .text((d) => d.data.name)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#1e293b")
        .style("pointer-events", "none");

  }, [result, factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden">
        <svg id="interrelationship-graph-svg" ref={svgRef} className="block mx-auto"></svg>
        <div className="p-4 text-center text-sm text-slate-500">
            Interrelationships between factors (Digraph).
            <div className="flex justify-center gap-6 mt-2 text-xs font-medium">
                <span className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-slate-400"></span> 
                    One-way Arrow (V/A)
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-purple-500"></span> 
                    Two-way Arrow (X)
                </span>
            </div>
        </div>
    </div>
  );
};

export default InterrelationshipGraph;