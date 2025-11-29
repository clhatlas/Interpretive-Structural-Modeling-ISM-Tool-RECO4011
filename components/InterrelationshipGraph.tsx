
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

  useEffect(() => {
    if (!result || !svgRef.current || !containerRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    // USE INITIAL REACHABILITY MATRIX
    const { initialReachabilityMatrix } = result;
    const containerWidth = containerRef.current.clientWidth || 800;
    
    // Calculate Legend Width requirements
    const categories = Array.from(new Set(factors.map(f => f.category).filter(Boolean))) as string[];
    const itemWidth = 160; // Increased width to 160px
    const minFooterWidth = categories.length * itemWidth + 100; // Extra padding

    // Width MUST adapt to footer to prevent cutting off the legend
    const width = Math.max(containerWidth, minFooterWidth);
    
    const footerHeight = 100; // Extra space for Title & Legends
    const height = 600 + footerHeight; 
    
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
        .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
        .attr("fill", "#1e293b")
        .style("pointer-events", "none");

    // --- Footer: Title & Legend ---
    const footerY = 600 + 20;
    const footerGroup = svg.append("g").attr("transform", `translate(0, ${footerY})`);

    // Title
    footerGroup.append("text")
      .attr("x", width / 2)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
      .attr("font-size", "18px")
      .attr("fill", "#1e293b")
      .text("Interrelationships between factors / barriers");

    // Legend 1: Arrows
    const arrowLegend = footerGroup.append("g").attr("transform", `translate(${width/2 - 150}, 30)`);
    
    // One-way
    arrowLegend.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 30).attr("y2", 0).attr("stroke", "#94a3b8").attr("stroke-width", 2);
    arrowLegend.append("text").attr("x", 35).attr("y", 4).text("One-way Arrow (V/A)").attr("font-size", "12px").attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif").attr("fill", "#475569");
    
    // Two-way
    const twoWayGroup = arrowLegend.append("g").attr("transform", `translate(170, 0)`);
    twoWayGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 30).attr("y2", 0).attr("stroke", "#8b5cf6").attr("stroke-width", 2);
    twoWayGroup.append("text").attr("x", 35).attr("y", 4).text("Two-way Arrow (X)").attr("font-size", "12px").attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif").attr("fill", "#475569");


    // Legend 2: Categories
    const totalLegendWidth = categories.length * itemWidth;
    let currentX = (width - totalLegendWidth) / 2;

    const catLegendGroup = footerGroup.append("g").attr("transform", `translate(0, 60)`);
    
    categories.forEach(cat => {
        const color = getCategoryColorHex(cat);
        const g = catLegendGroup.append("g").attr("transform", `translate(${currentX}, 0)`);
        
        g.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", color).attr("stroke", "#cbd5e1");
        g.append("text").attr("x", 10).attr("y", 4).text(cat).attr("font-size", "11px").attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif").attr("fill", "#475569");
        currentX += itemWidth;
    });

  }, [result, factors]);

  return (
    <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden">
        <svg id="interrelationship-graph-svg" ref={svgRef} className="block mx-auto"></svg>
    </div>
  );
};

export default InterrelationshipGraph;
