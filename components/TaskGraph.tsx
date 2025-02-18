import React, { useEffect, useRef } from 'react';
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

export const TaskGraph: React.FC<TaskGraphProps> = ({ nodes }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const links: Link[] = nodes.flatMap(node =>
      node.connections.map(targetId => ({
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

    // Links
    const link = svg.append("g")
      .selectAll<SVGLineElement, Link>("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1)
      .attr("class", "task-connection");

    // Node groups
    const node = svg.append("g")
      .selectAll<SVGGElement, Task>("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "task-node")
      .call(d3.drag<SVGGElement, Task>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Hexagonal node shapes
    const hexagonPath = (size: number) => {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        points.push([
          size * Math.sin(angle),
          size * Math.cos(angle)
        ]);
      }
      return d3.line()(points as [number, number][]) || "";
    };

    node.append("path")
      .attr("d", hexagonPath(10))
      .attr("fill", "none")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1);

    // Active node indicators
    node.filter(d => d.status === 'active')
      .append("circle")
      .attr("r", 3)
      .attr("fill", "#FFFFFF")
      .attr("class", "node-pulse");

    // Node labels
    node.append("text")
      .text(d => d.systemArea)
      .attr("font-size", "8px")
      .attr("fill", "#FFFFFF")
      .attr("text-anchor", "middle")
      .attr("dy", "20");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Task).x ?? 0)
        .attr("y1", d => (d.source as Task).y ?? 0)
        .attr("x2", d => (d.target as Task).x ?? 0)
        .attr("y2", d => (d.target as Task).y ?? 0);

      node
        .attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    function dragstarted(event: d3.D3DragEvent<SVGGElement, Task, Task>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Task, Task>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Task, Task>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Scanline overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(transparent 50%, #FFFFFF 50%)',
          backgroundSize: '100% 4px',
          opacity: 0.05
        }}
        animate={{
          backgroundPosition: ['0px 0px', '0px 4px']
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};