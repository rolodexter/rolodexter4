/**
 * KnowledgeGraph Component
 * 
 * Visualizes the relationships between different pieces of knowledge in the system.
 * Used in the dashboard to show how different concepts and documents are connected.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  title: string;
  path: string;
}

interface Link {
  source: string;
  target: string;
  confidence: number;
}

interface GraphData {
  documents: Node[];
  references: {
    [key: string]: Link[];
  };
}

export const KnowledgeGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Update dimensions when window resizes
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data only once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        console.log('Fetching graph data...');
        const res = await fetch('/api/graph');
        const newData = await res.json();
        console.log('Received graph data:', newData);
        if (isMounted) {
          setData(newData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching graph data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch graph data');
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current || !dimensions.width || !dimensions.height) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create nodes array from documents
    const nodes = data.documents;

    // Create links array from all reference types
    const links = Object.values(data.references).flat();

    // Create container for zoom first
    const container = svg.append('g');

    // Create force simulation with adjusted parameters for full screen
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(250))
      .force('charge', d3.forceManyBody().strength(-2000))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(80))
      .force('x', d3.forceX(width / 2).strength(0.02))
      .force('y', d3.forceY(height / 2).strength(0.02));

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Apply zoom behavior and set initial zoom
    svg.call(zoom as any)
      .call(zoom.transform as any, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(0.5)
        .translate(-width / 2, -height / 2));

    // Create SVG elements
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#666666')
      .attr('stroke-width', (d: any) => d.confidence * 1)
      .attr('stroke-opacity', 0.3)
      .style('stroke-dasharray', '5,5')
      .style('animation', 'dash 20s linear infinite');

    // Add arrow markers for links
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .join('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 30)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#666666')
      .attr('d', 'M0,-5L10,0L0,5');

    // Create node groups with enhanced transitions
    const nodeGroup = container.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add glowing effect filter
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Add clickable node circles with enhanced styling
    const nodeCircles = nodeGroup.append('a')
      .attr('href', (d: any) => `/api/document/${d.path}`)
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .append('circle')
      .attr('r', 15)
      .attr('fill', (d: any) => {
        const path = d.path.toLowerCase();
        if (path.includes('/tasks/')) return '#404040';
        if (path.includes('/memories/')) return '#666666';
        if (path.includes('/documentation/')) return '#808080';
        return '#999999';
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('filter', 'url(#glow)')
      .style('transition', 'all 0.3s ease')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(300)
          .attr('r', 20)
          .attr('stroke-width', 2);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(300)
          .attr('r', 15)
          .attr('stroke-width', 1);
      });

    // Add clickable labels with enhanced styling
    const nodeLabels = nodeGroup.append('a')
      .attr('href', (d: any) => `/api/document/${d.path}`)
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .append('text')
      .text((d: any) => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('fill', '#333333')
      .style('font-size', '11px')
      .style('font-family', 'monospace')
      .style('cursor', 'pointer')
      .style('text-decoration', 'none')
      .style('transition', 'all 0.3s ease')
      .style('opacity', 0.7)
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(300)
          .style('font-size', '13px')
          .style('opacity', 1)
          .attr('fill', '#000000');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(300)
          .style('font-size', '11px')
          .style('opacity', 0.7)
          .attr('fill', '#333333');
      });

    // Add pulsing animation to nodes
    nodeCircles.append('animate')
      .attr('attributeName', 'r')
      .attr('values', '15;17;15')
      .attr('dur', '3s')
      .attr('repeatCount', 'indefinite');

    // Update positions on each tick with smooth transitions
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup
        .transition()
        .duration(50)
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add CSS animation for dashed lines
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dash {
        to {
          stroke-dashoffset: 100;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      simulation.stop();
      document.head.removeChild(style);
    };
  }, [data, dimensions]);

  if (error) return (
    <div className="fixed top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
      Error: {error}
    </div>
  );
  
  return (
    <svg
      ref={svgRef}
      width="100vw"
      height="100vh"
      style={{ 
        background: '#f9fafb',
        display: 'block', // Removes any default spacing
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      {!data && (
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          fill="#666"
          style={{ fontFamily: 'monospace' }}
        >
          Loading knowledge graph...
        </text>
      )}
    </svg>
  );
}; 