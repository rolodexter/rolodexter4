/**
 * KnowledgeGraph Component
 * 
 * Visualizes the relationships between different pieces of knowledge in the system.
 * Used in the dashboard to show how different concepts and documents are connected.
 * 
 * Related Tasks:
 * - Codebase Restructure: agents/rolodexterVS/tasks/active-tasks/codebase-restructure.html
 */

import React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  type: 'document' | 'tag' | 'status';
  tagCount?: number;
  status?: string;
  x?: number;
  y?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
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

    // Process tags, dates, and statuses from documents
    const tagFrequency = new Map<string, number>();
    const dateFrequency = new Map<string, number>();
    const statusFrequency = new Map<string, number>();
    
    data.documents.forEach(doc => {
      const content = doc.path.toLowerCase();
      
      // Extract status - improved path detection
      let status = null;
      if (content.includes('/tasks/')) {
        if (content.includes('/active-tasks/') || content.includes('/active/')) {
          status = 'active';
        } else if (content.includes('/pending-tasks/') || content.includes('/pending/')) {
          status = 'pending';
        } else if (content.includes('/resolved-tasks/') || content.includes('/resolved/') || content.includes('/completed/')) {
          status = 'resolved';
        }
      }
      
      if (status) {  // Only count if it's a known status
        statusFrequency.set(status, (statusFrequency.get(status) || 0) + 1);
      }
      
      // Extract tags
      const tags = content.match(/graph-tags content="([^"]+)"/);
      if (tags) {
        tags[1].split(',').map(tag => tag.trim()).forEach(tag => {
          tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
        });
      }
      
      // Extract dates
      const dateMatches = doc.path.match(/\d{4}-\d{2}-\d{2}/g) || [];
      dateMatches.forEach(date => {
        dateFrequency.set(date, (dateFrequency.get(date) || 0) + 1);
      });
    });

    // Create status nodes
    const statusNodes: Node[] = Array.from(statusFrequency.entries()).map(([status, count]) => ({
      id: `status:${status}`,
      title: status.toUpperCase(),
      path: '',
      type: 'status',
      tagCount: count
    }));

    // Create tag nodes
    const tagNodes: Node[] = Array.from(tagFrequency.entries()).map(([tag, count]) => ({
      id: `tag:${tag}`,
      title: tag,
      path: '',
      type: 'tag',
      tagCount: count
    }));

    // Create date nodes
    const dateNodes: Node[] = Array.from(dateFrequency.entries()).map(([date, count]) => ({
      id: `date:${date}`,
      title: date,
      path: '',
      type: 'tag', // Using tag type for similar visual treatment
      tagCount: count
    }));

    // Create document nodes with type
    const documentNodes: Node[] = data.documents.map(doc => ({
      ...doc,
      type: 'document'
    }));

    // Combine all nodes
    const nodes = [...documentNodes, ...tagNodes, ...dateNodes, ...statusNodes];

    // Create document-tag and document-date links
    const metadataLinks: Link[] = documentNodes.flatMap(doc => {
      const links: Link[] = [];
      
      // Add tag links
      const tags = doc.path.toLowerCase().match(/graph-tags content="([^"]+)"/);
      if (tags) {
        tags[1].split(',').map(tag => tag.trim()).forEach(tag => {
          links.push({
            source: doc.id,
            target: `tag:${tag}`,
            confidence: 0.5,
            type: 'document-tag'
          });
        });
      }
      
      // Add date links
      const dateMatches = doc.path.match(/\d{4}-\d{2}-\d{2}/g) || [];
      dateMatches.forEach(date => {
        links.push({
          source: doc.id,
          target: `date:${date}`,
          confidence: 0.5,
          type: 'document-tag'
        });
      });
      
      return links;
    });

    // Create document-status links
    const statusLinks: Link[] = documentNodes.flatMap(doc => {
      const links: Link[] = [];
      const path = doc.path.toLowerCase();
      
      if (path.includes('/tasks/')) {
        let status = null;
        if (path.includes('/active-tasks/') || path.includes('/active/')) {
          status = 'active';
        } else if (path.includes('/pending-tasks/') || path.includes('/pending/')) {
          status = 'pending';
        } else if (path.includes('/resolved-tasks/') || path.includes('/resolved/') || path.includes('/completed/')) {
          status = 'resolved';
        }

        if (status) {
          links.push({
            source: doc.id,
            target: `status:${status}`,
            confidence: 0.8,
            type: 'document-tag'
          });
        }
      }
      return links;
    });

    // Combine all links
    const documentLinks: Link[] = Object.values(data.references).flat().map(link => ({
      ...link,
      type: 'document-document'
    }));
    const links = [...documentLinks, ...metadataLinks, ...statusLinks];

    // Calculate node connections for depth effect
    const nodeConnections = new Map<string, number>();
    links.forEach(link => {
      const source = link.source as (Node | string);
      const target = link.target as (Node | string);
      const sourceId = typeof source === 'object' ? source.id : source;
      const targetId = typeof target === 'object' ? target.id : target;
      nodeConnections.set(sourceId, (nodeConnections.get(sourceId) || 0) + 1);
      nodeConnections.set(targetId, (nodeConnections.get(targetId) || 0) + 1);
    });

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
        .distance((d: Link) => {
          const source = d.source as (Node | string);
          const target = d.target as (Node | string);
          const sourceId = typeof source === 'object' ? source.id : source;
          const targetId = typeof target === 'object' ? target.id : target;
          const sourceConn = nodeConnections.get(sourceId) || 0;
          const targetConn = nodeConnections.get(targetId) || 0;
          return (d.type === 'document-tag' ? 400 : 600) * (1 + 1 / Math.max(sourceConn, targetConn));
        })
        .strength(0.5))
      .force('charge', d3.forceManyBody<Node>()
        .strength((d: Node) => {
          const connections = nodeConnections.get(d.id) || 0;
          return d.type === 'tag' ? -2000 : -3000 * (1 + connections / 5);
        })
        .distanceMax(1000)
        .theta(0.9))
      .force('center', d3.forceCenter<Node>(width / 2, height / 2).strength(0.05))
      .force('collision', d3.forceCollide<Node>()
        .radius((d: Node) => {
          const connections = nodeConnections.get(d.id) || 0;
          const baseRadius = d.type === 'tag' ? (d.tagCount || 1) * 30 : 80;
          return baseRadius * (1 + connections / 10);
        })
        .strength(1)
        .iterations(4))
      .force('x', d3.forceX<Node>().strength(0.01).x(d => {
        const connections = nodeConnections.get(d.id) || 0;
        // More connected nodes tend towards center horizontally
        const offset = 1 - Math.min(connections / 5, 1);
        if (d.type === 'tag') return width * (0.3 + offset * 0.2);
        if (d.path.includes('/tasks/')) return width * (0.6 + offset * 0.2);
        if (d.path.includes('/memories/')) return width * (0.7 + offset * 0.2);
        return width * (0.5 + offset * 0.2);
      }))
      .force('y', d3.forceY<Node>().strength(0.01).y(d => {
        const connections = nodeConnections.get(d.id) || 0;
        // More connected nodes tend towards center vertically
        const offset = 1 - Math.min(connections / 5, 1);
        if (d.type === 'tag') return height * (0.5 + offset * 0.2);
        if (d.path.includes('/tasks/')) return height * (0.3 + offset * 0.2);
        if (d.path.includes('/memories/')) return height * (0.7 + offset * 0.2);
        return height * (0.5 + offset * 0.2);
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

    // Enhance glow effect based on connections
    const defs = svg.append('defs');
    
    // Enhanced shadow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    // Gaussian blur for soft shadow
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');

    // Offset the shadow
    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', '2')
      .attr('dy', '2')
      .attr('result', 'offsetBlur');

    // Create lighting effect
    filter.append('feSpecularLighting')
      .attr('in', 'blur')
      .attr('surfaceScale', '5')
      .attr('specularConstant', '1')
      .attr('specularExponent', '20')
      .attr('lighting-color', '#ffffff')
      .attr('result', 'specOut')
      .append('fePointLight')
      .attr('x', '-5000')
      .attr('y', '-10000')
      .attr('z', '20000');

    // Combine effects
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'specOut');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Modify node appearance with enhanced 3D effects
    nodeGroup.each(function(d) {
      const node = d3.select(this);
      const data = d as Node;
      const connections = nodeConnections.get(data.id) || 0;
      const depth = Math.min(connections / 5, 1);

      if (data.type === 'document' || data.type === 'status') {
        // Document and status nodes get circles with consistent styling
        node.append('circle')
          .attr('r', d => {
            const data = d as Node;
            const connections = nodeConnections.get(data.id) || 0;
            return 15 * (1 + connections * 0.1);
          })
          .attr('fill', d => {
            const data = d as Node;
            const connections = nodeConnections.get(data.id) || 0;
            // Use same base color and darkening rules for both document and status nodes
            let color = '#e6e6e6';  // Very light base gray
            if (data.type === 'status') {
              const status = data.title.toLowerCase();
              if (status === 'active') color = '#dedede';
              else if (status === 'pending') color = '#d6d6d6';
              else if (status === 'resolved') color = '#cecece';
            } else if (data.path.includes('/tasks/')) {
              color = '#dedede';
            } else if (data.path.includes('/memories/')) {
              color = '#d6d6d6';
            } else if (data.path.includes('/documentation/')) {
              color = '#cecece';
            }
            const darkenAmount = Math.min(connections / 3, 2.0);
            return d3.color(color)?.darker(darkenAmount).toString() || color;
          })
          .attr('stroke', 'none')
          .attr('stroke-width', 0)
          .style('filter', 'url(#glow)')
          .style('opacity', 0.9)
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', 2 + depth)
              .style('opacity', 1);
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke-width', 1 + depth)
              .style('opacity', 0.9);
          })
          .on('click', function(event, d) {
            const data = d as Node;
            if (data.type === 'document') {
              window.open(`/api/document/${data.path}`, '_blank');
            } else if (data.type === 'status') {
              const status = data.title.toLowerCase();
              window.open(`/api/document/list?status=${status}`, '_blank');
            }
          });

      } else {
        const isDateNode = d.id.startsWith('date:');
        const baseSize = isDateNode ? 8 : 10;
        const size = (d.tagCount || 1) * baseSize * (1 + connections * 0.1);
        
        if (isDateNode) {
          // Enhanced diamond nodes
          const diamondPath = d3.line()([[0, -size], [size, 0], [0, size], [-size, 0], [0, -size]]);
          
          // Add shadow/backdrop for depth
          node.append('path')
            .attr('d', diamondPath)
            .attr('transform', 'translate(2, 2)')
            .attr('fill', '#000000')
            .style('opacity', 0.2);

          node.append('path')
            .attr('d', diamondPath)
            .attr('fill', '#e5e7eb')
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
            .style('filter', 'url(#glow)')
            .style('opacity', 0.9)
            .on('mouseover', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('stroke-width', 2 + depth)
                .style('opacity', 1);
            })
            .on('mouseout', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('stroke-width', 1 + depth)
                .style('opacity', 0.9);
            });
        } else {
          // Enhanced hexagon nodes
          const hexagonPath = d3.line()([[0, -size], [size * 0.866, -size/2], 
            [size * 0.866, size/2], [0, size], [-size * 0.866, size/2], 
            [-size * 0.866, -size/2], [0, -size]]);
          
          // Add shadow/backdrop for depth
          node.append('path')
            .attr('d', hexagonPath)
            .attr('transform', 'translate(2, 2)')
            .attr('fill', '#000000')
            .style('opacity', 0.2);

          node.append('path')
            .attr('d', hexagonPath)
            .attr('fill', '#ffffff')
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
            .style('filter', 'url(#glow)')
            .style('opacity', 0.9)
            .on('mouseover', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('stroke-width', 2 + depth)
                .style('opacity', 1);
            })
            .on('mouseout', function() {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('stroke-width', 1 + depth)
                .style('opacity', 0.9);
            });
        }
      }
    });

    // Add labels with different styles for documents and tags
    nodeGroup.append('text')
      .text((d: Node) => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', (d: Node) => {
        if (d.type === 'document') return '30';
        return d.id.startsWith('date:') ? '0.35em' : '0.35em';
      })
      .attr('fill', (d: Node) => {
        if (d.type === 'document') return '#333333';
        if (d.type === 'status') return '#666666';  // Lighter color for status text
        return d.id.startsWith('date:') ? '#4b5563' : '#000000';
      })
      .style('font-size', (d: Node) => {
        if (d.type === 'document') return '11px';
        if (d.type === 'status') return '10px';  // Smaller font for status
        return d.id.startsWith('date:') ? '10px' : `${Math.min(14, 10 + (d.tagCount || 1))}px`;
      })
      .style('font-family', 'monospace')
      .style('font-weight', (d: Node) => {
        if (d.type === 'document') return 'normal';
        if (d.type === 'status') return 'normal';  // Normal weight for status
        return d.id.startsWith('date:') ? 'normal' : 'bold';
      })
      .style('opacity', (d: Node) => {
        if (d.type === 'status') return 0.6;  // More transparent for status
        return 0.7;
      })
      .style('cursor', (d: Node) => d.type === 'document' ? 'pointer' : 'default')
      .on('click', (event: MouseEvent, d: Node) => {
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