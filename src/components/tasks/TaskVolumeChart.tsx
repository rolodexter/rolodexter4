/**
 * TaskVolumeChart Component
 * 
 * Visualizes task volume over time using a line chart.
 * Used in the dashboard to show task completion trends.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 * - Task Volume Chart Implementation: agents/rolodexterVS/tasks/active-tasks/task-volume-chart-implementation.html
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface TaskVolume {
  date: Date;
  count: number;
  type: string;
}

export const TaskVolumeChart = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Sample data - replace with actual task volume data
    const data: TaskVolume[] = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2024, 1, i + 1),
      count: Math.floor(Math.random() * 50) + 10,
      type: Math.random() > 0.5 ? 'completed' : 'new'
    }));

    // Create scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .range([height, 0]);

    // Create line generator
    const line = d3.line<TaskVolume>()
      .x(d => x(d.date))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    // Clear previous content
    svg.selectAll("*").remove();

    // Create chart group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append("g")
      .call(d3.axisLeft(y));

    // Add line path
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#4CAF50")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots
    g.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.count))
      .attr("r", 4)
      .style("fill", d => d.type === 'completed' ? "#4CAF50" : "#FFC107");

  }, []);

  return (
    <motion.div 
      className="p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-display text-xl mb-4">TASK VOLUME</h2>
      <div className="hud-panel-secondary p-4">
        <svg ref={svgRef} width="100%" height="400" />
      </div>
    </motion.div>
  );
};

export type { TaskVolume }; 