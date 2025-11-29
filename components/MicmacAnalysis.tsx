import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
}

interface MicmacDataPoint extends ISMElement {
  drivingPower: number;
  dependencePower: number;
}

const MicmacAnalysis: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Calculate Powers
  const data: MicmacDataPoint[] = useMemo(() => {
    const size = factors.length;
    const frm = result.finalReachabilityMatrix;
    return factors.map((f, i) => {
      // Driving Power = Sum of Row
      const drivingPower = frm[i].reduce((sum, val) => sum + val, 0);
      // Dependence Power = Sum of Column
      const dependencePower = frm.reduce((sum, row) => sum + row[i], 0);
      return {
        ...f,
        drivingPower,
        dependencePower
      };
    });
  }, [result, factors]);

  // 2. Classify into Quadrants
  const splitPoint = factors.length / 2; // Standard split at N/2
  
  const quadrants = useMemo(() => {
    const q = {
      autonomous: [] as MicmacDataPoint[],
      dependent: [] as MicmacDataPoint[],
      linkage: [] as MicmacDataPoint[],
      driver: [] as MicmacDataPoint[],
    };

    data.forEach(p => {
        // Driver: High Driving, Low Dependence
        // Linkage: High Driving, High Dependence
        // Autonomous: Low Driving, Low Dependence
        // Dependent: Low Driving, High Dependence
        
        // Note: Using > vs <= logic based on standard MICMAC charts
        if (p.drivingPower <= splitPoint && p.dependencePower <= splitPoint) {
            q.autonomous.push(p);
        } else if (p.drivingPower <= splitPoint && p.dependencePower > splitPoint) {
            q.dependent.push(p);
        } else if (p.drivingPower > splitPoint && p.dependencePower > splitPoint) {
            q.linkage.push(p);
        } else {
            q.driver.push(p);
        }
    });
    return q;
  }, [data, splitPoint]);

  // 3. Render Chart with D3
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    // Max value is number of factors (N)
    const maxVal = factors.length;
    
    const xScale = d3.scaleLinear()
      .domain([0, maxVal + 1]) // Add buffer
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, maxVal + 1])
      .range([innerHeight, 0]);

    // Grid Lines
    const makeXGrid = () => d3.axisBottom(xScale).ticks(maxVal + 1);
    const makeYGrid = () => d3.axisLeft(yScale).ticks(maxVal + 1);

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .attr("opacity", 0.1)
      .call(makeXGrid().tickSize(-innerHeight).tickFormat(() => ""));

    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(makeYGrid().tickSize(-innerWidth).tickFormat(() => ""));

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Axis Labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("fill", "#334155")
      .text("Dependence Power");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("fill", "#334155")
      .text("Driving Power");

    // Quadrant Lines (The Crosshair)
    const splitX = xScale(splitPoint);
    const splitY = yScale(splitPoint);

    g.append("line")
      .attr("x1", splitX)
      .attr("y1", 0)
      .attr("x2", splitX)
      .attr("y2", innerHeight)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4"); // Solid or Dashed? Image is solid thick line

    g.append("line")
      .attr("x1", 0)
      .attr("y1", splitY)
      .attr("x2", innerWidth)
      .attr("y2", splitY)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4");

    // Quadrant Labels
    const labelPadding = 10;
    
    // IV: Driver (Top Left)
    g.append("text")
       .attr("x", labelPadding)
       .attr("y", labelPadding)
       .attr("dominant-baseline", "hanging")
       .attr("font-weight", "bold")
       .attr("fill", "#475569")
       .style("font-size", "14px")
       .text("IV. Driver (Independent)");

    // III: Linkage (Top Right)
    g.append("text")
       .attr("x", innerWidth - labelPadding)
       .attr("y", labelPadding)
       .attr("text-anchor", "end")
       .attr("dominant-baseline", "hanging")
       .attr("font-weight", "bold")
       .attr("fill", "#475569")
       .style("font-size", "14px")
       .text("III. Linkage");

    // I: Autonomous (Bottom Left)
    g.append("text")
       .attr("x", labelPadding)
       .attr("y", innerHeight - labelPadding)
       .attr("dominant-baseline", "auto")
       .attr("font-weight", "bold")
       .attr("fill", "#475569")
       .style("font-size", "14px")
       .text("I. Autonomous");

    // II: Dependent (Bottom Right)
    g.append("text")
       .attr("x", innerWidth - labelPadding)
       .attr("y", innerHeight - labelPadding)
       .attr("text-anchor", "end")
       .attr("dominant-baseline", "auto")
       .attr("font-weight", "bold")
       .attr("fill", "#475569")
       .style("font-size", "14px")
       .text("II. Dependent");


    // Plot Points
    // Add jitter if points overlap perfectly? For simple grid, overlap is common.
    // We will group by coordinate to handle overlaps visually or just render them.
    // For now, render simple circles.
    
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "white")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "10");

    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.dependencePower))
      .attr("cy", d => yScale(d.drivingPower))
      .attr("r", 6)
      .attr("fill", d => getCategoryColorHex(d.category))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", function(event, d) {
          d3.select(this).attr("r", 9);
          tooltip
            .style("visibility", "visible")
            .html(`<strong>${d.name}</strong><br/>Dr: ${d.drivingPower}, Dep: ${d.dependencePower}<br/>${d.description}`);
      })
      .on("mousemove", function(event) {
          // Adjust for container offset
          const [mx, my] = d3.pointer(event, containerRef.current);
          tooltip
            .style("top", (my - 40) + "px")
            .style("left", (mx) + "px");
      })
      .on("mouseout", function() {
          d3.select(this).attr("r", 6);
          tooltip.style("visibility", "hidden");
      });

    // Labels next to points
    g.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("x", d => xScale(d.dependencePower) + 8)
      .attr("y", d => yScale(d.drivingPower) + 4)
      .text(d => d.name)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#334155");

    return () => {
        tooltip.remove();
    };

  }, [data, factors, splitPoint]);

  const renderQuadrantList = (title: string, items: MicmacDataPoint[], colorClass: string, desc: string) => (
    <div className={`p-4 rounded-lg border ${colorClass} bg-white shadow-sm flex flex-col h-full`}>
        <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
        <p className="text-xs text-slate-500 mb-3 italic">{desc}</p>
        <div className="flex-1">
            {items.length === 0 ? (
                <span className="text-slate-400 text-sm">None</span>
            ) : (
                <ul className="space-y-1">
                    {items.map(f => (
                        <li key={f.id} className="text-sm flex items-center gap-2">
                             <span className="font-mono font-bold text-xs bg-slate-100 px-1 rounded">{f.name}</span>
                             <span className="truncate" title={f.description}>{f.description}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        <div className="mt-2 text-right text-xs font-bold text-slate-400">
            Count: {items.length}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
        {/* Chart Section */}
        <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <svg ref={svgRef} className="block mx-auto"></svg>
            <div className="absolute top-4 right-4 bg-white/90 p-2 text-xs border border-slate-200 rounded shadow-sm">
                <p><strong>Split Point:</strong> {splitPoint.toFixed(1)}</p>
                <p><strong>Total Factors:</strong> {factors.length}</p>
            </div>
        </div>

        {/* Quadrant Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {renderQuadrantList("IV. Independent / Drivers", quadrants.driver, "border-l-4 border-l-rose-500", "Strong driving power, weak dependence. Key influencers.")}
             {renderQuadrantList("III. Linkage", quadrants.linkage, "border-l-4 border-l-purple-500", "Strong driving power, strong dependence. Unstable, any action here affects others.")}
             {renderQuadrantList("I. Autonomous", quadrants.autonomous, "border-l-4 border-l-emerald-500", "Weak driving power, weak dependence. Relatively disconnected from the system.")}
             {renderQuadrantList("II. Dependent", quadrants.dependent, "border-l-4 border-l-amber-500", "Weak driving power, strong dependence. Results/Outcomes.")}
        </div>
    </div>
  );
};

export default MicmacAnalysis;