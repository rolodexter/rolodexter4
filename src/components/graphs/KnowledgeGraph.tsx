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
  type: 'document' | 'tag' | 'status' | 'mission';
  x?: number;
  y?: number;
  category?: string;
  priority?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  confidence: number;
  type: 'document-document' | 'document-tag' | 'mission-mission' | 'mission-document';
  relationship?: string;
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

// Add minimal TaskBar component
const TaskBar: React.FC = () => {
  return (
    <div 
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '48px',
        width: '384px',
        height: '48px',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 15%, rgba(255,255,255,0.25) 85%, rgba(255,255,255,0) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '8px',
        zIndex: 9999,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          overflow: 'hidden',
          opacity: 1,
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          cursor: 'pointer',
          marginTop: '-18px'  // This will make it protrude 30% (18px) above the 48px taskbar height
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget;
          target.style.transform = 'scale(1.1)';
          target.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget;
          target.style.transform = 'scale(1)';
          target.style.opacity = '0.5';
        }}
      >
        <img
          src="/static/SQUARE_LOGO.jpg"
          alt="Rolodexter Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'filter 0.3s ease'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.filter = 'brightness(1.2)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.filter = 'none';
          }}
          onError={(e) => {
            console.error('Error loading logo:', e);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            // Show fallback icon
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.style.width = '24px';
              fallback.style.height = '24px';
              fallback.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/%3E%3C/svg%3E")`;
              fallback.style.backgroundSize = 'contain';
              fallback.style.backgroundPosition = 'center';
              fallback.style.backgroundRepeat = 'no-repeat';
              parent.appendChild(fallback);
            }
          }}
        />
      </div>
    </div>
  );
};

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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

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

        // Add mission nodes and their relationships
        const missionNodes: Node[] = [
          {
            id: 'mission-1m',
            title: 'Mission: Grow to 1 Million Humans',
            path: '/missions/growth',
            type: 'mission',
            category: 'growth',
            priority: 1
          },
          {
            id: 'mission-1k',
            title: 'Mission: Grow to 1,000 Autonomous Agents',
            path: '/missions/agents',
            type: 'mission',
            category: 'growth',
            priority: 2
          },
          {
            id: 'mission-transparency',
            title: 'Mission: Full Transparency',
            path: '/missions/transparency',
            type: 'mission',
            category: 'ethics',
            priority: 2
          }
        ];

        // Add mission relationships
        const missionLinks: Link[] = [
          {
            source: 'mission-1m',
            target: 'mission-1k',
            confidence: 1,
            type: 'mission-mission',
            relationship: 'enables'
          },
          {
            source: 'mission-1k',
            target: 'mission-transparency',
            confidence: 1,
            type: 'mission-mission',
            relationship: 'requires'
          }
        ];

        // Connect missions to relevant documents
        const documentLinks = jsonData.documents
          .filter((doc: Node) => doc.path.includes('mission') || doc.path.includes('growth') || doc.path.includes('transparency'))
          .map((doc: Node) => ({
            source: missionNodes.find(m => 
              (m.category === 'growth' && doc.path.includes('growth')) ||
              (m.category === 'ethics' && doc.path.includes('transparency'))
            )?.id || missionNodes[0].id,
            target: doc.id,
            confidence: 0.8,
            type: 'mission-document',
            relationship: 'implements'
          }));

        // Combine all nodes and links
        const enhancedData = {
          documents: [...jsonData.documents, ...missionNodes],
          references: {
            ...jsonData.references,
            missions: [...missionLinks, ...documentLinks]
          }
        };

        setData(enhancedData);
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
    const getNodeSize = (node: Node) => {
      if (node.type === 'mission') {
        return 12;  // Larger size for mission nodes
      }

      const connectionCount = connections.get(node.id) || 0;
      const baseSize = 8;
      
      const allConnections = Array.from(connections.values());
      const sortedConnections = [...allConnections].sort((a, b) => a - b);
      const threshold = sortedConnections[Math.floor(sortedConnections.length * 0.8)];
      
      if (connectionCount > threshold) {
        const scaleFactor = 1 + Math.pow((connectionCount - threshold) / threshold, 0.6);
        return baseSize * (1.2 + scaleFactor * 0.3);
      }
      
      return baseSize * (1 + (connectionCount / threshold) * 0.2);
    };

    const getNodeColor = (node: Node) => {
      if (node.type === 'mission') {
        // Use darker grays for mission nodes based on priority
        switch (node.priority) {
          case 1:
            return '#1a1a1a';  // Darkest gray for highest priority
          case 2:
            return '#404040';  // Dark gray for medium priority
          default:
            return '#666666';  // Medium gray for lower priority
        }
      }

      // Original color logic for other nodes
      const connectionCount = connections.get(node.id) || 0;
      const allConnections = Array.from(connections.values());
      const sortedConnections = [...allConnections].sort((a, b) => a - b);
      const threshold = sortedConnections[Math.floor(sortedConnections.length * 0.8)];
      
      const baseValue = 220;
      let darkenAmount;
      
      if (connectionCount > threshold) {
        const ratio = (connectionCount - threshold) / threshold;
        darkenAmount = Math.min(160, 80 + Math.pow(ratio, 1.5) * 80);
      } else {
        darkenAmount = Math.min(80, (connectionCount / threshold) * 80);
      }
      
      const intensity = Math.max(baseValue - darkenAmount, 60);
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
        .radius(d => getNodeSize(d) * 3)
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
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        isDragging.current = true;
      })
      .on('drag', (event, d) => {
        d.fx = (event.x - currentTransform.x) / currentTransform.k;
        d.fy = (event.y - currentTransform.y) / currentTransform.k;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        // Reset dragging state immediately
        isDragging.current = false;
      });

    // Create the link elements with hover effects
    const link = linksGroup
      .selectAll<SVGLineElement, Link>('line')
      .data(links)
      .join('line')
      .attr('class', 'relationship-line')
      .attr('stroke', (d: Link) => {
        if (d.type === 'mission-mission' || d.type === 'mission-document') {
          return '#404040';  // Darker gray for mission links
        }
        return '#999';  // Original color for other links
      })
      .attr('stroke-opacity', (d: Link) => {
        if (d.type === 'mission-mission') {
          return 0.6;  // More visible for mission-to-mission links
        }
        return 0.3;  // Original opacity for other links
      })
      .attr('stroke-width', (d: Link) => {
        if (d.type === 'mission-mission') {
          return Math.sqrt(d.confidence || 1) * 1;  // Thicker for mission links
        }
        return Math.sqrt(d.confidence || 1) * 0.5;  // Original width for other links
      })
      .attr('stroke-dasharray', (d: Link) => {
        if (d.type === 'mission-document') {
          return '3,3';  // Dashed lines for mission-to-document connections
        }
        return null;  // Solid lines for other connections
      })
      .style('transition', 'all 0.3s ease')
      .on('mouseover', function(event: MouseEvent, d: Link) {
        const line = d3.select(this);
        
        // Enhance the hovered line
        line.transition()
          .duration(300)
          .attr('stroke', '#666')  // Darker gray on hover
          .attr('stroke-opacity', 0.8)
          .attr('stroke-width', function(this: SVGLineElement) { 
            const d = d3.select(this).datum() as Link;
            return Math.sqrt(d.confidence || 1) * 2; 
          });

        // Highlight connected nodes
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;

        nodeGroup.each(function(n: Node) {
          if (n.id === sourceId || n.id === targetId) {
            const node = d3.select(this);
            node.select('.node-circle')
              .transition()
              .duration(300)
              .style('filter', 'url(#glow)')
              .style('stroke', '#666')
              .style('stroke-width', '2px')
              .style('stroke-opacity', 0.8);

            // Highlight connected node labels
            labels.filter(label => label.id === n.id)
              .transition()
              .duration(300)
              .style('opacity', 1)
              .style('font-weight', 'bold');
          }
        });

        // Show relationship tooltip if available
        if (d.relationship) {
          const [x, y] = [event.pageX, event.pageY];
          const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'relationship-tooltip')
            .style('position', 'absolute')
            .style('left', `${x + 10}px`)
            .style('top', `${y - 10}px`)
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '4px 8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('opacity', '0')
            .text(d.relationship);

          tooltip.transition()
            .duration(200)
            .style('opacity', '1');
        }
      })
      .on('mouseout', function(event: MouseEvent, d: Link) {
        const line = d3.select(this);
        
        // Reset line appearance
        line.transition()
          .duration(300)
          .attr('stroke', function(this: SVGLineElement) {
            const d = d3.select(this).datum() as Link;
            if (d.type === 'mission-mission' || d.type === 'mission-document') {
              return '#404040';
            }
            return '#999';
          })
          .attr('stroke-opacity', function(this: SVGLineElement) {
            const d = d3.select(this).datum() as Link;
            if (d.type === 'mission-mission') {
              return 0.6;
            }
            return 0.3;
          })
          .attr('stroke-width', function(this: SVGLineElement) {
            const d = d3.select(this).datum() as Link;
            if (d.type === 'mission-mission') {
              return Math.sqrt(d.confidence || 1) * 1;
            }
            return Math.sqrt(d.confidence || 1) * 0.5;
          });

        // Reset connected nodes
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;

        nodeGroup.each(function(n: Node) {
          if (n.id === sourceId || n.id === targetId) {
            const node = d3.select(this);
            node.select('.node-circle')
              .transition()
              .duration(300)
              .style('filter', null)
              .style('stroke', '#fff')
              .style('stroke-width', n.type === 'mission' ? '2px' : '0.5px')
              .style('stroke-opacity', n.type === 'mission' ? 0.8 : 0.3);

            // Reset connected node labels
            labels.filter(label => label.id === n.id)
              .transition()
              .duration(300)
              .style('opacity', 0.7)
              .style('font-weight', 'normal');
          }
        });

        // Remove relationship tooltip
        d3.selectAll('.relationship-tooltip')
          .transition()
          .duration(200)
          .style('opacity', '0')
          .remove();
      });

    // Create the node elements with drag behavior
    const nodeGroup = nodesGroup
      .selectAll('g')
      .data(data.documents)
      .join('g');

    // Add click handlers directly to the node group
    nodeGroup.on('click', (event: MouseEvent, d: Node) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Calculate total movement during the click
      const dx = event.movementX;
      const dy = event.movementY;
      const totalMovement = Math.sqrt(dx * dx + dy * dy);
      
      // Only open if there was minimal movement (not a drag)
      if (totalMovement < 5) {
        const path = d.path;
        const url = `/api/document/${encodeURIComponent(path.replace(/^\//, ''))}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });

    // Add invisible larger circle for better click target
    nodeGroup
      .append('circle')
      .attr('r', d => getNodeSize(d) * 1.5)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .call(drag as any);

    // Add visible circle for nodes with hover effects
    nodeGroup
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d))
      .style('cursor', 'pointer')
      .style('stroke', 'none')
      .style('pointer-events', 'none')
      .style('transition', 'all 0.3s ease');

    // Add hover glow filter
    const defs = svg.append('defs');
    
    // Create glow effect
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');

    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Add hover effects to node groups
    nodeGroup
      .on('mouseover', function(event: MouseEvent, d: Node) {
        const group = d3.select(this);
        
        // Scale up the invisible click target
        group.select('circle:first-child')
          .transition()
          .duration(300)
          .attr('r', function(d: any) { return getNodeSize(d) * 2; });

        // Enhance the visible node
        group.select('.node-circle')
          .transition()
          .duration(300)
          .attr('r', function(d: any) { return getNodeSize(d) * 1.3; })
          .style('filter', 'url(#glow)')
          .style('stroke', 'none');

        // Highlight connected nodes and links
        const nodeId = d.id;
        const connectedNodes = new Set();
        
        link.each(function(l: Link) {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;
          
          if (sourceId === nodeId || targetId === nodeId) {
            connectedNodes.add(sourceId);
            connectedNodes.add(targetId);
            d3.select(this)
              .transition()
              .duration(300)
              .attr('stroke', '#4299e1')
              .attr('stroke-opacity', 0.6)
              .attr('stroke-width', function(d: any) { return Math.sqrt(d.confidence || 1) * 1.5; });
          }
        });

        // Dim unconnected nodes
        nodeGroup.each(function(n: Node) {
          if (!connectedNodes.has(n.id) && n.id !== nodeId) {
            d3.select(this).select('.node-circle')
              .transition()
              .duration(300)
              .style('opacity', 0.3);
          }
        });

        // Enhance connected node labels
        labels.each(function(n: Node) {
          if (connectedNodes.has(n.id) || n.id === nodeId) {
            d3.select(this)
              .transition()
              .duration(300)
              .style('opacity', 1)
              .style('font-weight', 'bold');
          } else {
            d3.select(this)
              .transition()
              .duration(300)
              .style('opacity', 0.3);
          }
        });
      })
      .on('mouseout', function(event: MouseEvent, d: Node) {
        const group = d3.select(this);
        
        // Reset click target size
        group.select('circle:first-child')
          .transition()
          .duration(300)
          .attr('r', function(d: any) { return getNodeSize(d) * 1.5; });

        // Reset node appearance
        group.select('.node-circle')
          .transition()
          .duration(300)
          .attr('r', function(d: any) { return getNodeSize(d); })
          .style('filter', null)
          .style('stroke', 'none');

        // Reset all links
        link.transition()
          .duration(300)
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0.3)
          .attr('stroke-width', d => Math.sqrt(d.confidence || 1) * 0.5);

        // Reset all nodes and labels
        nodeGroup.selectAll('.node-circle')
          .transition()
          .duration(300)
          .style('opacity', 1);

        labels.transition()
          .duration(300)
          .style('opacity', 0.7)
          .style('font-weight', 'normal');
      });

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
          return `translate(${x}, ${y - getNodeSize(d) - 12})`;
        });
    };

    // Update simulation tick function
    simulation.on('tick', updateVisuals);

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [data, dimensions, handleDocumentOpen]);

  // Add zoom control handlers
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.scaleBy, 1.5);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.scaleBy, 0.75);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

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
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg 
          ref={svgRef} 
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            zIndex: 1 
          }} 
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
          <TaskBar />
        </div>
      </div>
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
