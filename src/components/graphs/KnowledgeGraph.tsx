/**
 * KnowledgeGraph Component
 * 
 * Visualizes the relationships between different pieces of knowledge in the system.
 * Used in the dashboard to show how different concepts and documents are connected.
 * 
 * Features:
 * - Interactive node dragging and zooming
 * - Hover preview of document content
 * - Dynamic node sizing based on connections
 * - Animated relationship lines
 * 
 * Related Documentation:
 * - Knowledge Graph Conventions: docs/specifications/knowledge-graph-conventions.md
 * - Dashboard UI Task: projects/rolodexter4/ui/tasks/active/dashboard-ui-task.html
 * 
 * Implementation Details:
 * - Session Log (2025-02-18): agents/memories/session-logs/2025/02/18.html
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  type: 'document' | 'tag' | 'status';
  x?: number;
  y?: number;
  content?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  confidence: number;
  type: 'document-document' | 'document-tag';
}

interface GraphData {
  documents: Node[];
  references: {
    [key: string]: Link[];
  };
}

// Error boundary component
class KnowledgeGraphErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('KnowledgeGraph Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-4">
            <h3 className="text-lg font-semibold mb-2">Graph Visualization Error</h3>
            <p className="text-gray-600 mb-4">There was an error loading the knowledge graph.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const KnowledgeGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodeConnectionsMap, setNodeConnectionsMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/graph');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        
        // Basic validation of the response data
        if (!jsonData.documents || !jsonData.references) {
          throw new Error('Invalid data structure received from API');
        }
        
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
        console.error('Error fetching graph data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Calculate node connections and validate links
    const connections = new Map<string, number>();
    const nodeIds = new Set(data.documents.map(node => node.id));
    
    // Filter and validate links
    const validLinks = Object.values(data.references)
      .flat()
      .filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        const isValid = nodeIds.has(sourceId) && nodeIds.has(targetId);
        
        if (isValid) {
          connections.set(sourceId, (connections.get(sourceId) || 0) + 1);
          connections.set(targetId, (connections.get(targetId) || 0) + 1);
        } else {
          console.warn(`Invalid link found: ${sourceId} -> ${targetId}`);
        }
        
        return isValid;
      });

    setNodeConnectionsMap(connections);

    // Node styling functions
    const getNodeSize = (nodeId: string) => {
      const connectionCount = connections.get(nodeId) || 0;
      const baseSize = 15;
      return baseSize * (1 + Math.log1p(connectionCount) * 0.3);
    };

    const getNodeColor = (nodeId: string) => {
      const connectionCount = connections.get(nodeId) || 0;
      const baseValue = 220; // Light gray base
      const darkenAmount = Math.min(connectionCount * 15, 80); // Max darkening of 80
      const intensity = Math.max(baseValue - darkenAmount, 140); // Minimum intensity of 140
      return `rgb(${intensity}, ${intensity}, ${intensity})`;
    };

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height].join(' '));

    // Clear any existing content
    svg.selectAll("*").remove();

    // Create container for all graph elements with initial transform
    const container = svg.append('g')
      .attr('class', 'container')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create separate groups for links and nodes
    const linksGroup = container.append('g').attr('class', 'links');
    const nodesGroup = container.append('g').attr('class', 'nodes');
    const labelsGroup = container.append('g').attr('class', 'labels');

    // Configure zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2])
      .filter(event => {
        // Prevent zoom behavior during drag
        if (event.type === 'mousedown' && (event.target as Element).tagName === 'circle') {
          return false;
        }
        return true;
      })
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Apply zoom to svg
    svg.call(zoom);

    // Create force simulation with more stable parameters
    const simulation = d3.forceSimulation<Node>()
      .force('link', d3.forceLink<Node, Link>().id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody()
        .strength(-400)
        .distanceMin(50)
        .distanceMax(300))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(40).strength(1))
      .velocityDecay(0.6)
      .alpha(0.3)
      .alphaDecay(0.01)
      .alphaMin(0.001)
      .on('tick', () => {
        // Constrain nodes to viewport
        data.documents.forEach(node => {
          node.x = Math.max(-width/2, Math.min(width/2, node.x || 0));
          node.y = Math.max(-height/2, Math.min(height/2, node.y || 0));
        });

        // Update positions
        link
          .attr('x1', d => (d.source as Node).x!)
          .attr('y1', d => (d.source as Node).y!)
          .attr('x2', d => (d.target as Node).x!)
          .attr('y2', d => (d.target as Node).y!);

        nodeSelection
          .attr('cx', d => d.x!)
          .attr('cy', d => d.y!);

        labels
          .attr('x', d => d.x!)
          .attr('y', d => d.y!);
      });

    // Define drag behavior with improved stability
    const drag = d3.drag<SVGCircleElement, Node>()
      .on('start', (event) => {
        if (!event.active) {
          simulation.alphaTarget(0.3).restart();
        }
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        d3.select(event.sourceEvent.target)
          .style('cursor', 'grabbing');
      })
      .on('drag', (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) {
          simulation.alphaTarget(0);
        }
        event.subject.fx = null;
        event.subject.fy = null;
        d3.select(event.sourceEvent.target)
          .style('cursor', 'grab');
      });

    // Create nodes with improved styling
    const nodeSelection = nodesGroup
      .selectAll<SVGCircleElement, Node>('circle')
      .data(data.documents)
      .join('circle')
      .attr('r', d => getNodeSize(d.id))
      .attr('fill', d => getNodeColor(d.id))
      .style('cursor', 'grab')
      .style('stroke', '#fff')
      .style('stroke-width', '1px')
      .style('stroke-opacity', 0.5)
      .call(drag as any);

    // Create links with enhanced styling and animations
    const link = linksGroup
      .selectAll('line')
      .data(validLinks)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.confidence || 1))
      .style('stroke-dasharray', '6,3')
      .style('animation', 'dash 20s linear infinite')
      .style('transition', 'all 300ms ease-in-out');

    // Add animated gradient definitions
    const defs = svg.append('defs');
    
    // Create gradient for hover effect
    const gradient = defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('gradientUnits', 'userSpaceOnUse');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#999');
    
    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#666');
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#999');

    // Add styles to the document head
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dash {
        to {
          stroke-dashoffset: -30;
        }
      }
      @keyframes glow {
        0% { filter: drop-shadow(0 0 2px rgba(255,255,255,0.7)); }
        50% { filter: drop-shadow(0 0 4px rgba(255,255,255,0.9)); }
        100% { filter: drop-shadow(0 0 2px rgba(255,255,255,0.7)); }
      }
      @keyframes fadeInText {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .preview-text {
        animation: fadeInText 0.3s ease-out forwards;
        font-family: monospace;
        font-size: 8px;
        fill: rgba(255, 255, 255, 0.9);
        pointer-events: none;
        text-shadow: 0 0 2px rgba(0,0,0,0.5);
      }
    `;
    document.head.appendChild(style);

    // Enhanced hover effects
    nodeSelection
      .on('mouseover', async function(event, d) {
        console.log('Node hover started:', d.title); // Debug log

        // Highlight the node
        d3.select(this)
          .transition()
          .duration(300)
          .style('stroke-width', '3px')
          .style('stroke-opacity', 1)
          .style('filter', 'drop-shadow(0 0 4px rgba(255,255,255,0.7))')
          .style('animation', 'glow 1.5s ease-in-out infinite');

        // Fetch and display content preview if not already loaded
        if (!d.content && d.path.endsWith('.html')) {
          console.log('Fetching content for:', d.path); // Debug log
          try {
            const response = await fetch(`/api/document/${encodeURIComponent(d.path)}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            console.log('Content fetched successfully'); // Debug log
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            // Extract text content and clean it up
            const content = tempDiv.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) + '...';
            d.content = content;
          } catch (error) {
            console.error('Error fetching content:', error);
            d.content = 'Content preview unavailable';
          }
        }

        // Create or update preview text
        const previewGroup = container.append('g')
          .attr('class', 'preview-group')
          .attr('transform', `translate(${d.x}, ${d.y})`);

        console.log('Creating preview at:', { x: d.x, y: d.y }); // Debug log

        // Add semi-transparent background for better readability
        const previewBackground = previewGroup.append('rect')
          .attr('class', 'preview-background')
          .attr('x', -100)
          .attr('y', getNodeSize(d.id) + 10)
          .attr('width', 200)
          .attr('height', 80)
          .attr('fill', 'rgba(0, 0, 0, 0.3)')
          .attr('rx', 4)
          .style('opacity', 0)
          .transition()
          .duration(300)
          .style('opacity', 1);

        const previewText = previewGroup.append('text')
          .attr('class', 'preview-text')
          .attr('text-anchor', 'middle')
          .attr('dy', getNodeSize(d.id) + 20);

        // Split text into multiple lines
        const words = (d.content || '').split(' ');
        let line = '';
        let lineNumber = 0;
        const maxWidth = 80; // Reduced characters per line

        words.forEach((word, i) => {
          const testLine = line + word + ' ';
          if (testLine.length > maxWidth) {
            previewText.append('tspan')
              .attr('x', 0)
              .attr('dy', lineNumber === 0 ? 0 : '1.2em')
              .text(line.trim());
            line = word + ' ';
            lineNumber++;
            if (lineNumber >= 4) { // Reduced to 4 lines
              if (i === words.length - 1) {
                line += '...';
              }
              return;
            }
          } else {
            line = testLine;
            if (i === words.length - 1) {
              previewText.append('tspan')
                .attr('x', 0)
                .attr('dy', lineNumber === 0 ? 0 : '1.2em')
                .text(line.trim());
            }
          }
        });

        console.log('Preview text created with lines:', lineNumber + 1); // Debug log

        // Highlight connected links with gradient effect
        link
          .style('stroke', function(l) {
            const sourceId = (typeof l.source === 'object' ? l.source.id : l.source).toString();
            const targetId = (typeof l.target === 'object' ? l.target.id : l.target).toString();
            return (sourceId === d.id || targetId === d.id) ? 'url(#link-gradient)' : '#999';
          })
          .style('stroke-opacity', l => {
            const sourceId = (typeof l.source === 'object' ? l.source.id : l.source).toString();
            const targetId = (typeof l.target === 'object' ? l.target.id : l.target).toString();
            return (sourceId === d.id || targetId === d.id) ? 1 : 0.2;
          })
          .style('stroke-width', l => {
            const sourceId = (typeof l.source === 'object' ? l.source.id : l.source).toString();
            const targetId = (typeof l.target === 'object' ? l.target.id : l.target).toString();
            return (sourceId === d.id || targetId === d.id) 
              ? Math.sqrt((l.confidence || 1) * 2)
              : Math.sqrt(l.confidence || 1);
          });

        // Highlight connected nodes
        nodeSelection
          .style('opacity', n => {
            const isConnected = validLinks.some(l => {
              const sourceId = (typeof l.source === 'object' ? l.source.id : l.source).toString();
              const targetId = (typeof l.target === 'object' ? l.target.id : l.target).toString();
              return (sourceId === d.id && targetId === n.id) || (targetId === d.id && sourceId === n.id);
            });
            return n.id === d.id || isConnected ? 1 : 0.4;
          });

        // Highlight connected labels
        labels
          .style('opacity', n => {
            const isConnected = validLinks.some(l => {
              const sourceId = (typeof l.source === 'object' ? l.source.id : l.source).toString();
              const targetId = (typeof l.target === 'object' ? l.target.id : l.target).toString();
              return (sourceId === d.id && targetId === n.id) || (targetId === d.id && sourceId === n.id);
            });
            return n.id === d.id || isConnected ? 1 : 0.3;
          })
          .style('font-weight', n => n.id === d.id ? 'bold' : 'normal');
      })
      .on('mouseout', function(event, d) {
        console.log('Node hover ended:', d.title); // Debug log
        
        // Remove preview text
        container.selectAll('.preview-group').remove();

        // Reset node highlight
        d3.select(this)
          .transition()
          .duration(300)
          .style('stroke-width', '1px')
          .style('stroke-opacity', 0.5)
          .style('filter', null)
          .style('animation', null);

        // Reset links
        link
          .style('stroke', '#999')
          .style('stroke-opacity', 0.6)
          .style('stroke-width', d => Math.sqrt(d.confidence || 1));

        // Reset all nodes
        nodeSelection
          .style('opacity', 1);

        // Reset all labels
        labels
          .style('opacity', 0.7)
          .style('font-weight', 'normal');
      });

    // Add labels with better positioning
    const labels = labelsGroup
      .selectAll('text')
      .data(data.documents)
      .join('text')
      .text(d => d.title)
      .attr('font-size', '8px')
      .attr('dx', d => getNodeSize(d.id) + 5)
      .attr('dy', 3)
      .style('pointer-events', 'none')
      .style('opacity', 0.7);

    // Initialize node positions in a more spread out pattern
    data.documents.forEach((node, i) => {
      const angle = (i * 2 * Math.PI) / data.documents.length;
      const radius = Math.min(width, height) / 4;
      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
    });

    // Set up links after node initialization with validated links
    simulation.force<d3.ForceLink<Node, Link>>('link')!
      .links(validLinks);

    // Set initial zoom transform
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.8);
    svg.call(zoom.transform, initialTransform);

    // Cleanup
    return () => {
      simulation.stop();
      style.remove();
    };
  }, [data, nodeConnectionsMap]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <h3 className="text-lg font-semibold mb-2">Error Loading Graph</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default function SafeKnowledgeGraph() {
  return (
    <KnowledgeGraphErrorBoundary>
      <KnowledgeGraph />
    </KnowledgeGraphErrorBoundary>
  );
}
