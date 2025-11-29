
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';
import { getCategoryColorHex } from './FactorInput';

interface Props {
  result: ISMResult;
  factors: ISMElement[];
}

interface MicmacDataPoint {
  id: string;
  name: string;
  description?: string;
  category?: string;
  drivingPower: number;
  dependencePower: number;
}

interface GroupedPoint {
  drivingPower: number;
  dependencePower: number;
  factors: MicmacDataPoint[];
  label: string;
}

const MicmacAnalysis: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Calculate Powers
  const rawData: MicmacDataPoint[] = useMemo(() => {
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

  // 2. Group Points to avoid Overlap
  const groupedData: GroupedPoint[] = useMemo(() => {
    const map = new Map<string, MicmacDataPoint[]>();
    
    rawData.forEach(p => {
        const key = `${p.dependencePower}-${p.drivingPower}`;
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)!.push(p);
    });

    return Array.from(map.entries()).map(([key, points]) => {
        const [dep, drv] = key.split('-').map(Number);
        return {
            dependencePower: dep,
            drivingPower: drv,
            factors: points,
            label: points.map(p => p.name).join(', ')
        };
    });
  }, [rawData]);

  // 3. Classify into Quadrants (based on raw data for the lists)
  const splitPoint = factors.length / 2; // Standard split at N/2
  
  const quadrants = useMemo(() => {
    const q = {
      autonomous: [] as MicmacDataPoint[],
      dependent: [] as MicmacDataPoint[],
      linkage: [] as MicmacDataPoint[],
      driver: [] as MicmacDataPoint[],
    };

    rawData.forEach(p => {
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
  }, [rawData, splitPoint]);

  // 4. Render Chart with D3
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

    // Calculate Split Coordinates
    const splitX = xScale(splitPoint);
    const splitY = yScale(splitPoint);

    // --- Background Shading for Quadrants ---
    
    // IV. Driver (Top Left): High Drive, Low Dep
    // x: 0 -> splitX, y: 0 -> splitY (Remember y=0 is top)
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", splitX)
      .attr("height", splitY)
      .attr("fill", "#fff1f2") // Rose-50
      .attr("opacity", 0.6);

    // III. Linkage (Top Right): High Drive, High Dep
    // x: splitX -> innerWidth, y: 0 -> splitY
    g.append("rect")
      .attr("x", splitX)
      .attr("y", 0)
      .attr("width", innerWidth - splitX)
      .attr("height", splitY)
      .attr("fill", "#faf5ff") // Purple-50
      .attr("opacity", 0.6);

    // I. Autonomous (Bottom Left): Low Drive, Low Dep
    // x: 0 -> splitX, y: splitY -> innerHeight
    g.append("rect")
      .attr("x", 0)
      .attr("y", splitY)
      .attr("width", splitX)
      .attr("height", innerHeight - splitY)
      .attr("fill", "#ecfdf5") // Emerald-50
      .attr("opacity", 0.6);

    // II. Dependent (Bottom Right): Low Drive, High Dep
    // x: splitX -> innerWidth, y: splitY -> innerHeight
    g.append("rect")
      .attr("x", splitX)
      .attr("y", splitY)
      .attr("width", innerWidth - splitX)
      .attr("height", innerHeight - splitY)
      .attr("fill", "#fffbeb") // Amber-50
      .attr("opacity", 0.6);


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
      .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
      .attr("fill", "#334155")
      .text("Dependence Power");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
      .attr("fill", "#334155")
      .text("Driving Power");

    // Quadrant Separator Lines (The Crosshair)
    g.append("line")
      .attr("x1", splitX)
      .attr("y1", 0)
      .attr("x2", splitX)
      .attr("y2", innerHeight)
      .attr("stroke", "#334155")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4"); 

    g.append("line")
      .attr("x1", 0)
      .attr("y1", splitY)
      .attr("x2", innerWidth)
      .attr("y2", splitY)
      .attr("stroke", "#334155")
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
       .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
       .attr("fill", "#be123c") // Rose-700
       .style("font-size", "14px")
       .text("IV. Driver (Independent)");

    // III: Linkage (Top Right)
    g.append("text")
       .attr("x", innerWidth - labelPadding)
       .attr("y", labelPadding)
       .attr("text-anchor", "end")
       .attr("dominant-baseline", "hanging")
       .attr("font-weight", "bold")
       .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
       .attr("fill", "#7e22ce") // Purple-700
       .style("font-size", "14px")
       .text("III. Linkage");

    // I: Autonomous (Bottom Left)
    g.append("text")
       .attr("x", labelPadding)
       .attr("y", innerHeight - labelPadding)
       .attr("dominant-baseline", "auto")
       .attr("font-weight", "bold")
       .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
       .attr("fill", "#047857") // Emerald-700
       .style("font-size", "14px")
       .text("I. Autonomous");

    // II: Dependent (Bottom Right)
    g.append("text")
       .attr("x", innerWidth - labelPadding)
       .attr("y", innerHeight - labelPadding)
       .attr("text-anchor", "end")
       .attr("dominant-baseline", "auto")
       .attr("font-weight", "bold")
       .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
       .attr("fill", "#b45309") // Amber-700
       .style("font-size", "14px")
       .text("II. Dependent");


    // Plot Points using GROUPED Data
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0,0,0,0.9)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "10")
      .style("max-width", "250px")
      .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)");

    g.selectAll(".dot-group")
      .data(groupedData)
      .enter()
      .append("circle")
      .attr("class", "dot-group")
      .attr("cx", d => xScale(d.dependencePower))
      .attr("cy", d => yScale(d.drivingPower))
      .attr("r", d => d.factors.length > 1 ? 8 : 6)
      // Uniform color (Dark Slate) instead of category color
      .attr("fill", "#1e293b") 
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", function(event, d) {
          d3.select(this).attr("r", d.factors.length > 1 ? 10 : 8).attr("fill", "#000");
          
          let tooltipHtml = `<strong>Dr: ${d.drivingPower}, Dep: ${d.dependencePower}</strong><hr style="margin:4px 0; border-color:#555"/>`;
          d.factors.forEach(f => {
              tooltipHtml += `<div style="margin-bottom:4px"><strong style="color:#6ee7b7">${f.name}</strong>: ${f.description}</div>`;
          });

          tooltip
            .style("visibility", "visible")
            .html(tooltipHtml);
      })
      .on("mousemove", function(event) {
          const [mx, my] = d3.pointer(event, containerRef.current);
          tooltip
            .style("top", (my - 10) + "px")
            .style("left", (mx + 15) + "px");
      })
      .on("mouseout", function(event, d) {
          d3.select(this).attr("r", d.factors.length > 1 ? 8 : 6).attr("fill", "#1e293b");
          tooltip.style("visibility", "hidden");
      });

    // Labels next to points
    g.selectAll(".label")
      .data(groupedData)
      .enter()
      .append("text")
      .attr("x", d => xScale(d.dependencePower) + (d.factors.length > 1 ? 10 : 8))
      .attr("y", d => yScale(d.drivingPower) + 4)
      .text(d => d.label)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("font-family", "Helvetica Neue, Helvetica, Arial, sans-serif")
      .attr("fill", "#1e293b");

    return () => {
        tooltip.remove();
    };

  }, [groupedData, factors, splitPoint]);

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
                             <span className="font-bold text-xs bg-slate-100 px-1 rounded">{f.name}</span>
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
