import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface Task extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  connections: string[];
  systemArea: string;
}

interface Link extends d3.SimulationLinkDatum<Task> {
  status: 'active' | 'pending' | 'resolved';
}

interface TaskGraphProps {
  nodes: Task[];
}

export const TaskGraph: React.FC<TaskGraphProps> = ({ nodes = [] }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 200; // Fixed height for better consistency

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const links: Link[] = nodes.flatMap(node =>
      (node.connections || []).map(targetId => ({
        source: node.id,
        target: targetId,
        status: node.status
      }))
    );

    const simulation = d3.forceSimulation<Task>(nodes)
      .force("link", d3.forceLink<Task, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody<Task>().strength(-200))
      .force("center", d3.forceCenter<Task>(width / 2, height / 2))
      .force("collision", d3.forceCollide<Task>().radius(30));

    // Create a group for all graph elements
    const g = svg.append("g");

    // Links
    const link = g.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", "#4a5568")
      .style("stroke-width", 1)
      .style("opacity", 0.6);

    // Nodes
    const node = g.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, Task>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node circles
    node.append("circle")
      .attr("r", 6)
      .style("fill", d => {
        switch (d.status) {
          case 'active': return '#68D391';
          case 'pending': return '#F6AD55';
          case 'resolved': return '#9F7AEA';
          default: return '#CBD5E0';
        }
      })
      .style("stroke", "#2D3748")
      .style("stroke-width", 1);

    // Node labels
    node.append("text")
      .attr("dx", 10)
      .attr("dy", 4)
      .style("font-size", "8px")
      .style("fill", "#A0AEC0")
      .text(d => d.title);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Task).x!)
        .attr("y1", d => (d.source as Task).y!)
        .attr("x2", d => (d.target as Task).x!)
        .attr("y2", d => (d.target as Task).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: d3.D3DragEvent<SVGGElement, Task, Task>, d: Task) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Task, Task>, d: Task) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Task, Task>, d: Task) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, mounted]);

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-800 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-48 bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden"
    >
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};