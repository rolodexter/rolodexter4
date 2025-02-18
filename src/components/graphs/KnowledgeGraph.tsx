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

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/router';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  type: 'document' | 'tag' | 'status';
  x?: number;
  y?: number;
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

// Error boundary component for graceful fallback
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

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  } as T;
}

export const KnowledgeGraph: React.FC = () => {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wheelTimeoutRef = useRef<NodeJS.Timeout>();
  const isDragging = useRef(false);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = debounce(() => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle document opening
  const handleDocumentOpen = useCallback((path: string) => {
    console.log('Attempting to open document:', path);
    
    const documentPath = `/api/document/${encodeURIComponent(path.replace(/^\//, ''))}`;
    console.log('Formatted path:', documentPath);

    // Try multiple methods to open the document
    const methods = [
      // Method 1: Router push with window open
      () => {
        console.log('Trying method 1: Router push with window open');
        router.push(documentPath).then(() => {
          window.open(documentPath, '_blank', 'noopener,noreferrer');
        });
      },
      // Method 2: Direct window open
      () => {
        console.log('Trying method 2: Direct window open');
        const newWindow = window.open(documentPath, '_blank', 'noopener,noreferrer');
        if (!newWindow) throw new Error('Popup blocked');
      },
      // Method 3: Create and click link
      () => {
        console.log('Trying method 3: Create and click link');
        const link = document.createElement('a');
        link.href = documentPath;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      // Method 4: Fetch then open
      async () => {
        console.log('Trying method 4: Fetch then open');
        const response = await fetch(documentPath);
        if (!response.ok) throw new Error('Failed to fetch');
        window.open(documentPath, '_blank', 'noopener,noreferrer');
      }
    ];

    // Try each method in sequence until one works
    const tryNextMethod = async (index = 0) => {
      if (index >= methods.length) {
        console.error('All methods failed');
        alert('Could not open the document. Please try again or check your popup blocker.');
        return;
      }

      try {
        await Promise.resolve(methods[index]());
      } catch (error) {
        console.warn(`Method ${index + 1} failed:`, error);
        tryNextMethod(index + 1);
      }
    };

    tryNextMethod();
  }, [router]);

  // Fetch data
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
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch graph data');
        console.error('Error fetching graph data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Setup and update visualization
  useEffect(() => {
    if (!data || !svgRef.current || !dimensions.width || !dimensions.height) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Calculate node connections for visual weighting
    const connections = new Map<string, number>();
    Object.values(data.references)
      .flat()
      .forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        connections.set(sourceId, (connections.get(sourceId) || 0) + 1);
        connections.set(targetId, (connections.get(targetId) || 0) + 1);
      });

    // Node styling functions
    const getNodeSize = (nodeId: string) => {
      const connectionCount = connections.get(nodeId) || 0;
      const baseSize = 8;  // Reduced from 15
      
      // Find the 80th percentile threshold
      const allConnections = Array.from(connections.values());
      const sortedConnections = [...allConnections].sort((a, b) => a - b);
      const threshold = sortedConnections[Math.floor(sortedConnections.length * 0.8)];
      
      // Apply more moderate scaling for highly connected nodes
      if (connectionCount > threshold) {
        const scaleFactor = 1 + Math.pow((connectionCount - threshold) / threshold, 0.6); // Reduced power from 1.5 to 0.6
        return baseSize * (1.2 + scaleFactor * 0.3); // Reduced multipliers
      }
      
      // Linear scaling for less connected nodes
      return baseSize * (1 + (connectionCount / threshold) * 0.2); // Reduced from 0.5 to 0.2
    };

    const getNodeColor = (nodeId: string) => {
      const connectionCount = connections.get(nodeId) || 0;
      
      // Find the 80th percentile threshold
      const allConnections = Array.from(connections.values());
      const sortedConnections = [...allConnections].sort((a, b) => a - b);
      const threshold = sortedConnections[Math.floor(sortedConnections.length * 0.8)];
      
      const baseValue = 220; // Light gray
      let darkenAmount;
      
      if (connectionCount > threshold) {
        // Exponential darkening for highly connected nodes
        const ratio = (connectionCount - threshold) / threshold;
        darkenAmount = Math.min(160, 80 + Math.pow(ratio, 1.5) * 80);
      } else {
        // Linear darkening for less connected nodes
        darkenAmount = Math.min(80, (connectionCount / threshold) * 80);
      }
      
      const intensity = Math.max(baseValue - darkenAmount, 60); // Allow darker grays down to 60
      return `rgb(${intensity}, ${intensity}, ${intensity})`;
    };

    // Calculate node shell position based on connections
    const getNodeShellRadius = (nodeId: string) => {
      const connectionCount = connections.get(nodeId) || 0;
      const allConnections = Array.from(connections.values());
      const sortedConnections = [...allConnections].sort((a, b) => b - a); // Sort descending
      const percentile = sortedConnections.findIndex(c => c <= connectionCount) / sortedConnections.length;
      
      // Map percentile to radius - more connected nodes are closer to center
      const minRadius = width * 0.1;  // Inner shell
      const maxRadius = width * 0.4;  // Outer shell
      return minRadius + (maxRadius - minRadius) * percentile;
    };

    // Set up container for zoom with 3D perspective
    svg.attr('width', width)
       .attr('height', height)
       .attr('viewBox', [-width/2, -height/2, width, height].join(' '))
       .style('overflow', 'visible');

    // Simplified container structure
    const container = svg.append('g')
                        .attr('class', 'container');

    // Main container for all transformations
    const transformContainer = container.append('g')
                                     .attr('class', 'transform-container');

    // Create separate groups for better organization
    const linksGroup = transformContainer.append('g').attr('class', 'links');
    const nodesGroup = transformContainer.append('g').attr('class', 'nodes');
    const labelsGroup = transformContainer.append('g').attr('class', 'labels');

    // Track transform state
    let currentTransform = d3.zoomIdentity;

    // Create links with proper positioning
    const links = Object.values(data.references).flat();
    
    // Initialize force simulation with lower decay
    const simulation = d3.forceSimulation<Node>(data.documents)
      .force('link', d3.forceLink<Node, Link>(links)
        .id(d => d.id)
        .distance(d => {
          const sourceRadius = getNodeShellRadius((d.source as Node).id);
          const targetRadius = getNodeShellRadius((d.target as Node).id);
          const sourceConnections = connections.get((d.source as Node).id) || 0;
          const targetConnections = connections.get((d.target as Node).id) || 0;
          const connectionFactor = Math.max(sourceConnections, targetConnections) * 2;
          return Math.abs(sourceRadius - targetRadius) + 100 + connectionFactor;
        }))
      .force('charge', d3.forceManyBody<Node>()
        .strength(d => {
          const radius = getNodeShellRadius(d.id);
          const connectionCount = connections.get(d.id) || 0;
          return -1500 * (1 - radius / (width * 0.4)) * (1 + connectionCount * 0.1);
        })
        .distanceMax(width * 0.5))
      .force('collision', d3.forceCollide<Node>()
        .radius(d => getNodeSize(d.id) * 3)
        .strength(1))
      .force('center', d3.forceCenter(0, 0).strength(0.1))
      .velocityDecay(0.6)
      .alpha(0.5)
      .alphaDecay(0.01)
      .alphaMin(0.001)
      .alphaTarget(0.05); // Keep a small constant motion

    // Setup unified zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        currentTransform = event.transform;
        transformContainer.attr('transform', currentTransform.toString());
      })
      .on('end', () => {
        // Resume simulation with a gentle alpha target when zoom ends
        simulation.alpha(0.3).restart();
      });

    // Initialize zoom behavior
    svg.call(zoomBehavior)
       .call(zoomBehavior.transform, d3.zoomIdentity)
       .on('wheel', (event) => {
         event.preventDefault();
         isInteracting = true;
         // Clear any existing timeout
         if (wheelTimeoutRef.current) {
           clearTimeout(wheelTimeoutRef.current);
         }
         // Set a new timeout to resume simulation after wheel stops
         wheelTimeoutRef.current = setTimeout(() => {
           isInteracting = false;
           simulation.alpha(0.3).restart();
         }, 150);
       });

    // Create nodes with improved drag behavior
    const drag = d3.drag<SVGCircleElement, Node>()
      .on('start', (event, d) => {
        isDragging.current = true;
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = (event.x - currentTransform.x) / currentTransform.k;
        d.fy = (event.y - currentTransform.y) / currentTransform.k;
        d3.select(event.sourceEvent.target).style('cursor', 'grabbing');
        event.sourceEvent.stopPropagation();
      })
      .on('drag', (event, d) => {
        d.fx = (event.x - currentTransform.x) / currentTransform.k;
        d.fy = (event.y - currentTransform.y) / currentTransform.k;
        event.sourceEvent.stopPropagation();
      })
      .on('end', (event, d) => {
        setTimeout(() => {
          isDragging.current = false;
        }, 0);
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3.select(event.sourceEvent.target).style('cursor', 'pointer');
        event.sourceEvent.stopPropagation();
      });

    // Create the link elements
    const link = linksGroup
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => Math.sqrt(d.confidence || 1) * 0.5);

    // Create the node elements with drag behavior
    const nodeGroup = nodesGroup
      .selectAll('g')
      .data(data.documents)
      .join('g');

    // Add clickable links
    nodeGroup
      .append('a')
      .attr('href', d => `/api/document/${encodeURIComponent(d.path.replace(/^\//, ''))}`)
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .append('circle')
      .attr('r', d => getNodeSize(d.id))
      .attr('fill', d => getNodeColor(d.id))
      .style('cursor', 'pointer')
      .style('stroke', '#fff')
      .style('stroke-width', '0.5px')
      .style('stroke-opacity', 0.3)
      .call(drag as any);

    // Add labels with improved styling
    const labels = labelsGroup
      .selectAll('text')
      .data(data.documents)
      .join('text')
      .attr('font-size', '10px')
      .attr('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'text-after-edge')
      .style('pointer-events', 'none')
      .style('opacity', 0.7)
      .style('text-rendering', 'optimizeLegibility')
      .each(function(d) {
        const text = d3.select(this);
        
        // Clean up the title but preserve the full name
        let cleanTitle = d.title
          .replace(/\.html$/, '')  // Remove .html extension
          .replace(/([A-Z])/g, ' $1')  // Add spaces before capitals
          .trim()
          .replace(/[-_]/g, ' ');  // Convert dashes and underscores to spaces
        
        // Split into words
        const words = cleanTitle.split(/\s+/).filter(Boolean);
        
        text.text(''); // Clear existing text
        
        // Calculate roughly half the words for each line
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join(' ');
        const secondLine = words.slice(midPoint).join(' ');
        
        // Add first line
        text.append('tspan')
          .attr('x', 0)
          .attr('dy', 0)
          .text(firstLine);
        
        // Add second line if it exists
        if (secondLine) {
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(secondLine);
        }
      });

    // Track interaction state
    let isInteracting = false;
    let autoRotationEnabled = true;

    // Add mouse enter/leave handlers to pause/resume rotation
    svg.on('mouseenter', () => { autoRotationEnabled = false; })
       .on('mouseleave', () => { 
         setTimeout(() => { autoRotationEnabled = true; }, 500); 
       });

    // Update visual elements
    const updateVisuals = () => {
      link
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x || 0 : 0))
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y || 0 : 0))
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x || 0 : 0))
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y || 0 : 0));

      nodeGroup
        .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

      labels
        .attr('transform', d => {
          const x = d.x || 0;
          const y = d.y || 0;
          return `translate(${x}, ${y - getNodeSize(d.id) - 12})`;
        });
    };

    // Update simulation tick function
    simulation.on('tick', updateVisuals);

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, handleDocumentOpen]);

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
