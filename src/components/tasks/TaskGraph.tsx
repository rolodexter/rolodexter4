/**
 * TaskGraph Component
 * 
 * Visualizes task relationships and dependencies using a force-directed graph.
 * Used in the dashboard to show task connections and workflow.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Task {
  id: string;
  title: string;
  status: string;
  dependencies: string[];
}

export const TaskGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // D3 visualization code here
    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 400;

    // Sample data - replace with actual task data
    const nodes = [
      { id: "1", title: "Task 1", status: "active" },
      { id: "2", title: "Task 2", status: "pending" },
      { id: "3", title: "Task 3", status: "completed" }
    ];

    const links = [
      { source: "1", target: "2" },
      { source: "2", target: "3" }
    ];

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    const link = svg
      .selectAll("line")
      .data(links)
      .join("line")
      .style("stroke", "#999")
      .style("stroke-opacity", 0.6);

    // Draw nodes
    const node = svg
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 5)
      .style("fill", (d: any) => {
        switch (d.status) {
          case "active": return "#4CAF50";
          case "pending": return "#FFC107";
          case "completed": return "#2196F3";
          default: return "#9E9E9E";
        }
      });

    // Add titles
    node.append("title")
      .text((d: any) => d.title);

    // Update positions
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

    return () => simulation.stop();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-display text-xl mb-4">TASK GRAPH</h2>
      <div className="hud-panel-secondary p-4">
        <svg ref={svgRef} width="100%" height="400" />
      </div>
    </div>
  );
};

export type { Task }; 