import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface Task {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'resolved';
  connections: string[];
  systemArea: string;
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

    const links = nodes.flatMap(node =>
      node.connections.map(targetId => ({
        source: node.id,
        target: targetId,
        status: node.status
      }))
    );

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1)
      .attr("class", "task-connection");

    // Node groups
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "task-node")
      .call(d3.drag<any, any>()
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
    node.filter((d: Task) => d.status === 'active')
      .append("circle")
      .attr("r", 3)
      .attr("fill", "#FFFFFF")
      .attr("class", "node-pulse");

    // Node labels
    node.append("text")
      .text((d: Task) => d.systemArea)
      .attr("font-size", "8px")
      .attr("fill", "#FFFFFF")
      .attr("text-anchor", "middle")
      .attr("dy", 20);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
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
      <svg ref={svgRef} className="w-full h-full"></svg>
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