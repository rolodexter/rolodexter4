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

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  status: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode;
  target: SimNode;
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
    const nodes: SimNode[] = [
      { id: "1", title: "Task 1", status: "active" },
      { id: "2", title: "Task 2", status: "pending" },
      { id: "3", title: "Task 3", status: "completed" }
    ];

    // Create links after nodes are defined
    const links: SimLink[] = [
      { source: nodes[0], target: nodes[1] },
      { source: nodes[1], target: nodes[2] }
    ];

    // Create force simulation
    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id(d => d.id))
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
      .style("fill", (d) => {
        switch (d.status) {
          case "active": return "#4CAF50";
          case "pending": return "#FFC107";
          case "completed": return "#2196F3";
          default: return "#9E9E9E";
        }
      });

    // Add titles
    node.append("title")
      .text(d => d.title);

    // Update positions
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x || 0)
        .attr("y1", d => d.source.y || 0)
        .attr("x2", d => d.target.x || 0)
        .attr("y2", d => d.target.y || 0);

      node
        .attr("cx", d => d.x || 0)
        .attr("cy", d => d.y || 0);
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
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