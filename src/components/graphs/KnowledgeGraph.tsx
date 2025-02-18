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

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  type: 'document' | 'tag';
  tagCount?: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  confidence: number;
  type: 'document-document' | 'document-tag';
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

    // Process tags from documents
    const tagFrequency = new Map<string, number>();
    data.documents.forEach(doc => {
      const content = doc.path.toLowerCase();
      const tags = content.match(/graph-tags content="([^"]+)"/);
      if (tags) {
        tags[1].split(',').map(tag => tag.trim()).forEach(tag => {
          tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
        });
      }
    });

    // Create tag nodes
    const tagNodes: Node[] = Array.from(tagFrequency.entries()).map(([tag, count]) => ({
      id: `tag:${tag}`,
      title: tag,
      path: '',
      type: 'tag',
      tagCount: count
    }));

    // Create document nodes with type
    const documentNodes: Node[] = data.documents.map(doc => ({
      ...doc,
      type: 'document'
    }));

    // Combine all nodes
    const nodes = [...documentNodes, ...tagNodes];

    // Create document-tag links
    const tagLinks: Link[] = documentNodes.flatMap(doc => {
      const content = doc.path.toLowerCase();
      const tags = content.match(/graph-tags content="([^"]+)"/);
      if (!tags) return [];
      
      return tags[1].split(',').map(tag => tag.trim()).map(tag => ({
        source: doc.id,
        target: `tag:${tag}`,
        confidence: 0.5,
        type: 'document-tag'
      }));
    });

    // Combine all links
    const documentLinks: Link[] = Object.values(data.references).flat().map(link => ({
      ...link,
      type: 'document-document'
    }));
    const links = [...documentLinks, ...tagLinks];

    // Create container for zoom first
    const container = svg.append('g');

    // Create SVG elements for links
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'document-tag' ? '#999999' : '#666666')
      .attr('stroke-width', d => d.type === 'document-tag' ? 0.5 : d.confidence)
      .attr('stroke-opacity', 0.3)
      .style('stroke-dasharray', d => d.type === 'document-tag' ? '2,2' : '5,5')
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

    // Create node groups with modified drag behavior
    const nodeGroup = container.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          // Just store current position
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          // Update position during drag
          d.fx = event.x;
          d.fy = event.y;
          updatePositions();
        })
        .on('end', (event, d) => {
          // Keep final position
          d.fx = event.x;
          d.fy = event.y;
          updatePositions();
        }));

    // Function to update positions
    const updatePositions = () => {
      link
        .attr('x1', (d: any) => d.source.x ?? initialPositions.get(d.source.id)?.x)
        .attr('y1', (d: any) => d.source.y ?? initialPositions.get(d.source.id)?.y)
        .attr('x2', (d: any) => d.target.x ?? initialPositions.get(d.target.id)?.x)
        .attr('y2', (d: any) => d.target.y ?? initialPositions.get(d.target.id)?.y);

      nodeGroup
        .attr('transform', (d: any) => {
          const x = d.x ?? initialPositions.get(d.id)?.x;
          const y = d.y ?? initialPositions.get(d.id)?.y;
          return `translate(${x},${y})`;
        });
    };

    // Create force simulation with adjusted stability parameters
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id)
        .distance((d: Link) => d.type === 'document-tag' ? 400 : 600)
        .strength(0.5))
      .force('charge', d3.forceManyBody<Node>()
        .strength((d: Node) => d.type === 'tag' ? -2000 : -3000)
        .distanceMax(1000)
        .theta(0.9))
      .force('center', d3.forceCenter<Node>(width / 2, height / 2).strength(0.05))
      .force('collision', d3.forceCollide<Node>()
        .radius((d: Node) => d.type === 'tag' ? (d.tagCount || 1) * 30 : 80)
        .strength(1)
        .iterations(4))
      .force('x', d3.forceX<Node>().strength(0.01).x(d => {
        if (d.type === 'tag') return width * 0.3;
        if (d.path.includes('/tasks/')) return width * 0.6;
        if (d.path.includes('/memories/')) return width * 0.7;
        return width * 0.5;
      }))
      .force('y', d3.forceY<Node>().strength(0.01).y(d => {
        if (d.type === 'tag') return height * 0.5;
        if (d.path.includes('/tasks/')) return height * 0.3;
        if (d.path.includes('/memories/')) return height * 0.7;
        return height * 0.5;
      }));

    // Run simulation once to get initial layout
    simulation.alpha(1);
    for (let i = 0; i < 300; i++) simulation.tick();
    
    // Instead of stopping, reduce the simulation intensity and let it continue
    simulation
      .alpha(0.1) // Reduce the simulation intensity
      .alphaDecay(0.001) // Make it decay very slowly
      .velocityDecay(0.3) // Add some damping to prevent wild movements
      .on('tick', updatePositions); // Update positions on each tick

    // Store initial positions
    const initialPositions = new Map(nodes.map(node => [node.id, { x: node.x, y: node.y }]));

    // Set up zoom behavior with adjusted scale
    const zoom = d3.zoom()
      .scaleExtent([0.1, 20])
      .filter(event => {
        if (event.type === 'mousedown' && event.button === 2) return false;
        return true;
      })
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Apply zoom behavior with smooth transition
    svg.call(zoom as any)
      .call(zoom.transform as any, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(0.7)
        .translate(-width / 2, -height / 2));

    // Prevent mousewheel from scrolling page
    svg.on('wheel', (event: Event) => {
      event.preventDefault();
    });

    // Add different shapes for documents and tags
    nodeGroup.each(function(d) {
      const node = d3.select(this);
      if (d.type === 'document') {
        // Document nodes get circles
        node.append('circle')
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
          .style('filter', 'url(#glow)')
          .style('cursor', 'pointer')
          .on('click', (event: any, d: any) => {
            window.open(`/api/document/${d.path}`, '_blank');
          });
      } else {
        // Tag nodes get hexagons
        const size = (d.tagCount || 1) * 10;
        const hexagonPath = d3.line()([[0, -size], [size * 0.866, -size/2], 
          [size * 0.866, size/2], [0, size], [-size * 0.866, size/2], 
          [-size * 0.866, -size/2], [0, -size]]);
        
        node.append('path')
          .attr('d', hexagonPath)
          .attr('fill', '#ffffff')
          .attr('stroke', '#000000')
          .attr('stroke-width', 1)
          .style('filter', 'url(#glow)');
      }
    });

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

    // Add labels with different styles for documents and tags
    nodeGroup.append('text')
      .text(d => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'tag' ? '0.35em' : '30')
      .attr('fill', d => d.type === 'tag' ? '#000000' : '#333333')
      .style('font-size', d => d.type === 'tag' ? `${Math.min(14, 10 + (d.tagCount || 1))}px` : '11px')
      .style('font-family', 'monospace')
      .style('font-weight', d => d.type === 'tag' ? 'bold' : 'normal')
      .style('opacity', 0.7)
      .style('cursor', d => d.type === 'document' ? 'pointer' : 'default')
      .on('click', (event: any, d: any) => {
        if (d.type === 'document') {
          window.open(`/api/document/${d.path}`, '_blank');
        }
      });

    // Add pulsing animation to nodes
    nodeGroup.each(function(d) {
      const node = d3.select(this);
      if (d.type === 'document') {
        node.append('animate')
          .attr('attributeName', 'r')
          .attr('values', '15;17;15')
          .attr('dur', '3s')
          .attr('repeatCount', 'indefinite');
      }
    });

    // Add CSS animation for dashed lines
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes dash {
        to {
          stroke-dashoffset: 100;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
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