
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { ISMResult, ISMElement } from '../types';

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
  dependencePower: number;
  drivingPower: number;
  factors: MicmacDataPoint[];
  labels: string[];
}

const MicmacAnalysis: React.FC<Props> = ({ result, factors }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Calculate Powers
  const rawData: MicmacDataPoint[] = useMemo(() => {
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
        
        // Split logic: if more than 3 factors, split into two lines
        const names = points.map(p => p.name);
        let labels: string[] = [];
        
        if (names.length > 3) {
            const mid = Math.ceil(names.length / 2);
            labels.push(names.slice(0, mid).join(', ') + ',');
            labels.push(names.slice(mid).join(', '));
        } else {
            labels.push(names.join(', '));
        }

        return {
            dependencePower: dep,
            drivingPower: drv,
            factors: points,
            labels: labels
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

    // Use a fixed width or responsive logic
    const containerWidth = containerRef.current.clientWidth;
    const width = Math.max(containerWidth, 800); 
    const height = 700; 
    
    // Margins
    const margin = { top: 80, right: 150, bottom: 100, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background-color", "#ffffff")
      .style("overflow", "visible"); // Allow labels to overflow if needed

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const maxVal = factors.length;
    
    const xScale = d3.scaleLinear()
      .domain([0, maxVal + 1]) 
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, maxVal + 1])
      .range([innerHeight, 0]);

    // Calculate Split Coordinates
    const splitX = xScale(splitPoint);
    const splitY = yScale(splitPoint);

    // --- Background Shading for Quadrants ---
    
    // IV. Driver (Top Left)
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", splitX)
      .attr("height", splitY)
      .attr("fill", "#fff1f2")
      .attr("opacity", 0.6);

    // III. Linkage (Top Right)
    g.append("rect")
      .attr("x", splitX)
      .attr("y", 0)
      .attr("width", innerWidth - splitX)
      .attr("height", splitY)
      .attr("fill", "#faf5ff")
      .attr("opacity", 0.6);

    // I. Autonomous (Bottom Left)
    g.append("rect")
      .attr("x", 0)
      .attr("y", splitY)
      .attr("width", splitX)
      .attr("height", innerHeight - splitY)
      .attr("fill", "#ecfdf5")
      .attr("opacity", 0.6);

    // II. Dependent (Bottom Right)
    g.append("rect")
      .attr("x", splitX)
      .attr("y", splitY)
      .attr("width", innerWidth - splitX)
      .attr("height", innerHeight - splitY)
      .attr("fill", "#fffbeb")
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
    const xAxis = d3.axisBottom(xScale).ticks(maxVal + 1).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).ticks(maxVal + 1).tickFormat(d3.format("d"));

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("font-family", '"Times New Roman", Times, serif')
      .attr("font-size", "16px") 
      .attr("font-weight", "bold");

    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("font-family", '"Times New Roman", Times, serif')
      .attr("font-size", "16px") 
      .attr("font-weight", "bold");

    // Axis Labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "24px")
      .attr("font-family", "Times New Roman, Times, serif")
      .attr("fill", "#334155")
      .text("Dependence Power");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "24px")
      .attr("font-family", "Times New Roman, Times, serif")
      .attr("fill", "#334155")
      .text("Driving Power");

    // Quadrant Separator Lines
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

    // Quadrant Labels - Fixed positions
    const labelPadding = 15;
    const quadFontSize = "16px"; 
    
    g.append("text")
       .attr("x", labelPadding)
       .attr("y", labelPadding)
       .attr("dominant-baseline", "hanging")
       .attr("font-weight", "bold")
       .attr("font-family", "Times New Roman, Times, serif")
       .attr("fill", "#dc2626")
       .style("font-size", quadFontSize)
       .text("IV. Driver (Independent)");

    g.append("text")
       .attr("x", innerWidth - labelPadding)
       .attr("y", labelPadding)
       .attr("text-anchor", "end")
       .attr("dominant-baseline", "hanging")
       .attr("font-weight", "bold")
       .attr("font-family", "Times New Roman, Times, serif")
       .attr("fill", "#7e22ce")
       .style("font-size", quadFontSize)
       .text("III. Linkage");

    g.append("text")
       .attr("x", labelPadding)
       .attr("y", innerHeight - labelPadding)
       .attr("dominant-baseline", "auto")
       .attr("font-weight", "bold")
       .attr("font-family", "Times New Roman, Times, serif")
       .attr("fill", "#047857")
       .style("font-size", quadFontSize)
       .text("I. Autonomous");

    g.append("text")
       .attr("x", innerWidth - labelPadding)
       .attr("y", innerHeight - labelPadding)
       .attr("text-anchor", "end")
       .attr("dominant-baseline", "auto")
       .attr("font-weight", "bold")
       .attr("font-family", "Times New Roman, Times, serif")
       .attr("fill", "#b45309")
       .style("font-size", quadFontSize)
       .text("II. Dependent");


    // --- Label Simulation for Overlap Prevention ---
    
    const labelNodes = groupedData.map(d => {
        const isRightSide = d.dependencePower > maxVal / 2;
        // Reduced offset to bring words closer to dots
        const offset = d.factors.length > 1 ? 12 : 10; 
        const originX = xScale(d.dependencePower);
        const originY = yScale(d.drivingPower);
        
        return {
            ...d,
            x: originX + (isRightSide ? -offset : offset), // Initial guess
            y: originY + 5,
            originX: originX,
            originY: originY,
            isRightSide: isRightSide,
            targetX: originX + (isRightSide ? -offset : offset)
        };
    });

    // Create a chain of dummy nodes to form a barrier over the quadrant titles
    // This pushes data labels away from the text
    const collisionRadius = 30;
    
    // IV. Driver (Top Left)
    const q1Nodes = [
        { fx: 50, fy: 20, r: collisionRadius },
        { fx: 110, fy: 20, r: collisionRadius },
        { fx: 170, fy: 20, r: collisionRadius },
        { fx: 230, fy: 20, r: collisionRadius }
    ];
    
    // III. Linkage (Top Right)
    const q2Nodes = [
        { fx: innerWidth - 50, fy: 20, r: collisionRadius },
        { fx: innerWidth - 110, fy: 20, r: collisionRadius }
    ];

    // I. Autonomous (Bottom Left)
    const q3Nodes = [
        { fx: 50, fy: innerHeight - 20, r: collisionRadius },
        { fx: 110, fy: innerHeight - 20, r: collisionRadius },
        { fx: 170, fy: innerHeight - 20, r: collisionRadius }
    ];

    // II. Dependent (Bottom Right)
    const q4Nodes = [
        { fx: innerWidth - 50, fy: innerHeight - 20, r: collisionRadius },
        { fx: innerWidth - 110, fy: innerHeight - 20, r: collisionRadius },
        { fx: innerWidth - 170, fy: innerHeight - 20, r: collisionRadius }
    ];

    const simulationNodes = [...labelNodes, ...q1Nodes, ...q2Nodes, ...q3Nodes, ...q4Nodes] as any[];

    // Run simulation
    const simulation = d3.forceSimulation(simulationNodes)
        .force("x", d3.forceX((d: any) => d.targetX ? d.targetX : 0).strength((d: any) => d.fx ? 0 : 2)) // Increased X strength to keep labels closer
        .force("y", d3.forceY((d: any) => d.originY ? d.originY : 0).strength((d: any) => d.fx ? 0 : 0.1)) // Weakly stay at correct Y
        .force("collide", d3.forceCollide((d: any) => {
             // Radius for collision
             if (d.r) return d.r * 1.1; // Fixed node radius buffer
             // Data label radius - Reduced to allow tighter packing
             return 18; 
        }).iterations(4))
        .stop();

    for (let i = 0; i < 150; ++i) simulation.tick();


    // Plot Points
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0,0,0,0.9)")
      .style("color", "white")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("z-index", "10")
      .style("max-width", "300px")
      .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)");

    g.selectAll(".dot-group")
      .data(groupedData)
      .enter()
      .append("circle")
      .attr("class", "dot-group")
      .attr("cx", d => xScale(d.dependencePower))
      .attr("cy", d => yScale(d.drivingPower))
      .attr("r", d => d.factors.length > 1 ? 10 : 8)
      .attr("fill", "#1e293b") 
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", function(event, d) {
          d3.select(this).attr("r", d.factors.length > 1 ? 12 : 10).attr("fill", "#000");
          
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
            .style("left", (mx + 20) + "px");
      })
      .on("mouseout", function(event, d) {
          d3.select(this).attr("r", d.factors.length > 1 ? 10 : 8).attr("fill", "#1e293b");
          tooltip.style("visibility", "hidden");
      });

    // Labels next to points
    const textLabels = g.selectAll(".label")
      .data(labelNodes)
      .enter()
      .append("text")
      .attr("x", (d: any) => {
          return Math.max(10, Math.min(innerWidth - 10, d.x));
      })
      .attr("y", (d: any) => {
           return Math.max(10, Math.min(innerHeight - 5, d.y));
      })
      .attr("text-anchor", (d: any) => d.isRightSide ? "end" : "start")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("font-family", "Times New Roman, Times, serif")
      .attr("fill", "#1e293b");
    
    // Add multi-line tspans
    textLabels.each(function(d: any) {
        const el = d3.select(this);
        const xPos = Math.max(10, Math.min(innerWidth - 10, d.x));
        d.labels.forEach((line: string, i: number) => {
            el.append("tspan")
               .attr("x", xPos)
               .attr("dy", i === 0 ? 0 : "1.1em")
               .text(line);
        });
    });

    return () => {
        tooltip.remove();
        simulation.stop();
    };

  }, [groupedData, factors, splitPoint]);

  const renderQuadrantList = (title: string, items: MicmacDataPoint[], colorClass: string, desc: string) => (
    <div className={`micmac-description-box p-4 rounded-lg border ${colorClass} bg-white shadow-sm flex flex-col h-full`}>
        <h4 className="font-bold text-slate-800 mb-2 text-lg">{title}</h4>
        <p className="text-sm text-slate-500 mb-4 italic">{desc}</p>
        <div className="flex-1">
            {items.length === 0 ? (
                <span className="text-slate-400 text-sm">None</span>
            ) : (
                <ul className="space-y-1">
                    {items.map(f => (
                        <li key={f.id} className="text-base flex items-start gap-2">
                             <span className="font-bold text-sm bg-slate-100 px-2 rounded mt-0.5 min-w-[35px] text-center">{f.name}</span>
                             <span className="truncate whitespace-normal" title={f.description}>{f.description}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        <div className="mt-4 text-right text-sm font-bold text-slate-400 count">
            Count: {items.length}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
        {/* Chart Section */}
        <div ref={containerRef} className="w-full bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-x-auto overflow-y-hidden">
            <svg ref={svgRef} className="block mx-auto"></svg>
            <div className="absolute top-2 right-2 bg-white/90 p-2 text-xs border border-slate-200 rounded shadow-sm z-10" style={{top: '10px', right: '10px'}}>
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
