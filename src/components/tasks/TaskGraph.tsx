/**
 * TaskGraph Component
 * 
 * Visualizes task relationships and dependencies using a force-directed graph.
 * Used in the dashboard to show task connections and workflow.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  type: string;
  created_at: Date;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  weight: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const NODE_COLORS = {
  task: '#ffffff',
  memory: '#cccccc',
  documentation: '#666666'
} as const;

export const TaskGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = svg.node()?.getBoundingClientRect().width || 800;
    const height = 600;

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(data.links)
        .id(d => d.id)
        .distance(d => 100 * (1 - d.weight))
      )
      .force("charge", d3.forceManyBody<GraphNode>().strength(-100))
      .force("center", d3.forceCenter<GraphNode>(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius(30));

    // Create container for zoom/pan
    const container = svg.append("g");

    // Add zoom behavior
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      }));

    // Draw links
    const link = container
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(data.links)
      .join("line")
      .style("stroke", "#333")
      .style("stroke-opacity", d => d.weight * 0.5)
      .style("stroke-width", d => d.weight * 2);

    // Create node groups
    const node = container
      .selectAll<SVGGElement, GraphNode>("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
      .attr("r", 5)
      .style("fill", d => NODE_COLORS[d.type as keyof typeof NODE_COLORS] || '#999999')
      .style("stroke", "#000")
      .style("stroke-width", 1);

    // Add labels
    node.append("text")
      .text(d => d.title)
      .attr("x", 8)
      .attr("y", 4)
      .style("font-size", "8px")
      .style("fill", "#fff")
      .style("font-family", "monospace");

    // Add titles for hover
    node.append("title")
      .text(d => `${d.title}\nType: ${d.type}\nPath: ${d.path}`);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x || 0)
        .attr("y1", d => (d.source as GraphNode).y || 0)
        .attr("x2", d => (d.target as GraphNode).x || 0)
        .attr("y2", d => (d.target as GraphNode).y || 0);

      node
        .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });

    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data]);

  if (loading) {
    return <div className="p-6">Loading graph data...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-display text-xl mb-4">KNOWLEDGE GRAPH</h2>
      <div className="hud-panel-secondary p-4 h-[600px]">
        <svg ref={svgRef} width="100%" height="100%" className="bg-black" />
      </div>
    </div>
  );
};

export default TaskGraph; 